import Combine
import Foundation

@MainActor
final class TodayViewModel: ObservableObject {
    @Published private(set) var meal: Meal?
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    func load(phase: CyclePhase, symptoms: [String] = []) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }

        do {
            meal = try await APIClient.shared.todayMeal(phase: phase, symptoms: symptoms)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
