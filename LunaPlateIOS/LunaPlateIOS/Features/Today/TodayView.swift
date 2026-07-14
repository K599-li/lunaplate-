import SwiftData
import SwiftUI

struct TodayView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @Query private var dailyLogs: [DailyLog]
    @StateObject private var viewModel = TodayViewModel()

    private var currentSettings: UserSettings {
        settings.first ?? UserSettings()
    }

    private var snapshot: CycleSnapshot? {
        guard let latestStart = cycles.first?.startDate else { return nil }
        let manualOverride = currentSettings.manualPhaseOverride.flatMap(CyclePhase.init(rawValue:))
        return CycleCalculator.snapshot(
            latestPeriodStart: latestStart,
            averageCycleLength: currentSettings.averageCycleLength,
            averagePeriodLength: currentSettings.averagePeriodLength,
            manualOverride: manualOverride
        )
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
                dailyCareCard
                mealCard
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.today")
        .navigationBarTitleDisplayMode(.inline)
        .task(id: snapshot?.phase) {
            await viewModel.load(phase: snapshot?.phase ?? .luteal)
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

    private var dailyCareCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("today.care.title", systemImage: "heart.text.square")
                .font(.headline)
                .foregroundStyle(AppTheme.sage)
            Text("today.care.body")
                .foregroundStyle(.secondary)
            HStack {
                Label("today.care.hydration", systemImage: "drop")
                Spacer()
                Text(todayLog.map { "\($0.waterMilliliters) ml" } ?? "0 ml")
                    .foregroundStyle(.secondary)
            }
        }
        .lunaCard()
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
                HStack(spacing: 14) {
                    AsyncImage(url: meal.image) { image in
                        image.resizable().scaledToFill()
                    } placeholder: {
                        AppTheme.oat.opacity(0.35)
                    }
                    .frame(width: 92, height: 92)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

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
                }
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

    private func ensureSettingsExist() {
        guard settings.isEmpty else { return }
        modelContext.insert(UserSettings())
    }
}
