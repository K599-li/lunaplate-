import SwiftUI
import SwiftData

@MainActor
final class MovementViewModel: ObservableObject {
    @Published private(set) var exercises: [Exercise] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var isUsingOfflineContent = false

    func load(phase: CyclePhase, symptoms: [String]) async {
        isLoading = true
        errorMessage = nil
        isUsingOfflineContent = false
        defer { isLoading = false }
        do {
            exercises = try await APIClient.shared.exercises(phase: phase, symptoms: symptoms)
        } catch {
            exercises = OfflineContent.exercises(phase: phase, symptoms: symptoms, limit: 8)
            isUsingOfflineContent = true
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
                    if viewModel.isUsingOfflineContent {
                        offlineNotice
                    }
                    ForEach(viewModel.exercises) { exercise in
                        VStack(alignment: .leading, spacing: 10) {
                            if exercise.source == "offline" {
                                AppTheme.sage.opacity(0.12)
                                    .overlay {
                                        Image(systemName: "figure.mind.and.body")
                                            .font(.system(size: 54, weight: .light))
                                            .foregroundStyle(AppTheme.sage)
                                    }
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 190)
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                            } else {
                                AsyncImage(url: APIClient.shared.assetURL(path: exercise.media.url)) { image in
                                    image.resizable().scaledToFit()
                                } placeholder: {
                                    AppTheme.sage.opacity(0.12)
                                        .overlay { ProgressView() }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 190)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            }

                            HStack {
                                Text(exercise.name).font(.headline)
                                Spacer()
                                Label("\(exercise.duration) min", systemImage: "clock")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.berry)
                            }
                            Text(exercise.summary).foregroundStyle(.secondary)
                            DisclosureGroup("movement.instructions") {
                                VStack(alignment: .leading, spacing: 9) {
                                    ForEach(Array(exercise.instructions.enumerated()), id: \.offset) { index, instruction in
                                        HStack(alignment: .top, spacing: 8) {
                                            Text("\(index + 1).")
                                                .foregroundStyle(AppTheme.sage)
                                            Text(instruction)
                                                .frame(maxWidth: .infinity, alignment: .leading)
                                        }
                                    }
                                }
                                .padding(.top, 8)
                            }
                            .font(.subheadline)
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

    private var offlineNotice: some View {
        Label("content.offline.notice", systemImage: "wifi.slash")
            .font(.caption)
            .foregroundStyle(AppTheme.sage)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(AppTheme.sage.opacity(0.10), in: Capsule())
            .accessibilityIdentifier("movement.offlineNotice")
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
