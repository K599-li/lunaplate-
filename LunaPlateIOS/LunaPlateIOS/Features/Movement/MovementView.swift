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
                    .font(AppTheme.brandFont(.largeTitle, weight: .semibold))
                    .foregroundStyle(AppTheme.ink)

                Text(activePhase.localizedName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(AppTheme.greenDeep)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 7)
                    .background(AppTheme.greenSoft, in: Capsule())

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
                                    .clipShape(RoundedRectangle(cornerRadius: AppTheme.compactRadius, style: .continuous))
                                    .accessibilityHidden(true)
                            } else {
                                AsyncImage(url: APIClient.shared.assetURL(path: exercise.media.url)) { phase in
                                    switch phase {
                                    case .success(let image):
                                        image.resizable().scaledToFit()
                                    case .failure:
                                        movementPlaceholder(showProgress: false)
                                    case .empty:
                                        movementPlaceholder(showProgress: true)
                                    @unknown default:
                                        movementPlaceholder(showProgress: false)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 190)
                                .clipShape(RoundedRectangle(cornerRadius: AppTheme.compactRadius, style: .continuous))
                                .accessibilityHidden(true)
                            }

                            HStack {
                                Text(exercise.name)
                                    .font(AppTheme.brandFont(.title3, weight: .semibold))
                                    .foregroundStyle(AppTheme.ink)
                                Spacer()
                                Label("\(exercise.duration) min", systemImage: "clock")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.berry)
                            }
                            Text(exercise.summary).foregroundStyle(AppTheme.muted)
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
        .background(AppTheme.pageBackground.ignoresSafeArea())
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

    private func movementPlaceholder(showProgress: Bool) -> some View {
        AppTheme.greenSoft
            .overlay {
                if showProgress {
                    ProgressView().tint(AppTheme.green)
                } else {
                    Image(systemName: "figure.mind.and.body")
                        .font(.system(size: 48, weight: .light))
                        .foregroundStyle(AppTheme.green)
                }
            }
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
