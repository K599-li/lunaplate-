import SwiftData
import SwiftUI

struct CycleCalendarView: View {
    @Query(sort: \CycleRecord.startDate) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @State private var displayedMonth = Calendar.current.date(
        from: Calendar.current.dateComponents([.year, .month], from: .now)
    ) ?? .now
    @State private var selectedDate = Date.now
    @State private var editingRecord: CycleRecord?
    @State private var isEditorPresented = false

    private let calendar = Calendar.current

    private var currentSettings: UserSettings {
        settings.first ?? UserSettings()
    }

    private var snapshot: CycleSnapshot? {
        CycleCalculator.snapshot(records: cycles, settings: currentSettings)
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
            VStack(spacing: 20) {
                calendarCard
                legend
                predictionCard

                Button {
                    editingRecord = record(containing: selectedDate)
                    isEditorPresented = true
                } label: {
                    Label(
                        recordButtonTitle,
                        systemImage: "drop.fill"
                    )
                    .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
            }
            .padding(AppTheme.pagePadding)
        }
        .background(AppTheme.pageBackground.ignoresSafeArea())
        .tint(AppTheme.primaryDeep)
        .navigationTitle("calendar.title")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $isEditorPresented) {
            NavigationStack {
                PeriodEditorView(record: editingRecord, initialDate: selectedDate)
            }
        }
    }

    private var calendarCard: some View {
        VStack(spacing: 16) {
            HStack {
                Button {
                    displayedMonth = calendar.date(byAdding: .month, value: -1, to: displayedMonth) ?? displayedMonth
                } label: {
                    Image(systemName: "chevron.left")
                }

                Spacer()
                Text(displayedMonth, format: .dateTime.month(.wide).year())
                    .font(.headline)
                Spacer()

                Button {
                    displayedMonth = calendar.date(byAdding: .month, value: 1, to: displayedMonth) ?? displayedMonth
                } label: {
                    Image(systemName: "chevron.right")
                }
            }

            LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 7), spacing: 9) {
                ForEach(weekdaySymbols, id: \.self) { symbol in
                    Text(symbol)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.secondary)
                }

                ForEach(Array(monthCells.enumerated()), id: \.offset) { _, date in
                    if let date {
                        dayCell(date)
                    } else {
                        Color.clear.frame(height: 38)
                    }
                }
            }
        }
        .lunaCard()
    }

    private func dayCell(_ date: Date) -> some View {
        let actual = record(containing: date) != nil
        let predicted = isPredictedPeriod(date)
        let ovulation = snapshot.map { calendar.isDate(date, inSameDayAs: $0.predictedOvulationDate) } ?? false
        let selected = calendar.isDate(date, inSameDayAs: selectedDate)
        let today = calendar.isDateInToday(date)

        return Button {
            selectedDate = date
        } label: {
            ZStack {
                if actual {
                    Circle().fill(AppTheme.berry)
                } else if predicted {
                    Circle()
                        .stroke(AppTheme.rose, style: StrokeStyle(lineWidth: 2, dash: [3, 3]))
                } else if selected {
                    Circle().stroke(AppTheme.sage, lineWidth: 2)
                }

                Text(date, format: .dateTime.day())
                    .font(.subheadline.weight(today ? .bold : .regular))
                    .foregroundStyle(actual ? Color.white : Color.primary)

                if ovulation && !actual {
                    Circle()
                        .fill(AppTheme.sage)
                        .frame(width: 5, height: 5)
                        .offset(y: 14)
                }
            }
            .frame(height: 38)
        }
        .buttonStyle(.plain)
        .accessibilityLabel(date.formatted(date: .complete, time: .omitted))
    }

    private var legend: some View {
        HStack(spacing: 18) {
            legendItem("calendar.legend.actual", color: AppTheme.berry, outlined: false)
            legendItem("calendar.legend.predicted", color: AppTheme.rose, outlined: true)
            legendItem("calendar.legend.ovulation", color: AppTheme.sage, outlined: false)
        }
        .font(.caption)
    }

    private func legendItem(_ title: LocalizedStringKey, color: Color, outlined: Bool) -> some View {
        HStack(spacing: 6) {
            Circle()
                .fill(outlined ? Color.clear : color)
                .overlay { Circle().stroke(color, lineWidth: outlined ? 1.5 : 0) }
                .frame(width: 10, height: 10)
            Text(title)
        }
    }

    private var predictionCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("calendar.prediction.title", systemImage: "sparkles")
                .font(.headline)
                .foregroundStyle(AppTheme.berry)

            if let snapshot {
                if snapshot.isIrregular {
                    Text(
                        "\(snapshot.predictedStartRange.lowerBound.formatted(date: .abbreviated, time: .omitted)) – \(snapshot.predictedStartRange.upperBound.formatted(date: .abbreviated, time: .omitted))"
                    )
                    .font(.title3.bold())
                    Text("calendar.irregular.help")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                } else {
                    Text(snapshot.nextPeriodDate, format: .dateTime.month(.wide).day())
                        .font(.title3.bold())
                }

                Text(String(format: String(localized: "calendar.average.format"), statistics.averageCycleLength))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            } else {
                Text("calendar.prediction.empty")
                    .foregroundStyle(.secondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .lunaCard()
    }

    private var weekdaySymbols: [String] {
        let symbols = calendar.veryShortStandaloneWeekdaySymbols
        let offset = max(0, calendar.firstWeekday - 1)
        return Array(symbols[offset...]) + Array(symbols[..<offset])
    }

    private var monthCells: [Date?] {
        guard let interval = calendar.dateInterval(of: .month, for: displayedMonth),
              let dayRange = calendar.range(of: .day, in: .month, for: displayedMonth) else { return [] }
        let first = interval.start
        let weekday = calendar.component(.weekday, from: first)
        let leading = (weekday - calendar.firstWeekday + 7) % 7
        return Array(repeating: nil, count: leading) + dayRange.compactMap { day in
            calendar.date(byAdding: .day, value: day - 1, to: first)
        }.map(Optional.some)
    }

    private func record(containing date: Date) -> CycleRecord? {
        let target = calendar.startOfDay(for: date)
        return cycles.first { record in
            let start = calendar.startOfDay(for: record.startDate)
            let end = calendar.startOfDay(for: record.endDate ?? record.startDate)
            return (start...end).contains(target)
        }
    }

    private func isPredictedPeriod(_ date: Date) -> Bool {
        guard let snapshot else { return false }
        let target = calendar.startOfDay(for: date)
        let start = calendar.startOfDay(for: snapshot.predictedStartRange.lowerBound)
        let finalPossibleStart = calendar.startOfDay(for: snapshot.predictedStartRange.upperBound)
        let end = calendar.date(
            byAdding: .day,
            value: statistics.averagePeriodLength - 1,
            to: finalPossibleStart
        ) ?? finalPossibleStart
        return (start...end).contains(target)
    }

    private var recordButtonTitle: LocalizedStringKey {
        record(containing: selectedDate) == nil ? "calendar.record" : "calendar.editRecord"
    }
}

