import Foundation

struct APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let baseURL: URL
    private let decoder: JSONDecoder

    init(
        session: URLSession = .shared,
        baseURL: URL = APIConfiguration.baseURL
    ) {
        self.session = session
        self.baseURL = baseURL
        self.decoder = JSONDecoder()
    }

    func todayMeal(
        phase: CyclePhase,
        symptoms: [String],
        hour: Int = Calendar.current.component(.hour, from: .now)
    ) async throws -> Meal? {
        let response: TodayMealResponse = try await get(
            path: "api/today-meal",
            queryItems: [
                URLQueryItem(name: "phase", value: phase.apiValue),
                URLQueryItem(name: "symptoms", value: symptoms.joined(separator: ",")),
                URLQueryItem(name: "hour", value: String(hour))
            ]
        )
        return response.meal
    }

    func meals(phase: CyclePhase, symptoms: [String]) async throws -> [Meal] {
        let response: MealsResponse = try await get(
            path: "api/meals",
            queryItems: [
                URLQueryItem(name: "phase", value: phase.apiValue),
                URLQueryItem(name: "symptoms", value: symptoms.joined(separator: ","))
            ]
        )
        return response.meals
    }

    func exercises(phase: CyclePhase, symptoms: [String], limit: Int = 8) async throws -> [Exercise] {
        let response: ExercisesResponse = try await get(
            path: "api/female-exercises",
            queryItems: [
                URLQueryItem(name: "phase", value: phase.apiValue),
                URLQueryItem(name: "symptoms", value: symptoms.joined(separator: ",")),
                URLQueryItem(name: "limit", value: String(limit))
            ]
        )
        return response.exercises
    }

    func assetURL(path: String) -> URL? {
        if let absolute = URL(string: path), absolute.scheme != nil {
            return absolute
        }
        return baseURL.appendingPathComponent(path)
    }

    private func get<Response: Decodable>(
        path: String,
        queryItems: [URLQueryItem]
    ) async throws -> Response {
        guard var components = URLComponents(url: baseURL.appendingPathComponent(path), resolvingAgainstBaseURL: false) else {
            throw APIError.invalidURL
        }
        components.queryItems = queryItems
        guard let url = components.url else {
            throw APIError.invalidURL
        }

        let (data, response) = try await session.data(from: url)
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        return try decoder.decode(Response.self, from: data)
    }
}

enum APIConfiguration {
    static var baseURL: URL {
        let configured = Bundle.main.object(forInfoDictionaryKey: "LUNAPLATE_API_BASE_URL") as? String
        return URL(string: configured ?? "http://localhost:5178")!
    }
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse

    var errorDescription: String? {
        switch self {
        case .invalidURL: String(localized: "error.invalidURL")
        case .invalidResponse: String(localized: "error.invalidResponse")
        }
    }
}
