import Foundation

/// A small, original catalog bundled with the app so the core experience remains useful
/// on a flight, during an outage, or before a recommendation server is configured.
enum OfflineContent {
    static func meals(phase: CyclePhase, symptoms: [String]) -> [Meal] {
        let preferred = mealSeeds.filter { $0.phases.contains(phase) }
        let remaining = mealSeeds.filter { !preferred.map(\.id).contains($0.id) }
        return (preferred + remaining).map(\.meal)
    }

    static func todayMeal(phase: CyclePhase, symptoms: [String], hour: Int) -> Meal? {
        let type = hour < 11 ? "breakfast" : (hour < 16 ? "lunch" : "dinner")
        let candidates = meals(phase: phase, symptoms: symptoms)
        return candidates.first(where: { $0.type == type }) ?? candidates.first
    }

    static func exercises(phase: CyclePhase, symptoms: [String], limit: Int) -> [Exercise] {
        let symptomSet = Set(symptoms)
        return exerciseSeeds
            .sorted { score($0, phase: phase, symptoms: symptomSet) > score($1, phase: phase, symptoms: symptomSet) }
            .prefix(max(1, limit))
            .map { $0.exercise(duration: $0.duration[phase] ?? 10) }
    }

    private static func score(_ seed: ExerciseSeed, phase: CyclePhase, symptoms: Set<String>) -> Int {
        (seed.phases.contains(phase) ? 20 : 0) + symptoms.intersection(seed.symptoms).count * 8
    }

    private struct MealSeed {
        let id: String
        let name: String
        let type: String
        let time: Int
        let calories: Int
        let macros: MealMacros
        let tags: [String]
        let ingredients: [String]
        let steps: [String]
        let phases: Set<CyclePhase>

        var meal: Meal {
            Meal(id: id, name: name, type: type, time: time, calories: calories, macros: macros,
                 tags: tags, ingredients: ingredients, steps: steps, image: nil,
                 source: "offline", backendScore: 0)
        }
    }

    private struct ExerciseSeed {
        let id: String
        let name: String
        let visualType: String
        let phases: Set<CyclePhase>
        let symptoms: Set<String>
        let bodyParts: [String]
        let instructions: [String]
        let duration: [CyclePhase: Int]
        let summary: String
        let focus: String
        let safety: String

        func exercise(duration: Int) -> Exercise {
            Exercise(id: id, name: name, visualType: visualType, bodyParts: bodyParts,
                     targetMuscles: bodyParts, equipments: ["body weight"], instructions: instructions,
                     duration: duration, summary: summary, focus: focus, safety: safety,
                     media: ExerciseMedia(type: "bundled", url: "", source: "offline"), source: "offline")
        }
    }