private struct PeriodEditorView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var allRecords: [CycleRecord]
    let record: CycleRecord?
    @State private var startDate: Date
    @State private var hasEnded: Bool
    @State private var endDate: Date
    @State private var alertMessage: String?

    init(record: CycleRecord?, initialDate: Date) {
        self.record = record
        let start = record?.startDate ?? initialDate
        _startDate = State(initialValue: start)
        _hasEnded = State(initialValue: record?.endDate != nil)
        _endDate = State(initialValue: record?.endDate ?? start)
    }

    var body: some View {
        Form {
            Section("periodEditor.dates") {
                DatePicker("periodEditor.start", selection: $startDate, in: ...Date.now, displayedComponents: .date)
                Toggle("periodEditor.hasEnded", isOn: $hasEnded)
                if hasEnded {
                    DatePicker(
                        "periodEditor.end",
                        selection: $endDate,
                        in: startDate...Date.now,
                        displayedComponents: .date
                    )
                }
            }

            if let record {
                Section {
                    Button("common.delete", role: .destructive) {
                        modelContext.delete(record)
                        do {
                            try modelContext.save()
                            dismiss()
                        } catch {
                            alertMessage = error.localizedDescription
                        }
                    }
                }
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppTheme.pageBackground.ignoresSafeArea())
        .tint(AppTheme.primaryDeep)
        .navigationTitle(editorTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("common.cancel") { dismiss() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("common.save") { save() }
            }
        }
        .alert("common.couldNotSave", isPresented: Binding(
            get: { alertMessage != nil },
            set: { if !$0 { alertMessage = nil } }
        )) {
            Button("common.done", role: .cancel) {}
        } message: {
            Text(alertMessage ?? "")
        }
    }

    private func save() {
        let normalizedStart = Calendar.current.startOfDay(for: startDate)
        let normalizedEnd = hasEnded ? max(normalizedStart, Calendar.current.startOfDay(for: endDate)) : nil
        let candidateRange = normalizedStart...(normalizedEnd ?? normalizedStart)
        let overlaps = allRecords.contains { existing in
            guard existing.id != record?.id else { return false }
            let existingStart = Calendar.current.startOfDay(for: existing.startDate)
            let existingEnd = Calendar.current.startOfDay(for: existing.endDate ?? existing.startDate)
            return candidateRange.overlaps(existingStart...existingEnd)
        }
        guard !overlaps else {
            alertMessage = String(localized: "periodEditor.overlapError")
            return
        }
        if let record {
            record.startDate = normalizedStart
            record.endDate = normalizedEnd
        } else {
            modelContext.insert(CycleRecord(startDate: normalizedStart, endDate: normalizedEnd))
        }
        do {
            try modelContext.save()
            dismiss()
        } catch {
            alertMessage = error.localizedDescription
        }
    }

    private var editorTitle: LocalizedStringKey {
        record == nil ? "periodEditor.addTitle" : "periodEditor.editTitle"
    }
}
