from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, unquote, urlencode, urlparse
from urllib.request import urlopen
import json
import os
import re


ROOT = Path(__file__).resolve().parent
THEMEALDB_BASE = "https://www.themealdb.com/api/json/v1/1"
MAX_LIST_QUERIES = 10
MAX_DETAIL_MEALS = 18
MAX_POST_BODY_BYTES = 16 * 1024
VALID_PHASES = {"menstrual", "follicular", "ovulation", "ovulatory", "luteal"}
POST_FIELDS = {
    "phase", "symptoms", "cuisineStyle", "vegetarian", "vegan", "glutenFree",
    "dairyFree", "pantry", "cookTime", "cookTimeMin", "search", "hour", "mealType", "limit",
}

MEAL_TIME_PROFILES = {
    "breakfast": [
        {"type": "search", "value": "breakfast"},
        {"type": "ingredient", "value": "oats"},
        {"type": "ingredient", "value": "eggs"},
    ],
    "lunch": [
        {"type": "search", "value": "salad"},
        {"type": "search", "value": "rice"},
        {"type": "search", "value": "soup"},
    ],
    "snack": [
        {"type": "search", "value": "smoothie"},
        {"type": "search", "value": "dessert"},
        {"type": "ingredient", "value": "banana"},
    ],
    "dinner": [
        {"type": "search", "value": "stew"},
        {"type": "search", "value": "curry"},
        {"type": "search", "value": "fish"},
    ],
}


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

INGREDIENT_ALIASES = {
    "燕麦": "oats",
    "燕麦片": "oats",
    "蓝莓": "blueberry",
    "核桃": "walnuts",
    "牛油果": "avocado",
    "鳄梨": "avocado",
    "全麦吐司": "whole wheat bread",
    "吐司": "bread",
    "鸡蛋": "egg",
    "鸡肉": "chicken",
    "三文鱼": "salmon",
    "鲑鱼": "salmon",
    "米饭": "rice",
    "菠菜": "spinach",
    "酸奶": "yogurt",
    "豆腐": "tofu",
    "扁豆": "lentil",
    "鹰嘴豆": "chickpea",
    "西兰花": "broccoli",
    "番茄": "tomato",
    "香蕉": "banana",
    "蘑菇": "mushroom",
}


def bool_param(params, name):
    return params.get(name, ["false"])[0].lower() == "true"


def list_param(params, name):
    value = params.get(name, [""])[0]
    return [item.strip().lower() for item in value.split(",") if item.strip()]


def normalize_food_items(items):
    normalized = []
    for item in items:
        mapped = INGREDIENT_ALIASES.get(item, item)
        if mapped and mapped not in normalized:
            normalized.append(mapped)
    return normalized


def contains_any(text, words):
    return any(word in text for word in words)


def ingredient_matches_query(item, ingredient):
    clean_item = item.strip().lower()
    clean_ingredient = ingredient.strip().lower()
    return bool(clean_item and (clean_item in clean_ingredient or clean_ingredient in clean_item))


def build_meal_query_plan(inputs):
    profile = MEAL_PHASE_PROFILES.get(inputs["phase"], {})
    meal_type_queries = MEAL_TIME_PROFILES.get(inputs.get("target_meal_type"), [])
    search_query = inputs.get("search_query", "").strip()
    search_queries = []
    if search_query:
        search_queries.append({"type": "search", "value": search_query})
        first_word = search_query.split()[0]
        if len(first_word) > 2:
            search_queries.append({"type": "ingredient", "value": first_word})
    pantry_queries = [{"type": "ingredient", "value": item} for item in inputs["pantry"][:4]]
    pantry_search_queries = [{"type": "search", "value": item} for item in inputs["pantry"][:2]]
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

    return [*search_queries, *pantry_queries, *pantry_search_queries, *meal_type_queries, *cuisine_queries, *dietary_queries, *phase_queries][:MAX_LIST_QUERIES]


def meal_type_for_hour(hour):
    if 5 <= hour <= 10:
        return "breakfast"
    if 11 <= hour <= 14:
        return "lunch"
    if 15 <= hour <= 17:
        return "snack"
    return "dinner"


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


def infer_calories(meal_type, ingredients, tags, text):
    base_by_type = {
        "breakfast": 360,
        "lunch": 430,
        "dinner": 480,
        "snack": 240,
    }
    calories = base_by_type.get(meal_type, 420) + len(ingredients) * 8
    tag_set = set(tags)
    if "protein" in tag_set:
        calories += 45
    if "healthy fat" in tag_set:
        calories += 65
    if "fiber" in tag_set:
        calories += 20
    if "craving-friendly" in tag_set:
        calories += 70
    if contains_any(text, ["cream", "butter", "cheese", "fried", "bacon", "sausage", "cake"]):
        calories += 90
    if contains_any(text, ["salad", "soup", "cucumber", "broth"]):
        calories -= 55
    if contains_any(text, ["rice", "pasta", "noodle", "potato", "bread"]):
        calories += 60
    return int(min(760, max(160, round(calories / 10) * 10)))


