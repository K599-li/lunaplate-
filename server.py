from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse
from urllib.request import urlopen
import json
import os
import re


ROOT = Path(__file__).resolve().parent
THEMEALDB_BASE = "https://www.themealdb.com/api/json/v1/1"
MAX_LIST_QUERIES = 5
MAX_DETAIL_MEALS = 10


DATA_DIR = ROOT / "data"


def load_json(name):
    with (DATA_DIR / name).open(encoding="utf-8") as data_file:
        return json.load(data_file)


EXERCISES = load_json("exercises.json")
RECOMMENDATION_RULES = load_json("recommendation-rules.json")
MEAL_PHASE_PROFILES = RECOMMENDATION_RULES["mealPhaseProfiles"]
SYMPTOM_MEAL_TAGS = RECOMMENDATION_RULES["symptomMealTags"]
DIET_WORDS = RECOMMENDATION_RULES["dietWords"]
DIETARY_QUERY_FALLBACKS = RECOMMENDATION_RULES["dietaryQueryFallbacks"]
CUISINE_PROFILES = RECOMMENDATION_RULES["cuisineProfiles"]


def bool_param(params, name):
    return params.get(name, ["false"])[0].lower() == "true"


def list_param(params, name):
    value = params.get(name, [""])[0]
    return [item.strip().lower() for item in value.split(",") if item.strip()]


def contains_any(text, words):
    return any(word in text for word in words)


def build_meal_query_plan(inputs):
    profile = MEAL_PHASE_PROFILES.get(inputs["phase"], {})
    pantry_queries = [{"type": "ingredient", "value": item} for item in inputs["pantry"][:4]]
    cuisine_queries = CUISINE_PROFILES.get(inputs["cuisine_style"], CUISINE_PROFILES["balanced"])["queries"]
    dietary_queries = []

    if inputs["vegan"]:
        dietary_queries.extend(DIETARY_QUERY_FALLBACKS["vegan"])
    elif inputs["vegetarian"]:
        dietary_queries.extend(DIETARY_QUERY_FALLBACKS["vegetarian"])

    phase_queries = [
        *[{"type": "ingredient", "value": value} for value in profile.get("ingredients", [])],
        *[{"type": "search", "value": value} for value in profile.get("searches", [])],
    ]

    return [*cuisine_queries, *pantry_queries, *dietary_queries, *phase_queries][:MAX_LIST_QUERIES]