    private static let mealSeeds: [MealSeed] = [
        .init(id: "oat-berry", name: "Warm berry oat bowl", type: "breakfast", time: 12, calories: 390,
              macros: .init(protein: 15, carbs: 58, fat: 12), tags: ["fiber", "magnesium", "warm"],
              ingredients: ["rolled oats", "milk or soy drink", "berries", "pumpkin seeds", "yogurt"],
              steps: ["Simmer oats with milk.", "Top with berries, seeds, and yogurt."], phases: [.menstrual, .luteal]),
        .init(id: "egg-greens", name: "Egg and greens toast", type: "breakfast", time: 10, calories: 410,
              macros: .init(protein: 23, carbs: 38, fat: 18), tags: ["protein", "iron", "quick"],
              ingredients: ["eggs", "whole-grain toast", "spinach", "tomato", "olive oil"],
              steps: ["Wilt spinach and cook the eggs.", "Serve over toast with tomato."], phases: [.follicular, .ovulatory]),
        .init(id: "yogurt-kiwi", name: "Kiwi yogurt crunch", type: "breakfast", time: 5, calories: 360,
              macros: .init(protein: 22, carbs: 44, fat: 11), tags: ["calcium", "protein", "no-cook"],
              ingredients: ["plain yogurt", "kiwi", "oats", "walnuts", "cinnamon"],
              steps: ["Layer yogurt and kiwi.", "Finish with oats, walnuts, and cinnamon."], phases: [.follicular, .ovulatory]),
        .init(id: "lentil-bowl", name: "Lemon lentil grain bowl", type: "lunch", time: 18, calories: 520,
              macros: .init(protein: 24, carbs: 72, fat: 16), tags: ["iron", "fiber", "plant protein"],
              ingredients: ["cooked lentils", "brown rice", "spinach", "bell pepper", "lemon", "olive oil"],
              steps: ["Warm lentils and rice.", "Add vegetables and dress with lemon and olive oil."], phases: [.menstrual, .follicular]),
        .init(id: "salmon-potato", name: "Salmon and herbed potato plate", type: "lunch", time: 25, calories: 590,
              macros: .init(protein: 38, carbs: 54, fat: 24), tags: ["omega-3", "protein", "potassium"],
              ingredients: ["salmon fillet", "baby potatoes", "green beans", "lemon", "dill"],
              steps: ["Roast salmon and potatoes until cooked through.", "Serve with green beans, lemon, and dill."], phases: [.ovulatory, .luteal]),
        .init(id: "chickpea-wrap", name: "Crunchy chickpea wrap", type: "lunch", time: 12, calories: 480,
              macros: .init(protein: 19, carbs: 65, fat: 17), tags: ["fiber", "fresh", "portable"],
              ingredients: ["chickpeas", "whole-grain wrap", "cucumber", "carrot", "tahini", "lemon"],
              steps: ["Mash chickpeas with tahini and lemon.", "Add vegetables and roll the wrap."], phases: [.follicular, .ovulatory]),
        .init(id: "tofu-noodles", name: "Ginger tofu noodle bowl", type: "dinner", time: 22, calories: 540,
              macros: .init(protein: 29, carbs: 67, fat: 19), tags: ["protein", "calcium", "colorful"],
              ingredients: ["calcium-set tofu", "rice noodles", "broccoli", "carrot", "ginger", "low-sodium soy sauce"],
              steps: ["Brown tofu and stir-fry vegetables.", "Toss with noodles, ginger, and sauce."], phases: [.follicular, .ovulatory]),
        .init(id: "turkey-bean", name: "Turkey and bean tomato stew", type: "dinner", time: 28, calories: 560,
              macros: .init(protein: 41, carbs: 58, fat: 18), tags: ["iron", "protein", "batch-friendly"],
              ingredients: ["lean ground turkey", "white beans", "tomatoes", "carrot", "spinach", "paprika"],
              steps: ["Brown turkey with carrot and paprika.", "Simmer with beans and tomatoes; fold in spinach."], phases: [.menstrual, .luteal]),
        .init(id: "sweet-potato", name: "Sweet potato black bean tray", type: "dinner", time: 30, calories: 510,
              macros: .init(protein: 20, carbs: 76, fat: 15), tags: ["fiber", "magnesium", "meal prep"],
              ingredients: ["sweet potato", "black beans", "corn", "avocado", "lime", "pumpkin seeds"],
              steps: ["Roast cubed sweet potato.", "Add warm beans and corn; top with avocado, lime, and seeds."], phases: [.menstrual, .luteal]),
        .init(id: "chicken-quinoa", name: "Chicken quinoa garden bowl", type: "dinner", time: 24, calories: 575,
              macros: .init(protein: 43, carbs: 61, fat: 18), tags: ["protein", "balanced", "fresh"],
              ingredients: ["chicken breast", "quinoa", "tomatoes", "cucumber", "greens", "lemon"],
              steps: ["Cook quinoa and sear chicken until fully cooked.", "Slice and serve with vegetables and lemon."], phases: [.follicular, .ovulatory]),
        .init(id: "banana-cocoa", name: "Banana cocoa seed snack", type: "snack", time: 4, calories: 260,
              macros: .init(protein: 10, carbs: 34, fat: 11), tags: ["magnesium", "quick", "sweet"],
              ingredients: ["banana", "plain yogurt", "cocoa", "chia seeds"],
              steps: ["Slice banana over yogurt.", "Dust with cocoa and chia seeds."], phases: [.luteal, .menstrual]),
        .init(id: "apple-hummus", name: "Apple, hummus and seed plate", type: "snack", time: 5, calories: 280,
              macros: .init(protein: 9, carbs: 38, fat: 12), tags: ["fiber", "steady energy", "no-cook"],
              ingredients: ["apple", "hummus", "whole-grain crackers", "sunflower seeds"],
              steps: ["Slice the apple.", "Serve with hummus, crackers, and seeds."], phases: [.follicular, .ovulatory])
    ]

