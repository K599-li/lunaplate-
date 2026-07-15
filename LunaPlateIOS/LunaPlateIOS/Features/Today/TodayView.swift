import SwiftData
import SwiftUI

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @Query private var dailyLogs: [DailyLog]
    @StateObject private var viewModel = TodayViewModel()
    @State private var isCheckInPresented = false
    @ScaledMetric(relativeTo: .title) private var cycleRingSize: CGFloat = 212
    @ScaledMetric(relativeTo: .largeTitle) private var cycleNumberSize: CGFloat = 52

    let onProfileTap: () -> Void

    init(onProfileTap: @escaping () -> Void = {}) {
        self.onProfileTap = onProfileTap
    }

    private var currentSettings: UserSettings {
        settings.first ?? UserSettings()
    }

    private var snapshot: CycleSnapshot? {
        CycleCalculator.snapshot(records: cycles, settings: currentSettings)
    }

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 28) {
                brandHeader
                cycleHero
                actionRow
                safetyNotice
                dailyPlanSection
                careSection
                mealSection
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.top, 10)
            .padding(.bottom, 28)
        }
        .scrollIndicators(.hidden)
        .background(AppTheme.pageBackground.ignoresSafeArea())
        .toolbar(.hidden, for: .navigationBar)
        .task(id: recommendationRequestKey) {
            await viewModel.load(phase: snapshot?.phase ?? .luteal, symptoms: todayLog?.symptoms ?? [])
        }
        .sheet(isPresented: $isCheckInPresented) {
            NavigationStack {
                DailyCheckInView(date: .now)
            }
        }
    }

    private var brandHeader: some View {
        HStack(spacing: 12) {
            Button(action: onProfileTap) {
                HStack(spacing: 12) {
                    Image("LunaPlateLogo")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 48, height: 48)
                        .clipShape(Circle())
                        .overlay {
                            Circle().stroke(AppTheme.line, lineWidth: 1)
                        }
                        .shadow(color: AppTheme.ink.opacity(0.1), radius: 10, y: 5)

                    VStack(alignment: .leading, spacing: 1) {
                        Text("LunaPlate")
                            .font(AppTheme.brandFont(.title2, weight: .semibold))
                            .foregroundStyle(AppTheme.primaryDeep)
                        Text("today.greeting")
                            .font(.caption)
                            .foregroundStyle(AppTheme.muted)
                            .lineLimit(1)
                    }
                }
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("profile.open")

            Spacer(minLength: 8)

            NavigationLink {
                GroceryListView()
            } label: {
                Image(systemName: "cart")
                    .font(.system(size: AppTheme.iconSize, weight: .medium))
            }
            .buttonStyle(LunaIconButtonStyle())
            .accessibilityLabel("grocery.title")

            Button(action: onProfileTap) {
                Image(systemName: "bell")
                    .font(.system(size: AppTheme.iconSize, weight: .medium))
            }
            .buttonStyle(LunaIconButtonStyle())
            .accessibilityLabel("profile.notifications.section")
        }
        .padding(.bottom, 14)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(AppTheme.line)
                .frame(height: 1)
        }
    }

    @ViewBuilder
    private var cycleHero: some View {
        if let snapshot {
            VStack(spacing: 20) {
                ZStack {
                    Circle()
                        .stroke(AppTheme.primarySoft.opacity(0.72), lineWidth: 17)
                    Circle()
                        .trim(from: 0, to: cycleProgress(snapshot))
                        .stroke(
                            LinearGradient(
                                colors: [AppTheme.coral.opacity(0.78), AppTheme.primary],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 17, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))

                    VStack(spacing: 5) {
                        Text(snapshot.phase.localizedName)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(AppTheme.primaryDeep)
                        Text(snapshot.day, format: .number)
                            .font(.system(size: min(cycleNumberSize, 72), weight: .medium, design: .serif))
                            .foregroundStyle(AppTheme.ink)
                            .minimumScaleFactor(0.72)
                        Text("cycle.day")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(AppTheme.muted)
                    }
                    .padding(22)
                }
                .frame(width: min(cycleRingSize, 260), height: min(cycleRingSize, 260))
                .shadow(color: AppTheme.primary.opacity(0.1), radius: 24, y: 14)
                .accessibilityElement(children: .combine)

                VStack(spacing: 10) {
                    Text("today.hero.title")
                        .font(AppTheme.brandFont(.title, weight: .semibold))
                        .foregroundStyle(AppTheme.ink)
                        .multilineTextAlignment(.center)
                        .fixedSize(horizontal: false, vertical: true)
                    Text("today.hero.body")
                        .font(.body)
                        .foregroundStyle(AppTheme.muted)
                        .multilineTextAlignment(.center)
                        .lineSpacing(3)
                        .fixedSize(horizontal: false, vertical: true)
                }

                HStack(spacing: 7) {
                    Image(systemName: "calendar")
                    Text("cycle.nextPeriod")
                    Text(snapshot.nextPeriodDate, format: .dateTime.month(.abbreviated).day())
                        .fontWeight(.semibold)
                }
                .font(.caption)
                .foregroundStyle(AppTheme.primaryDeep)
                .padding(.horizontal, 14)
                .padding(.vertical, 9)
                .background(AppTheme.primarySoft.opacity(0.62), in: Capsule())
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        } else {
            VStack(spacing: 18) {
                ZStack {
                    Circle()
                        .stroke(AppTheme.primarySoft, style: StrokeStyle(lineWidth: 15, dash: [7, 7]))
                    Image(systemName: "calendar.badge.plus")
                        .font(.system(size: 44, weight: .light))
                        .foregroundStyle(AppTheme.primary)
                }
                .frame(width: min(cycleRingSize, 220), height: min(cycleRingSize, 220))

                Text("cycle.empty.title")
                    .font(AppTheme.brandFont(.title2, weight: .semibold))
                    .foregroundStyle(AppTheme.ink)
                    .multilineTextAlignment(.center)
                Text("cycle.empty.body")
                    .font(.body)
                    .foregroundStyle(AppTheme.muted)
                    .multilineTextAlignment(.center)

                Button("cycle.startToday") {
                    ensureSettingsExist()
                    modelContext.insert(CycleRecord(startDate: .now))
                }
                .buttonStyle(.borderedProminent)
                .tint(AppTheme.primaryDeep)
                .controlSize(.large)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 8)
        }
    }

    private var actionRow: some View {
        HStack(spacing: 12) {
            NavigationLink {
                CycleCalendarView()
            } label: {
                Label("today.action.calendar", systemImage: "calendar")
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(.bordered)
            .tint(AppTheme.primaryDeep)

            Button {
                isCheckInPresented = true
            } label: {
                Label("today.action.checkin", systemImage: "checklist")
                    .frame(maxWidth: .infinity, minHeight: 44)
            }
            .buttonStyle(.borderedProminent)
            .tint(AppTheme.primaryDeep)
        }
        .buttonBorderShape(.capsule)
    }

    @ViewBuilder
    private var safetyNotice: some View {
        if let notice = CarePlanEngine.safetyNotice(logs: dailyLogs) {
            VStack(alignment: .leading, spacing: 10) {
                Label("care.safety.title", systemImage: "exclamationmark.triangle")
                    .font(.headline)
                    .foregroundStyle(.red)
                Text(notice.message.value)
                    .foregroundStyle(AppTheme.ink)
                Text("care.safety.boundary")
                    .font(.caption)
                    .foregroundStyle(AppTheme.muted)
            }
            .lunaCard()
        }
    }

    private var dailyPlanSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(
                title: "today.plan.title",
                detail: "\(completedPlanCount)/\(planItems.count)",
                color: AppTheme.primaryDeep
            )

            ForEach(planItems, id: \.id) { item in
                planRow(item)
            }
        }
    }

    private func planRow(_ item: PlanItem) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 13) {
                Image(systemName: item.systemImage)
                    .font(.system(size: 21, weight: .medium))
                    .foregroundStyle(item.color)
                    .frame(width: 46, height: 46)
                    .background(AppTheme.surface, in: Circle())

                VStack(alignment: .leading, spacing: 4) {
                    Text(item.title)
                        .font(.headline)
                        .foregroundStyle(AppTheme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(item.detail)
                        .font(.caption)
                        .foregroundStyle(AppTheme.muted)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer(minLength: 6)

                Button {
                    togglePlanItem(item.id)
                } label: {
                    Image(systemName: isPlanItemComplete(item.id) ? "checkmark.circle.fill" : "circle")
                        .font(.system(size: 28, weight: .regular))
                        .foregroundStyle(isPlanItemComplete(item.id) ? AppTheme.primary : AppTheme.quiet.opacity(0.55))
                        .frame(width: 44, height: 44)
                }
                .buttonStyle(.plain)
                .accessibilityLabel(Text(item.title))
                .accessibilityValue(planCompletionValue(item))
                .accessibilityIdentifier("today.plan.\(item.id)")
            }

            if item.id == "hydrate" {
                hydrationControls
            }
        }
        .padding(16)
        .background(item.color.opacity(0.09), in: RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous)
                .stroke(AppTheme.line.opacity(0.72), lineWidth: 1)
        }
    }

    private var hydrationControls: some View {
        VStack(spacing: 10) {
            HStack {
                Button {
                    adjustWater(by: -250)
                } label: {
                    Image(systemName: "minus")
                        .frame(width: 44, height: 44)
                        .background(AppTheme.surface, in: Circle())
                }
                .buttonStyle(.plain)
                .disabled((todayLog?.waterMilliliters ?? 0) == 0)
                .accessibilityLabel("today.water.decrease")

                Spacer()

                Text("\(todayLog?.waterMilliliters ?? 0) ml")
                    .font(.headline.monospacedDigit())
                    .foregroundStyle(AppTheme.primaryDeep)

                Spacer()

                Button {
                    adjustWater(by: 250)
                } label: {
                    Image(systemName: "plus")
                        .frame(width: 44, height: 44)
                        .background(AppTheme.surface, in: Circle())
                }
                .buttonStyle(.plain)
                .accessibilityLabel("today.water.increase")
            }

            ProgressView(value: Double(todayLog?.waterMilliliters ?? 0), total: 2_000)
                .tint(AppTheme.primary)
                .accessibilityValue(Text("\(todayLog?.waterMilliliters ?? 0) ml"))
        }
    }

    private var careSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(
                title: "today.care.title",
                detail: "\(todayLog?.waterMilliliters ?? 0) ml",
                color: AppTheme.green
            )

            VStack(alignment: .leading, spacing: 0) {
                ForEach(careRecommendations) { rule in
                    VStack(alignment: .leading, spacing: 8) {
                        Text(rule.title.value)
                            .font(.headline)
                            .foregroundStyle(AppTheme.ink)
                        Text(rule.action.value)
                            .foregroundStyle(AppTheme.ink)
                        Text(rule.reason.value)
                            .font(.caption)
                            .foregroundStyle(AppTheme.muted)
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
                        .tint(AppTheme.green)
                    }
                    .padding(.vertical, 15)

                    if rule.id != careRecommendations.last?.id {
                        Divider().overlay(AppTheme.line)
                    }
                }
            }
            .lunaCard()
        }
    }

    private var mealSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            sectionHeader(title: "today.meal.title", detail: nil, color: AppTheme.green)

            if viewModel.isLoading {
                ZStack {
                    RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous)
                        .fill(AppTheme.greenSoft)
                        .frame(height: 300)
                    ProgressView()
                        .tint(AppTheme.primaryDeep)
                }
                .accessibilityLabel("loading.meal")
            } else if let meal = viewModel.meal {
                NavigationLink {
                    MealDetailView(meal: meal)
                } label: {
                    ZStack(alignment: .bottomLeading) {
                        mealArtworkBackground(meal)
                            .frame(maxWidth: .infinity)
                            .frame(height: 310)
                            .clipped()
                            .accessibilityHidden(true)

                        LinearGradient(
                            colors: [.clear, AppTheme.ink.opacity(0.25), AppTheme.ink.opacity(0.82)],
                            startPoint: .top,
                            endPoint: .bottom
                        )

                        VStack(alignment: .leading, spacing: 9) {
                            if viewModel.isUsingOfflineContent {
                                Label("content.offline.notice", systemImage: "wifi.slash")
                                    .font(.caption2.weight(.semibold))
                                    .padding(.horizontal, 9)
                                    .padding(.vertical, 5)
                                    .background(.thinMaterial, in: Capsule())
                            }

                            Text(meal.name)
                                .font(AppTheme.brandFont(.title2, weight: .semibold))
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)

                            HStack(spacing: 12) {
                                Label("\(meal.time) min", systemImage: "clock")
                                if let calories = meal.calories {
                                    Label("\(calories) kcal", systemImage: "flame")
                                }
                            }
                            .font(.caption.weight(.semibold))

                            HStack(spacing: 6) {
                                ForEach(Array(meal.tags.prefix(2)), id: \.self) { tag in
                                    Text(tag)
                                        .font(.caption2.weight(.semibold))
                                        .lineLimit(1)
                                        .padding(.horizontal, 8)
                                        .padding(.vertical, 5)
                                        .background(.ultraThinMaterial, in: Capsule())
                                }
                            }
                        }
                        .foregroundStyle(.white)
                        .padding(18)
                    }
                    .clipShape(RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous))
                    .overlay {
                        RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous)
                            .stroke(Color.white.opacity(0.28), lineWidth: 1)
                    }
                    .shadow(color: AppTheme.ink.opacity(0.16), radius: 24, y: 13)
                    .contentShape(RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous))
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("today.meal.details")
            } else {
                Text(viewModel.errorMessage ?? String(localized: "today.meal.empty"))
                    .foregroundStyle(AppTheme.muted)
                    .frame(maxWidth: .infinity, minHeight: 90, alignment: .leading)
                    .lunaCard()
            }
        }
    }

    @ViewBuilder
    private func mealArtworkBackground(_ meal: Meal) -> some View {
        if let imageURL = meal.image {
            AsyncImage(url: imageURL) { phase in
                switch phase {
                case .success(let image):
                    image
                        .resizable()
                        .scaledToFill()
                case .failure:
                    mealArtworkFallback
                case .empty:
                    ZStack {
                        AppTheme.greenSoft
                        ProgressView().tint(AppTheme.primaryDeep)
                    }
                @unknown default:
                    mealArtworkFallback
                }
            }
        } else {
            mealArtworkFallback
        }
    }

    private var mealArtworkFallback: some View {
        ZStack {
            LinearGradient(
                colors: [AppTheme.greenSoft, AppTheme.primarySoft, AppTheme.surfaceSoft],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            Image(systemName: "fork.knife")
                .font(.system(size: 54, weight: .light))
                .foregroundStyle(AppTheme.primaryDeep.opacity(0.65))
        }
    }

    private func sectionHeader(
        title: LocalizedStringKey,
        detail: String?,
        color: Color
    ) -> some View {
        HStack(alignment: .firstTextBaseline) {
            HStack(spacing: 9) {
                Circle()
                    .fill(color)
                    .frame(width: 8, height: 8)
                Text(title)
                    .font(AppTheme.brandFont(.title2, weight: .semibold))
                    .foregroundStyle(AppTheme.ink)
            }
            Spacer()
            if let detail {
                Text(detail)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(AppTheme.muted)
            }
        }
    }

    private var todayLog: DailyLog? {
        let today = Calendar.current.startOfDay(for: .now)
        return dailyLogs.first { Calendar.current.isDate($0.date, inSameDayAs: today) }
    }

    private struct PlanItem {
        let id: String
        let title: LocalizedStringKey
        let detail: LocalizedStringKey
        let systemImage: String
        let color: Color
    }

    private var planItems: [PlanItem] {
        [
            PlanItem(
                id: "nourish",
                title: "today.plan.nourish",
                detail: "today.plan.nourish.detail",
                systemImage: "pills",
                color: AppTheme.primary
            ),
            PlanItem(
                id: "move",
                title: "today.plan.move",
                detail: "today.plan.move.detail",
                systemImage: "figure.mind.and.body",
                color: AppTheme.green
            ),
            PlanItem(
                id: "hydrate",
                title: "today.plan.hydrate",
                detail: "today.plan.hydrate.detail",
                systemImage: "drop",
                color: AppTheme.gold
            )
        ]
    }

    private var completedPlanCount: Int {
        planItems.filter { isPlanItemComplete($0.id) }.count
    }

    private func isPlanItemComplete(_ id: String) -> Bool {
        todayLog?.planChecks.contains(id) == true
    }

    private func planCompletionValue(_ item: PlanItem) -> Text {
        let key = isPlanItemComplete(item.id) ? "grocery.completed" : "grocery.notCompleted"
        return Text(LocalizedStringKey(key))
    }

    private func togglePlanItem(_ id: String) {
        let log = ensureTodayLog()
        if let index = log.planChecks.firstIndex(of: id) {
            log.planChecks.remove(at: index)
        } else {
            log.planChecks.append(id)
        }
        try? modelContext.save()
    }

    private func adjustWater(by amount: Int) {
        let log = ensureTodayLog()
        log.waterMilliliters = max(0, min(4_000, log.waterMilliliters + amount))
        try? modelContext.save()
    }

    private func ensureTodayLog() -> DailyLog {
        if let todayLog { return todayLog }
        let log = DailyLog(date: Calendar.current.startOfDay(for: .now))
        modelContext.insert(log)
        return log
    }

    private func cycleProgress(_ snapshot: CycleSnapshot) -> Double {
        min(max(Double(snapshot.day) / Double(currentSettings.averageCycleLength), 0.03), 1)
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
