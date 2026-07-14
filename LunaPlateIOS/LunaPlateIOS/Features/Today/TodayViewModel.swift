import Combine
import Foundation

@MainActor
final class TodayViewModel: ObservableObject {
    @Published private(set) var meal: Meal?
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var isUsingOfflineContent = false

    func load(phase: CyclePhase, symptoms: [String] = []) async {
        isLoading = true
        errorMessage = nil
        isUsingOfflineContent = false
        defer { isLoading = false }

        do {
            meal = try await APIClient.shared.todayMeal(phase: phase, symptoms: symptoms)
        } catch {
            meal = OfflineContent.todayMeal(
                phase: phase,
                symptoms: symptoms,
                hour: Calendar.current.component(.hour, from: .now)
            )
            isUsingOfflineContent = true
        }
    }
}
