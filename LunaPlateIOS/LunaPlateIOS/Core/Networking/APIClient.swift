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
        let response: TodayMealResponse = try await send(
            makeRecommendationRequest(
                path: "api/today-meal", phase: phase, symptoms: symptoms, hour: hour
            )
        )
        return response.meal
    }

    func meals(phase: CyclePhase, symptoms: [String]) async throws -> [Meal] {
        let response: MealsResponse = try await send(
            makeRecommendationRequest(path: "api/meals", phase: phase, symptoms: symptoms)
        )
        return response.meals
    }

    func exercises(phase: CyclePhase, symptoms: [String], limit: Int = 8) async throws -> [Exercise] {
        let response: ExercisesResponse = try await send(
            makeRecommendationRequest(
                path: "api/female-exercises", phase: phase, symptoms: symptoms, limit: limit
            )
        )
        return response.exercises
    }

    func assetURL(path: String) -> URL? {
        if let absolute = URL(string: path), absolute.scheme != nil {
            return absolute
        }
        return baseURL.appendingPathComponent(path)
    }

    /// Internal so the test target can enforce that health values stay in a JSON body, never the URL.
    func makeRecommendationRequest(
        path: String,
        phase: CyclePhase,
        symptoms: [String],
        hour: Int? = nil,
        limit: Int? = nil
    ) throws -> URLRequest {
        let url = baseURL.appendingPathComponent(path)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.httpBody = try JSONEncoder().encode(RecommendationRequest(
            phase: phase.apiValue, symptoms: symptoms, hour: hour, limit: limit
        ))
        return request
    }

    private func send<Response: Decodable>(_ request: URLRequest) async throws -> Response {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200..<300).contains(httpResponse.statusCode) else {
            throw APIError.invalidResponse
        }
        return try decoder.decode(Response.self, from: data)
    }
}

private struct RecommendationRequest: Encodable {
    let phase: String
    let symptoms: [String]
    var hour: Int?
    var limit: Int?

    init(phase: String, symptoms: [String], hour: Int? = nil, limit: Int? = nil) {
        self.phase = phase
        self.symptoms = symptoms
        self.hour = hour
        self.limit = limit
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
