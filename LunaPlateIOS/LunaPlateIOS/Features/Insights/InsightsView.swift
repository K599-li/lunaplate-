import SwiftData
import SwiftUI

struct InsightsView: View {
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var logs: [DailyLog]

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

                VStack(alignment: .leading, spacing: 12) {
                    Label("insights.trend.title", systemImage: "chart.line.uptrend.xyaxis")
                        .font(.headline)
                    Text("insights.trend.placeholder")
                        .foregroundStyle(.secondary)
                    RoundedRectangle(cornerRadius: 14)
                        .fill(AppTheme.sage.opacity(0.12))
                        .frame(height: 180)
                        .overlay {
                            Image(systemName: "chart.xyaxis.line")
                                .font(.system(size: 42, weight: .light))
                                .foregroundStyle(AppTheme.sage)
                        }
                }
                .lunaCard()
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.insights")
        .navigationBarTitleDisplayMode(.inline)
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
}
