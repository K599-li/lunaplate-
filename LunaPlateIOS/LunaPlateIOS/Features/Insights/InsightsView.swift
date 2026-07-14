import Charts
import SwiftData
import SwiftUI

struct InsightsView: View {
    @Query(sort: \CycleRecord.startDate) private var cycles: [CycleRecord]
    @Query private var logs: [DailyLog]
    @Query private var settings: [UserSettings]

    private var currentSettings: UserSettings {
        settings.first ?? UserSettings()
    }

    private var statistics: CycleStatistics {
        CycleCalculator.statistics(
            records: cycles,
            fallbackCycleLength: currentSettings.averageCycleLength,
            fallbackPeriodLength: currentSettings.averagePeriodLength
        )
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                Text("insights.title")
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .foregroundStyle(AppTheme.plumText)

                HStack(spacing: 14) {
                    metricCard(value: cycles.count, label: "insights.cycles", color: AppTheme.berry)
                    metricCard(value: logs.count, label: "insights.checkins", color: AppTheme.sage)
                }

                if statistics.isIrregular {
                    Label("insights.irregular", systemImage: "calendar.badge.exclamationmark")
                        .font(.subheadline)
                        .foregroundStyle(AppTheme.berry)
                        .lunaCard()
                }

                cycleTrendCard
                symptomPatternCard

                NavigationLink {
                    CycleCalendarView()
                } label: {
                    Label("insights.openCalendar", systemImage: "calendar")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.insights")
        .navigationBarTitleDisplayMode(.inline)
    }

    @ViewBuilder
    private var cycleTrendCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("insights.trend.title", systemImage: "chart.line.uptrend.xyaxis")
                .font(.headline)

            if cyclePoints.count >= 2 {
                Chart(cyclePoints) { point in
                    LineMark(
                        x: .value("Date", point.startDate),
                        y: .value("Days", point.length)
                    )
                    .foregroundStyle(AppTheme.berry)
                    .interpolationMethod(.catmullRom)

                    PointMark(
                        x: .value("Date", point.startDate),
                        y: .value("Days", point.length)
                    )
                    .foregroundStyle(AppTheme.berry)
                }
                .chartYScale(domain: 15...50)
                .frame(height: 190)

                Text(String(format: String(localized: "insights.average.format"), statistics.averageCycleLength))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                ContentUnavailableView(
                    "insights.trend.empty.title",
                    systemImage: "chart.xyaxis.line",
                    description: Text("insights.trend.placeholder")
                )
                .frame(minHeight: 180)
            }
        }
        .lunaCard()
    }

    @ViewBuilder
    private var symptomPatternCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Label("insights.symptoms.title", systemImage: "square.grid.3x3")
                .font(.headline)

            if symptomPoints.isEmpty {
                Text("insights.symptoms.empty")
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, minHeight: 90, alignment: .leading)
            } else {
                Chart(symptomPoints.prefix(6)) { point in
                    BarMark(
                        x: .value("Count", point.count),
                        y: .value("Symptom", SymptomCatalog.localizedName(point.symptom))
                    )
                    .foregroundStyle(AppTheme.sage.gradient)
                    .annotation(position: .trailing) {
                        Text(point.count, format: .number)
                            .font(.caption2)
                    }
                }
                .frame(height: CGFloat(max(160, symptomPoints.prefix(6).count * 38)))
                .chartXAxis(.hidden)

                if let strongestPattern {
                    Text(strongestPattern)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .lunaCard()
    }

    private func metricCard(value: Int, label: LocalizedStringKey, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(value, format: .number)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(color)
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .lunaCard()
    }

    private var cyclePoints: [CycleLengthPoint] {
        zip(cycles, cycles.dropFirst()).compactMap { current, next in
            let length = Calendar.current.dateComponents(
                [.day],
                from: Calendar.current.startOfDay(for: current.startDate),
                to: Calendar.current.startOfDay(for: next.startDate)
            ).day ?? 0
            guard (15...60).contains(length) else { return nil }
            return CycleLengthPoint(startDate: current.startDate, length: length)
        }
    }

    private var symptomPoints: [SymptomCountPoint] {
        var counts: [String: Int] = [:]
        for symptom in logs.flatMap(\.symptoms) {
            counts[symptom, default: 0] += 1
        }
        return counts.map { SymptomCountPoint(symptom: $0.key, count: $0.value) }
            .sorted {
                if $0.count == $1.count { return $0.symptom < $1.symptom }
                return $0.count > $1.count
            }
    }

    private var strongestPattern: String? {
        var phaseCounts: [String: [CyclePhase: Int]] = [:]
        for log in logs {
            guard let phase = CycleCalculator.snapshot(
                on: log.date,
                records: cycles,
                settings: currentSettings
            )?.phase else { continue }
            for symptom in log.symptoms {
                phaseCounts[symptom, default: [:]][phase, default: 0] += 1
            }
        }
        guard let topSymptom = symptomPoints.first?.symptom,
              let counts = phaseCounts[topSymptom],
              let peak = counts.max(by: { $0.value < $1.value }),
              peak.value >= 2 else { return nil }
        return String(
            format: String(localized: "insights.pattern.format"),
            SymptomCatalog.localizedName(topSymptom),
            peak.key.localizedName
        )
    }
}

private struct CycleLengthPoint: Identifiable {
    let startDate: Date
    let length: Int
    var id: Date { startDate }
}

private struct SymptomCountPoint: Identifiable {
    let symptom: String
    let count: Int
    var id: String { symptom }
}
