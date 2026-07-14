import SwiftUI
import SwiftData

@MainActor
final class MovementViewModel: ObservableObject {
    @Published private(set) var exercises: [Exercise] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    func load(phase: CyclePhase, symptoms: [String]) async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            exercises = try await APIClient.shared.exercises(phase: phase, symptoms: symptoms)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct MovementView: View {
    @StateObject private var viewModel = MovementViewModel()
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @Query private var logs: [DailyLog]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                Text("movement.title")
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .foregroundStyle(AppTheme.plumText)

                if viewModel.isLoading {
                    ProgressView().frame(maxWidth: .infinity, minHeight: 180)
                } else if let error = viewModel.errorMessage {
                    ContentUnavailableView("movement.error", systemImage: "figure.walk.motion", description: Text(error))
                } else {
                    ForEach(viewModel.exercises) { exercise in
                        VStack(alignment: .leading, spacing: 10) {
                            AsyncImage(url: APIClient.shared.assetURL(path: exercise.media.url)) { image in
                                image.resizable().scaledToFit()
                            } placeholder: {
                                AppTheme.sage.opacity(0.12)
                                    .overlay { ProgressView() }
                            }
                            .frame(maxWidth: .infinity)
                            .frame(height: 190)
                            .clipShape(RoundedRectangle(cornerRadius: 16))

                            HStack {
                                Text(exercise.name).font(.headline)
                                Spacer()
                                Label("\(exercise.duration) min", systemImage: "clock")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.berry)
                            }
                            Text(exercise.summary).foregroundStyle(.secondary)
                            Divider()
                            Label(exercise.safety, systemImage: "shield.checkered")
                                .font(.caption)
                                .foregroundStyle(AppTheme.sage)
                        }
                        .lunaCard()
                    }
                }
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.movement")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: requestKey) { await viewModel.load(phase: activePhase, symptoms: todaySymptoms) }
        .refreshable { await viewModel.load(phase: activePhase, symptoms: todaySymptoms) }
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