def infer_macros(meal_type, ingredients, tags, text, calories):
    splits_by_type = {
        "breakfast": (0.18, 0.55, 0.27),
        "lunch": (0.24, 0.48, 0.28),
        "dinner": (0.28, 0.44, 0.28),
        "snack": (0.14, 0.56, 0.30),
    }
    protein_share, carb_share, fat_share = splits_by_type.get(meal_type, (0.22, 0.50, 0.28))
    tag_set = set(tags)

    if "protein" in tag_set or contains_any(text, ["chicken", "beef", "salmon", "tuna", "egg", "tofu", "lentil", "chickpea", "shrimp", "pork", "turkey"]):
        protein_share += 0.08
        carb_share -= 0.05
        fat_share -= 0.03
    if contains_any(text, ["rice", "pasta", "noodle", "potato", "bread", "oat", "quinoa"]):
        carb_share += 0.08
        protein_share -= 0.04
        fat_share -= 0.04
    if "healthy fat" in tag_set or contains_any(text, ["avocado", "olive oil", "nuts", "cream", "butter", "cheese", "coconut"]):
        fat_share += 0.08
        carb_share -= 0.06
        protein_share -= 0.02

    total = protein_share + carb_share + fat_share
    protein_share, carb_share, fat_share = (protein_share / total, carb_share / total, fat_share / total)
    return {
        "protein": max(4, round(calories * protein_share / 4)),
        "carbs": max(6, round(calories * carb_share / 4)),
        "fat": max(3, round(calories * fat_share / 9)),
    }


