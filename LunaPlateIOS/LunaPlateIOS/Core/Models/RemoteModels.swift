import Foundation

struct TodayMealResponse: Decodable {
    let source: String
    let usingFallback: Bool
    let phase: String
    let mealType: String
    let hour: Int
    let meal: Meal?
}

struct MealsResponse: Decodable {
    let source: String
    let usingFallback: Bool
    let phase: String
    let symptoms: [String]
    let cuisineStyle: String
    let meals: [Meal]
}

struct Meal: Decodable, Identifiable, Sendable {
    let id: String
    let name: String
    let type: String
    let time: Int
    let calories: Int?
    let macros: MealMacros?
    let tags: [String]
    let ingredients: [String]
    let steps: [String]
    let image: URL?
    let source: String
    let backendScore: Int
}

struct MealMacros: Decodable, Sendable {
    let protein: Int
    let carbs: Int
    let fat: Int
}

struct ExercisesResponse: Decodable {
    let source: String
    let phase: String
    let symptoms: [String]
    let exercises: [Exercise]
}

struct Exercise: Decodable, Identifiable, Sendable {
    let id: String
    let name: String
    let visualType: String
    let bodyParts: [String]
    let targetMuscles: [String]
    let equipments: [String]
    let instructions: [String]
    let duration: Int
    let summary: String
    let focus: String
    let safety: String
    let media: ExerciseMedia
    let source: String
}

struct ExerciseMedia: Decodable, Sendable {
    let type: String
    let url: String
    let source: String
}
