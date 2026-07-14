import SwiftData
import SwiftUI

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @Query private var dailyLogs: [DailyLog]
    @StateObject private var viewModel = TodayViewModel()
    @State private var isCheckInPresented = false

    private var currentSettings: UserSettings {
        settings.first ?? UserSettings()
    }

    private var snapshot: CycleSnapshot? {
        CycleCalculator.snapshot(records: cycles, settings: currentSettings)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                VStack(alignment: .leading, spacing: 5) {
                    Text("today.greeting")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text("today.title")
                        .font(.system(.largeTitle, design: .rounded, weight: .bold))
                        .foregroundStyle(AppTheme.plumText)
                }

                cycleOverview
                actionRow
                safetyNotice
                dailyPlanSection
                careSection
                mealCard
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.today")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: recommendationRequestKey) {
            await viewModel.load(phase: snapshot?.phase ?? .luteal, symptoms: todayLog?.symptoms ?? [])
        }
        .sheet(isPresented: $isCheckInPresented) {
            NavigationStack {
                DailyCheckInView(date: .now)
            }
        }
    }

    @ViewBuilder
    private var cycleOverview: some View {
        if let snapshot {
            HStack(spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(AppTheme.rose.opacity(0.18), lineWidth: 11)
                    Circle()
                        .trim(from: 0, to: min(Double(snapshot.day) / Double(currentSettings.averageCycleLength), 1))
                        .stroke(AppTheme.berry, style: StrokeStyle(lineWidth: 11, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    VStack(spacing: 0) {
                        Text(snapshot.day, format: .number)
                            .font(.system(size: 32, weight: .bold, design: .rounded))
                        Text("cycle.day")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .frame(width: 124, height: 124)

                VStack(alignment: .leading, spacing: 8) {
                    Text(snapshot.phase.localizedName)
                        .font(.title3.bold())
                        .foregroundStyle(AppTheme.berry)
                    Text("cycle.nextPeriod")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(snapshot.nextPeriodDate, format: .dateTime.month(.wide).day())
                        .font(.headline)
                }
                Spacer(minLength: 0)
            }
            .lunaCard()
        } else {
            VStack(alignment: .leading, spacing: 12) {
                Label("cycle.empty.title", systemImage: "calendar.badge.plus")
                    .font(.headline)
                Text("cycle.empty.body")
                    .foregroundStyle(.secondary)
                Button("cycle.startToday") {
                    ensureSettingsExist()
                    modelContext.insert(CycleRecord(startDate: .now))
                }
                .buttonStyle(.borderedProminent)
            }
            .lunaCard()
        }
    }

    @ViewBuilder
    private var safetyNotice: some View {
        if let notice = CarePlanEngine.safetyNotice(logs: dailyLogs) {
            VStack(alignment: .leading, spacing: 10) {
                Label("care.safety.title", systemImage: "exclamationmark.triangle")
                    .font(.headline)
                    .foregroundStyle(.red)
                Text(notice.message.value)
                Text("care.safety.boundary")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .lunaCard()
        }
    }

    private var careSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Label("today.care.title", systemImage: "heart.text.square")
                    .font(.title3.bold())
                    .foregroundStyle(AppTheme.sage)
                Spacer()
                Label("\(todayLog?.waterMilliliters ?? 0) ml", systemImage: "drop")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            ForEach(careRecommendations) { rule in
                VStack(alignment: .leading, spacing: 8) {
                    Text(rule.title.value)
                        .font(.headline)
                    Text(rule.action.value)
                    Text(rule.reason.value)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    DisclosureGroup("care.safetyAndSources") {
                        VStack(alignment: .leading, spacing: 7) {
                            Text(rule.safety.value)
                                .font(.caption)
                            ForEach(rule.sourceIds, id: \.self) { sourceID in
                                if let source = CareLibrary.bundled.source(id: sourceID) {
                                    Link(source.organization, destination: source.url)
                                        .font(.caption)
                                }
                            }
                        }
                        .padding(.top, 4)
                    }
                    .font(.caption)
                }
                .padding(.vertical, 4)

                if rule.id != careRecommendations.last?.id {
                    Divider()
                }
            }
        }
        .lunaCard()
    }

    private var dailyPlanSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Label("today.plan.title", systemImage: "checklist")
                    .font(.title3.bold())
                    .foregroundStyle(AppTheme.berry)
                Spacer()
                Text("\(completedPlanCount)/\(planItems.count)")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
            }

            ForEach(planItems, id: \.id) { item in
                Button {
                    togglePlanItem(item.id)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: isPlanItemComplete(item.id) ? "checkmark.circle.fill" : "circle")
                            .font(.title3)
                            .foregroundStyle(isPlanItemComplete(item.id) ? AppTheme.sage : .secondary)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.title)
                                .font(.subheadline.bold())
                            Text(item.detail)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                    }
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("today.plan.\(item.id)")

                if item.id != planItems.last?.id { Divider() }
            }
        }
        .lunaCard()
    }

    private var actionRow: some View {
        HStack(spacing: 12) {
            NavigationLink {
                CycleCalendarView()
            } label: {
                Label("today.action.calendar", systemImage: "calendar")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)

            Button {
                isCheckInPresented = true
            } label: {
                Label("today.action.checkin", systemImage: "checklist")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
    }

    @ViewBuilder
    private var mealCard: some View {
        VStack(alignment: .leading, spacing: 14) {
            Label("today.meal.title", systemImage: "fork.knife")
                .font(.headline)
                .foregroundStyle(AppTheme.berry)

            if viewModel.isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 90)
            } else if let meal = viewModel.meal {
                if viewModel.isUsingOfflineContent {
                    Label("content.offline.notice", systemImage: "wifi.slash")
                        .font(.caption)
                        .foregroundStyle(AppTheme.sage)
                        .accessibilityIdentifier("today.offlineNotice")
                }
                NavigationLink {
                    MealDetailView(meal: meal)
                } label: {
                    HStack(spacing: 14) {
                        MealArtwork(meal: meal, size: 92)
                        VStack(alignment: .leading, spacing: 5) {
                            Text(meal.name)
                                .font(.headline)
                                .lineLimit(2)
                            Text("\(meal.time) min")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            if let calories = meal.calories {
                                Text("\(calories) kcal")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.sage)
                            }
                        }
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption.bold())
                            .foregroundStyle(.tertiary)
                    }
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("today.meal.details")
            } else {
                Text(viewModel.errorMessage ?? String(localized: "today.meal.empty"))
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 70, alignment: .leading)
            }
        }
        .lunaCard()
    }

    private var todayLog: DailyLog? {
        let today = Calendar.current.startOfDay(for: .now)
        return dailyLogs.first { Calendar.current.isDate($0.date, inSameDayAs: today) }
    }

    private struct PlanItem {
        let id: String
        let title: LocalizedStringKey
        let detail: LocalizedStringKey
    }

    private var planItems: [PlanItem] {
        [
            PlanItem(id: "hydrate", title: "today.plan.hydrate", detail: "today.plan.hydrate.detail"),
            PlanItem(id: "move", title: "today.plan.move", detail: "today.plan.move.detail"),
            PlanItem(id: "nourish", title: "today.plan.nourish", detail: "today.plan.nourish.detail")
        ]
    }

    private var completedPlanCount: Int {
        planItems.filter { isPlanItemComplete($0.id) }.count
    }

    private func isPlanItemComplete(_ id: String) -> Bool {
        todayLog?.planChecks.contains(id) == true
    }

    private func togglePlanItem(_ id: String) {
        let log: DailyLog
        if let todayLog {
            log = todayLog
        } else {
            log = DailyLog(date: Calendar.current.startOfDay(for: .now))
            modelContext.insert(log)
        }
        if let index = log.planChecks.firstIndex(of: id) {
            log.planChecks.remove(at: index)
        } else {
            log.planChecks.append(id)
        }
        try? modelContext.save()
    }

    private var recommendationRequestKey: String {
        "\(snapshot?.phase.rawValue ?? "luteal")|\((todayLog?.symptoms ?? []).sorted().joined(separator: ","))"
    }

    private var careRecommendations: [CareRule] {
        CarePlanEngine.recommendations(
            phase: snapshot?.phase ?? .luteal,
            symptoms: todayLog?.symptoms ?? []
        )
    }

    private func ensureSettingsExist() {
        guard settings.isEmpty else { return }
        modelContext.insert(UserSettings())
    }
}