    private static let exerciseSeeds: [ExerciseSeed] = [
        .init(id: "breathing", name: "Supported belly breathing", visualType: "breathing", phases: [.menstrual, .luteal], symptoms: ["cramps", "low_mood"], bodyParts: ["diaphragm"], instructions: ["Lie down with knees supported.", "Breathe slowly into the lower ribs for 2–5 minutes."], duration: [.menstrual: 5, .follicular: 6, .ovulatory: 6, .luteal: 5], summary: "A quiet reset with the knees supported and breath kept easy.", focus: "relaxation", safety: "Stop if breathing feels uncomfortable or you become dizzy."),
        .init(id: "cat-cow", name: "Cat-cow flow", visualType: "cat-cow", phases: [.menstrual, .luteal], symptoms: ["cramps", "bloating"], bodyParts: ["back", "waist"], instructions: ["Start on hands and knees.", "Alternate a gentle arch and round for 6–8 breaths."], duration: [.menstrual: 8, .follicular: 12, .ovulatory: 12, .luteal: 10], summary: "Slow spinal movement coordinated with comfortable breathing.", focus: "mobility", safety: "Use a smaller range if wrists or lower back feel uncomfortable."),
        .init(id: "walk", name: "Comfortable walk", visualType: "walking", phases: [.menstrual, .follicular, .ovulatory, .luteal], symptoms: ["fatigue", "low_mood", "bloating"], bodyParts: ["full body"], instructions: ["Choose a flat, familiar route.", "Walk at a pace where conversation stays easy."], duration: [.menstrual: 10, .follicular: 25, .ovulatory: 30, .luteal: 20], summary: "Low-pressure aerobic movement you can shorten at any point.", focus: "gentle cardio", safety: "Turn back or rest if pain, dizziness, or unusual shortness of breath appears."),
        .init(id: "hips", name: "Seated hip mobility", visualType: "hip-mobility", phases: [.menstrual, .luteal], symptoms: ["cramps", "bloating"], bodyParts: ["hips", "lower back"], instructions: ["Sit tall on a chair.", "Make small, slow hip rotations in each direction."], duration: [.menstrual: 7, .follicular: 10, .ovulatory: 10, .luteal: 8], summary: "Small chair-based circles to gently explore hip comfort.", focus: "mobility", safety: "Keep the motion pain-free and avoid forcing the range."),
        .init(id: "strength", name: "Light full-body strength", visualType: "strength", phases: [.follicular, .ovulatory], symptoms: [], bodyParts: ["legs", "chest", "back"], instructions: ["Complete chair squats, wall push-ups, and band rows.", "Rest between sets and keep 2–3 repetitions in reserve."], duration: [.menstrual: 12, .follicular: 22, .ovulatory: 25, .luteal: 16], summary: "A short, adjustable circuit using controlled repetitions.", focus: "strength", safety: "Use stable supports and stop any movement that causes sharp pain."),
        .init(id: "dance", name: "Easy dance break", visualType: "dance", phases: [.follicular, .ovulatory], symptoms: ["low_mood"], bodyParts: ["full body"], instructions: ["Play two or three songs.", "Use easy steps and keep impact optional."], duration: [.menstrual: 8, .follicular: 18, .ovulatory: 20, .luteal: 12], summary: "A playful, self-paced movement break with no choreography required.", focus: "cardio and mood", safety: "Clear the floor and choose low-impact steps if joints feel sensitive."),
        .init(id: "stretch", name: "Gentle evening stretch", visualType: "stretch", phases: [.menstrual, .luteal], symptoms: ["fatigue", "low_mood"], bodyParts: ["shoulders", "hips", "calves"], instructions: ["Move through comfortable shoulder, hip, and calf stretches.", "Hold without bouncing for 15–20 seconds."], duration: [.menstrual: 8, .follicular: 10, .ovulatory: 10, .luteal: 10], summary: "An unhurried sequence to release common areas of tension.", focus: "flexibility", safety: "A stretch should feel mild, never sharp or numb."),
        .init(id: "intervals", name: "Walk-and-brisk intervals", visualType: "interval-walk", phases: [.follicular, .ovulatory], symptoms: [], bodyParts: ["full body"], instructions: ["Alternate 2 minutes easy with 1 minute brisk.", "Repeat while your breathing remains controlled."], duration: [.menstrual: 10, .follicular: 24, .ovulatory: 27, .luteal: 16], summary: "Flexible walking intervals that do not require running.", focus: "aerobic fitness", safety: "Skip brisk intervals when unwell, light-headed, or experiencing significant pain.")
    ]
}