def fetch_themealdb_json(url):
    with urlopen(url, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_meal_list(query):
    encoded = quote(query["value"].replace(" ", "_"))
    url = f"{THEMEALDB_BASE}/filter.php?i={encoded}"
    if query["type"] == "category":
        url = f"{THEMEALDB_BASE}/filter.php?c={encoded}"
    elif query["type"] == "area":
        url = f"{THEMEALDB_BASE}/filter.php?a={encoded}"
    elif query["type"] == "search":
        url = f"{THEMEALDB_BASE}/search.php?s={quote(query['value'])}"
    return fetch_themealdb_json(url).get("meals") or []


def fetch_meal_detail(meal_id):
    data = fetch_themealdb_json(f"{THEMEALDB_BASE}/lookup.php?i={quote(str(meal_id))}")
    meals = data.get("meals") or []
    return meals[0] if meals else None


def extract_ingredients(api_meal):
    ingredients = []
    for index in range(1, 21):
        ingredient = (api_meal.get(f"strIngredient{index}") or "").strip()
        measure = (api_meal.get(f"strMeasure{index}") or "").strip()
        if ingredient:
            ingredients.append(" ".join(part for part in [measure, ingredient] if part).lower())
    return ingredients


def split_steps(instructions):
    clean = re.sub(r"\s+", " ", instructions.replace("\r", "\n")).strip()
    if not clean:
        return ["Follow the source recipe instructions."]
    return [
        step if step.endswith(".") else f"{step}."
        for step in [item.strip() for item in re.split(r"(?:\.\s+|\n+)", clean)]
        if len(step) > 18
    ][:5]


def infer_tags(text, ingredients, api_meal):
    tags = set()
    all_text = f"{text} {' '.join(ingredients)}"
    animal_words = DIET_WORDS["animal"]
    dairy_words = DIET_WORDS["dairy"]
    gluten_words = DIET_WORDS["gluten"]
    non_vegan_words = [word for word in animal_words if word not in set(DIET_WORDS["nonVeganExceptions"])]

    if contains_any(all_text, ["lentil", "spinach", "beef", "chickpea", "bean", "liver", "mussel"]):
        tags.add("iron")
    if contains_any(all_text, ["almond", "pumpkin seed", "cashew", "spinach", "bean", "chickpea", "dark chocolate"]):
        tags.add("magnesium")
    if contains_any(all_text, ["chicken", "salmon", "tuna", "egg", "bean", "lentil", "tofu", "beef", "yogurt"]):
        tags.add("protein")
    if contains_any(all_text, ["bean", "lentil", "chickpea", "vegetable", "broccoli", "spinach", "oat", "rice"]):
        tags.add("fiber")
    if contains_any(all_text, ["salmon", "avocado", "olive oil", "nuts", "almond", "tuna"]):
        tags.add("healthy fat")
    if contains_any(all_text, ["tomato", "berry", "orange", "lemon", "pepper", "spinach", "broccoli"]):
        tags.add("antioxidants")
    if contains_any(all_text, ["soup", "stew", "curry", "broth", "hotpot", "porridge"]):
        tags.add("comfort")
    if contains_any(all_text, ["soup", "broth", "cucumber", "tomato", "watermelon"]):
        tags.add("hydrating")
    if contains_any(all_text, ["chocolate", "sweet", "honey", "dessert", "cake", "banana", "coconut"]):
        tags.add("craving-friendly")
    if api_meal.get("strCategory") == "Vegetarian" or not contains_any(all_text, non_vegan_words):
        tags.add("vegetarian")
    if not contains_any(all_text, animal_words):
        tags.add("vegan")
    if not contains_any(all_text, dairy_words):
        tags.add("dairy-free")
    if not contains_any(all_text, gluten_words):
        tags.add("gluten-free")
    if len(ingredients) <= 8:
        tags.add("prep")
    if contains_any(all_text, ["salad", "lemon", "lime", "cucumber", "fresh"]):
        tags.add("fresh")

    return list(tags)[:9]


def infer_meal_type(text, category=""):
    combined = f"{text} {category}".lower()
    if contains_any(combined, ["breakfast", "pancake", "oat", "egg", "omelette", "yogurt"]):
        return "breakfast"
    if contains_any(combined, ["dessert", "cake", "cookie", "chocolate", "smoothie"]):
        return "snack"
    if contains_any(combined, ["salad", "sandwich", "wrap", "soup"]):
        return "lunch"
    return "dinner"


def infer_cook_time(ingredients, steps):
    base = 8 + len(ingredients) * 1.1 + len(steps) * 2
    return min(45, max(10, round(base / 5) * 5))


def normalize_themealdb_meal(api_meal):
    ingredients = extract_ingredients(api_meal)
    steps = split_steps(api_meal.get("strInstructions") or "")
    text = f"{api_meal.get('strMeal') or ''} {api_meal.get('strCategory') or ''} {api_meal.get('strArea') or ''} {api_meal.get('strTags') or ''} {' '.join(ingredients)} {api_meal.get('strInstructions') or ''}".lower()
    tags = infer_tags(text, ingredients, api_meal)
    return {
        "id": api_meal.get("idMeal"),
        "name": api_meal.get("strMeal"),
        "type": infer_meal_type(text, api_meal.get("strCategory") or ""),
        "time": infer_cook_time(ingredients, steps),
        "tags": tags,
        "ingredients": ingredients,
        "steps": steps,
        "image": api_meal.get("strMealThumb"),
        "source": api_meal.get("strSource") or api_meal.get("strYoutube") or "TheMealDB",
        "area": api_meal.get("strArea") or "",
        "category": api_meal.get("strCategory") or "",
        "text": text,
    }


def matches_meal_cuisine(meal, cuisine_style):
    profile = CUISINE_PROFILES.get(cuisine_style, CUISINE_PROFILES["balanced"])
    if not profile["words"]:
        return False
    return contains_any(f"{meal.get('name', '')} {meal.get('area', '')} {meal.get('category', '')} {meal.get('text', '')}".lower(), profile["words"])


def score_meal(meal, inputs):
    score = 0
    tags = set(meal["tags"])

    for tag in MEAL_PHASE_PROFILES.get(inputs["phase"], {}).get("tags", []):
        if tag in tags:
            score += 10

    for symptom in inputs["symptoms"]:
        for tag in SYMPTOM_MEAL_TAGS.get(symptom, []):
            if tag in tags:
                score += 8

    for item in inputs["pantry"]:
        if any(item in ingredient.lower() or ingredient.lower() in item for ingredient in meal["ingredients"]):
            score += 9

    if meal["time"] <= inputs["cook_time"]:
        score += 6
    else:
        score -= 120

    if inputs["cuisine_style"] != "balanced":
        score += 14 if matches_meal_cuisine(meal, inputs["cuisine_style"]) else -8

    if inputs["vegan"] and "vegan" not in tags:
        score -= 140
    if inputs["vegetarian"] and "vegetarian" not in tags and "vegan" not in tags:
        score -= 140
    if inputs["gluten_free"] and "gluten-free" not in tags:
        score -= 140
    if inputs["dairy_free"] and "dairy-free" not in tags:
        score -= 140

    return score


def meal_payload(meal, score):
    return {
        "id": meal["id"],
        "name": meal["name"],
        "type": meal["type"],
        "time": meal["time"],
        "tags": meal["tags"],
        "ingredients": meal["ingredients"],
        "steps": meal["steps"],
        "image": meal.get("image"),
        "source": meal.get("source") or "TheMealDB",
        "backendScore": score,
    }


def fetch_themealdb_meals(inputs):
    basic_meals = []
    for query in build_meal_query_plan(inputs):
        basic_meals.extend(fetch_meal_list(query))

    unique = {}
    for meal in basic_meals:
        meal_id = meal.get("idMeal")
        if meal_id and meal_id not in unique:
            unique[meal_id] = meal

    detail_meals = []
    for meal_id in list(unique.keys())[:MAX_DETAIL_MEALS]:
        detail = fetch_meal_detail(meal_id)
        if detail:
            detail_meals.append(normalize_themealdb_meal(detail))

    ranked = sorted(
        [(meal, score_meal(meal, inputs)) for meal in detail_meals],
        key=lambda item: item[1],
        reverse=True,
    )
    return [meal_payload(meal, score) for meal, score in ranked if score > -50][:8]


def score_exercise(exercise, phase, symptoms):
    score = exercise["phaseScore"].get(phase, 0)
    for symptom in symptoms:
        score += exercise["symptomScore"].get(symptom, 0)
    duration = exercise["duration"].get(phase, 10)
    if "fatigue" in symptoms and duration <= 10:
        score += 5
    if "cramps" in symptoms and exercise["id"] in {"cat-cow", "child-pose", "hip-rock"}:
        score += 5
    if "high_energy" in symptoms and phase != "menstrual" and duration >= 12:
        score += 4
    return score


def exercise_payload(exercise, phase):
    duration = exercise["duration"].get(phase, 10)
    return {
        "id": exercise["id"],
        "name": exercise["name"],
        "visualType": exercise["visualType"],
        "bodyParts": exercise["bodyParts"],
        "targetMuscles": exercise["targetMuscles"],
        "equipments": exercise["equipments"],
        "instructions": exercise["instructions"],
        "duration": duration,
        "summary": exercise["summary"],
        "focus": exercise["focus"],
        "safety": exercise["safety"],
        "media": {
            "type": "image",
            "url": f"assets/movement/{exercise['image']}",
            "source": "LunaPlate generated guide",
        },
        "source": "LunaPlate movement API",
    }


class LunaPlateHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".js": "text/javascript",
    }

    def translate_path(self, path):
        path = urlparse(path).path
        path = path.lstrip("/")
        return str((ROOT / path).resolve())

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("", "/"):
            self.path = "/index.html"
            super().do_GET()
            return
        if parsed.path == "/api/meals":
            self.handle_meals(parsed)
            return
        if parsed.path == "/api/female-exercises":
            self.handle_female_exercises(parsed)
            return
        super().do_GET()

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_meals(self, parsed):
        params = parse_qs(parsed.query)
        inputs = {
            "phase": params.get("phase", ["luteal"])[0],
            "symptoms": list_param(params, "symptoms"),
            "cuisine_style": params.get("cuisineStyle", ["balanced"])[0],
            "vegetarian": bool_param(params, "vegetarian"),
            "vegan": bool_param(params, "vegan"),
            "gluten_free": bool_param(params, "glutenFree"),
            "dairy_free": bool_param(params, "dairyFree"),
            "pantry": list_param(params, "pantry"),
            "cook_time": 35,
        }
        try:
            inputs["cook_time"] = max(5, min(60, int(params.get("cookTime", ["35"])[0])))
        except ValueError:
            inputs["cook_time"] = 35
        if inputs["vegan"]:
            inputs["vegetarian"] = True
            inputs["dairy_free"] = True

        try:
            meals = fetch_themealdb_meals(inputs)
        except Exception as error:
            self.send_json(
                {
                    "source": "TheMealDB",
                    "usingFallback": False,
                    "error": str(error),
                    "phase": inputs["phase"],
                    "symptoms": inputs["symptoms"],
                    "cuisineStyle": inputs["cuisine_style"],
                    "meals": [],
                },
                status=502,
            )
            return

        payload = {
            "source": "TheMealDB",
            "usingFallback": False,
            "phase": inputs["phase"],
            "symptoms": inputs["symptoms"],
            "cuisineStyle": inputs["cuisine_style"],
            "meals": meals,
        }
        self.send_json(payload)

    def handle_female_exercises(self, parsed):
        params = parse_qs(parsed.query)
        phase = params.get("phase", ["luteal"])[0]
        symptoms = [item for item in params.get("symptoms", [""])[0].split(",") if item]
        try:
            limit = max(1, min(20, int(params.get("limit", ["8"])[0])))
        except ValueError:
            limit = 8

        ranked = sorted(EXERCISES, key=lambda item: score_exercise(item, phase, symptoms), reverse=True)
        payload = {
            "source": "LunaPlate movement API",
            "phase": phase,
            "symptoms": symptoms,
            "exercises": [exercise_payload(item, phase) for item in ranked[:limit]],
        }
        self.send_json(payload)


def main():
    os.chdir(ROOT)
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "5178"))
    server = ThreadingHTTPServer((host, port), LunaPlateHandler)
    print(f"LunaPlate server running at http://{host}:{port}/")
    server.serve_forever()


if __name__ == "__main__":
    main()