def normalize_themealdb_meal(api_meal):
    ingredients = extract_ingredients(api_meal)
    steps = split_steps(api_meal.get("strInstructions") or "")
    text = f"{api_meal.get('strMeal') or ''} {api_meal.get('strCategory') or ''} {api_meal.get('strArea') or ''} {api_meal.get('strTags') or ''} {' '.join(ingredients)} {api_meal.get('strInstructions') or ''}".lower()
    tags = infer_tags(text, ingredients, api_meal)
    meal_type = infer_meal_type(text, api_meal.get("strCategory") or "")
    calories = infer_calories(meal_type, ingredients, tags, text)
    return {
        "id": api_meal.get("idMeal"),
        "name": api_meal.get("strMeal"),
        "type": meal_type,
        "time": infer_cook_time(ingredients, steps),
        "calories": calories,
        "macros": infer_macros(meal_type, ingredients, tags, text, calories),
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
    target_meal_type = inputs.get("target_meal_type")
    meal_text = f"{meal.get('name', '')} {meal.get('category', '')} {meal.get('text', '')} {' '.join(meal.get('ingredients', []))}".lower()
    search_query = inputs.get("search_query", "").strip().lower()

    if target_meal_type:
        score += 26 if meal["type"] == target_meal_type else -16
        if target_meal_type == "breakfast" and contains_any(meal_text, ["oat", "porridge", "yogurt", "banana", "berry", "egg"]):
            score += 18
        if target_meal_type == "snack" and contains_any(meal_text, ["smoothie", "banana", "berry", "nuts", "yogurt"]):
            score += 16

    for tag in MEAL_PHASE_PROFILES.get(inputs["phase"], {}).get("tags", []):
        if tag in tags:
            score += 10

    if inputs["phase"] == "menstrual":
        if contains_any(meal_text, ["oat", "lentil", "spinach", "salmon", "soup", "stew", "porridge", "chickpea", "bean"]):
            score += 14
        if contains_any(meal_text, ["bacon", "sausage", "black pudding", "fried", "pork"]):
            score -= 34

    for symptom in inputs["symptoms"]:
        for tag in SYMPTOM_MEAL_TAGS.get(symptom, []):
            if tag in tags:
                score += 8

    if search_query:
        search_terms = [term for term in re.split(r"\s+", search_query) if len(term) > 1]
        matched_terms = sum(1 for term in search_terms if term in meal_text)
        if matched_terms:
            score += 20 + matched_terms * 8
        else:
            score -= 24

    pantry_matches = 0
    for item in inputs["pantry"]:
        item_text = item.strip().lower()
        if not item_text:
            continue
        if item_text in (meal.get("name") or "").lower():
            score += 24
            pantry_matches += 1
        elif any(ingredient_matches_query(item_text, ingredient) for ingredient in meal["ingredients"]):
            score += 18
            pantry_matches += 1
        elif item_text in meal_text:
            score += 10
            pantry_matches += 1
    if inputs["pantry"]:
        score += min(pantry_matches, 3) * 8
        if pantry_matches == 0:
            score -= 28

    if inputs["cook_time_min"] <= meal["time"] <= inputs["cook_time"]:
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
        "calories": meal.get("calories"),
        "macros": meal.get("macros"),
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
    return [meal_payload(meal, score) for meal, score in ranked if score > -50][:18]


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
        relative_path = unquote(urlparse(path).path).lstrip("/")
        requested = (ROOT / relative_path).resolve()
        try:
            requested.relative_to(ROOT)
        except ValueError:
            return str(ROOT / "__not_found__")
        return str(requested)

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ("", "/"):
            self.path = "/index.html"
            super().do_GET()
            return
        if parsed.path == "/api/meals":
            self.handle_meals(parsed)
            return
        if parsed.path == "/api/today-meal":
            self.handle_today_meal(parsed)
            return
        if parsed.path == "/api/female-exercises":
            self.handle_female_exercises(parsed)
            return
        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        handlers = {
            "/api/meals": self.handle_meals,
            "/api/today-meal": self.handle_today_meal,
            "/api/female-exercises": self.handle_female_exercises,
        }
        handler = handlers.get(parsed.path)
        if handler is None:
            self.send_json({"error": "Not found"}, status=404)
            return
        if self.headers.get_content_type() != "application/json":
            self.send_json({"error": "Content-Type must be application/json"}, status=415)
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json({"error": "Invalid Content-Length"}, status=400)
            return
        if not 0 < content_length <= MAX_POST_BODY_BYTES:
            self.send_json({"error": "Request body must be between 1 and 16384 bytes"}, status=413)
            return
        try:
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            parsed_request = self.parsed_request_from_json(parsed.path, payload)
        except (UnicodeDecodeError, json.JSONDecodeError, TypeError, ValueError) as error:
            self.send_json({"error": str(error) or "Invalid JSON body"}, status=400)
            return
        handler(parsed_request)

    def parsed_request_from_json(self, path, payload):
        if not isinstance(payload, dict):
            raise TypeError("JSON body must be an object")
        unknown = set(payload) - POST_FIELDS
        if unknown:
            raise ValueError("Unknown request fields")
        phase = payload.get("phase", "luteal")
        if phase not in VALID_PHASES:
            raise ValueError("Invalid cycle phase")
        symptoms = payload.get("symptoms", [])
        if not isinstance(symptoms, list) or len(symptoms) > 20:
            raise TypeError("symptoms must be an array with at most 20 items")
        if not all(isinstance(item, str) and 0 < len(item) <= 64 for item in symptoms):
            raise TypeError("Each symptom must be a short string")

        query_payload = {}
        for key, value in payload.items():
            if isinstance(value, list):
                if not all(isinstance(item, str) and len(item) <= 100 for item in value):
                    raise TypeError(f"{key} must contain short strings")
                query_payload[key] = ",".join(value)
            elif isinstance(value, bool):
                query_payload[key] = "true" if value else "false"
            elif isinstance(value, (str, int)):
                query_payload[key] = str(value)
            else:
                raise TypeError(f"Invalid value for {key}")
        return urlparse(f"{path}?{urlencode(query_payload)}")

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def parse_meal_inputs(self, parsed, include_time_target=False):
        params = parse_qs(parsed.query)
        inputs = {
            "phase": params.get("phase", ["luteal"])[0],
            "symptoms": list_param(params, "symptoms"),
            "cuisine_style": params.get("cuisineStyle", ["balanced"])[0],
            "vegetarian": bool_param(params, "vegetarian"),
            "vegan": bool_param(params, "vegan"),
            "gluten_free": bool_param(params, "glutenFree"),
            "dairy_free": bool_param(params, "dairyFree"),
            "pantry": normalize_food_items(list_param(params, "pantry")),
            "cook_time": 35,
            "cook_time_min": 0,
            "search_query": params.get("search", [""])[0].strip(),
        }
        try:
            inputs["cook_time"] = max(5, min(60, int(params.get("cookTime", ["35"])[0])))
        except ValueError:
            inputs["cook_time"] = 35
        try:
            inputs["cook_time_min"] = max(0, min(60, int(params.get("cookTimeMin", ["0"])[0])))
        except ValueError:
            inputs["cook_time_min"] = 0
        if inputs["vegan"]:
            inputs["vegetarian"] = True
            inputs["dairy_free"] = True
        if include_time_target:
            try:
                hour = int(params.get("hour", ["12"])[0])
            except ValueError:
                hour = 12
            hour = max(0, min(23, hour))
            inputs["target_meal_type"] = params.get("mealType", [meal_type_for_hour(hour)])[0]
            inputs["hour"] = hour
        return inputs

    def handle_meals(self, parsed):
        inputs = self.parse_meal_inputs(parsed)

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

    def handle_today_meal(self, parsed):
        inputs = self.parse_meal_inputs(parsed, include_time_target=True)

        try:
            meals = fetch_themealdb_meals(inputs)
        except Exception as error:
            self.send_json(
                {
                    "source": "TheMealDB",
                    "usingFallback": False,
                    "error": str(error),
                    "phase": inputs["phase"],
                    "mealType": inputs["target_meal_type"],
                    "hour": inputs["hour"],
                    "meal": None,
                },
                status=502,
            )
            return

        self.send_json(
            {
                "source": "TheMealDB",
                "usingFallback": False,
                "phase": inputs["phase"],
                "mealType": inputs["target_meal_type"],
                "hour": inputs["hour"],
                "meal": meals[0] if meals else None,
            }
        )

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
