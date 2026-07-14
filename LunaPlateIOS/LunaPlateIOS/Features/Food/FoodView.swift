import SwiftUI
import SwiftData

@MainActor
final class FoodViewModel: ObservableObject {
    @Published private(set) var meals: [Meal] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var isUsingOfflineContent = false

    func load(phase: CyclePhase, symptoms: [String]) async {
        isLoading = true
        errorMessage = nil
        isUsingOfflineContent = false
        defer { isLoading = false }
        do {
            meals = try await APIClient.shared.meals(phase: phase, symptoms: symptoms)
        } catch {
            meals = OfflineContent.meals(phase: phase, symptoms: symptoms)
            isUsingOfflineContent = true
        }
    }
}

struct FoodView: View {
    @StateObject private var viewModel = FoodViewModel()
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @Query private var logs: [DailyLog]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                Text("food.title")
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .foregroundStyle(AppTheme.plumText)

                if viewModel.isLoading {
                    ProgressView().frame(maxWidth: .infinity, minHeight: 180)
                } else if let error = viewModel.errorMessage {
                    ContentUnavailableView("food.error", systemImage: "wifi.exclamationmark", description: Text(error))
                } else {
                    if viewModel.isUsingOfflineContent {
                        offlineNotice
                    }
                    ForEach(viewModel.meals) { meal in
                        mealRow(meal)
                    }
                }
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.food")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: requestKey) { await viewModel.load(phase: activePhase, symptoms: todaySymptoms) }
        .refreshable { await viewModel.load(phase: activePhase, symptoms: todaySymptoms) }
    }

    private var offlineNotice: some View {
        Label("content.offline.notice", systemImage: "wifi.slash")
            .font(.caption)
            .foregroundStyle(AppTheme.sage)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(AppTheme.sage.opacity(0.10), in: Capsule())
            .accessibilityIdentifier("food.offlineNotice")
    }

    private func mealRow(_ meal: Meal) -> some View {
        HStack(spacing: 14) {
            AsyncImage(url: meal.image) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                AppTheme.oat.opacity(0.35)
            }
            .frame(width: 104, height: 104)
            .clipShape(RoundedRectangle(cornerRadius: 16))

            VStack(alignment: .leading, spacing: 7) {
                Text(meal.name).font(.headline).lineLimit(2)
                Text(meal.tags.prefix(3).joined(separator: " · "))
                    .font(.caption)
                    .foregroundStyle(AppTheme.sage)
                    .lineLimit(2)
                Text("\(meal.time) min")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
        }
        .lunaCard()
    }

    private var activePhase: CyclePhase {
        let currentSettings = settings.first ?? UserSettings()
        return CycleCalculator.snapshot(records: cycles, settings: currentSettings)?.phase ?? .luteal
    }

    private var todaySymptoms: [String] {
        logs.first { Calendar.current.isDateInToday($0.date) }?.symptoms ?? []
    }

    private var requestKey: String {
        "\(activePhase.rawValue)|\(todaySymptoms.sorted().joined(separator: ","))"
    }
}
