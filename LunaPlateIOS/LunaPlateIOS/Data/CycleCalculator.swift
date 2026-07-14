import Foundation

struct CycleSnapshot: Equatable {
    let day: Int
    let phase: CyclePhase
    let nextPeriodDate: Date
    let predictedStartRange: ClosedRange<Date>
    let predictedOvulationDate: Date
    let isIrregular: Bool
}

struct CycleStatistics: Equatable {
    let averageCycleLength: Int
    let averagePeriodLength: Int
    let cycleLengthStandardDeviation: Double
    let completedCycleCount: Int

    var isIrregular: Bool {
        completedCycleCount >= 2 && cycleLengthStandardDeviation > 7
    }
}

enum CycleCalculator {
    static func statistics(
        records: [CycleRecord],
        fallbackCycleLength: Int,
        fallbackPeriodLength: Int,
        calendar: Calendar = .current
    ) -> CycleStatistics {
        let sorted = records.sorted { $0.startDate < $1.startDate }
        let recentStarts = Array(sorted.suffix(7))
        let cycleLengths = zip(recentStarts, recentStarts.dropFirst()).compactMap { current, next -> Int? in
            let length = calendar.dateComponents(
                [.day],
                from: calendar.startOfDay(for: current.startDate),
                to: calendar.startOfDay(for: next.startDate)
            ).day
            guard let length, (15...60).contains(length) else { return nil }
            return length
        }
        let recentCycleLengths = Array(cycleLengths.suffix(6))

        let periodLengths = sorted.suffix(6).compactMap { record -> Int? in
            guard let endDate = record.endDate else { return nil }
            let duration = (calendar.dateComponents(
                [.day],
                from: calendar.startOfDay(for: record.startDate),
                to: calendar.startOfDay(for: endDate)
            ).day ?? -1) + 1
            guard (1...14).contains(duration) else { return nil }
            return duration
        }

        let averageCycle = recentCycleLengths.count >= 2
            ? Int((Double(recentCycleLengths.reduce(0, +)) / Double(recentCycleLengths.count)).rounded())
            : fallbackCycleLength
        let averagePeriod = periodLengths.isEmpty
            ? fallbackPeriodLength
            : Int((Double(periodLengths.reduce(0, +)) / Double(periodLengths.count)).rounded())
        let mean = recentCycleLengths.isEmpty
            ? Double(fallbackCycleLength)
            : Double(recentCycleLengths.reduce(0, +)) / Double(recentCycleLengths.count)
        let variance = recentCycleLengths.isEmpty
            ? 0
            : recentCycleLengths.reduce(0) { partial, value in
                partial + pow(Double(value) - mean, 2)
            } / Double(recentCycleLengths.count)

        return CycleStatistics(
            averageCycleLength: max(21, min(45, averageCycle)),
            averagePeriodLength: max(2, min(10, averagePeriod)),
            cycleLengthStandardDeviation: sqrt(variance),
            completedCycleCount: recentCycleLengths.count
        )
    }

    static func snapshot(
        on date: Date = .now,
        records: [CycleRecord],
        settings: UserSettings,
        calendar: Calendar = .current
    ) -> CycleSnapshot? {
        let eligibleRecords = records.filter {
            calendar.startOfDay(for: $0.startDate) <= calendar.startOfDay(for: date)
        }
        guard let latest = eligibleRecords.max(by: { $0.startDate < $1.startDate }) else { return nil }
        let stats = statistics(
            records: eligibleRecords,
            fallbackCycleLength: settings.averageCycleLength,
            fallbackPeriodLength: settings.averagePeriodLength,
            calendar: calendar
        )
        let manualOverride = CyclePhase.fromStoredValue(settings.manualPhaseOverride)
        return snapshot(
            on: date,
            latestPeriodStart: latest.startDate,
            averageCycleLength: stats.averageCycleLength,
            averagePeriodLength: stats.averagePeriodLength,
            cycleLengthStandardDeviation: stats.cycleLengthStandardDeviation,
            completedCycleCount: stats.completedCycleCount,
            manualOverride: manualOverride,
            calendar: calendar
        )
    }

    static func snapshot(
        on date: Date = .now,
        latestPeriodStart: Date,
        averageCycleLength: Int,
        averagePeriodLength: Int,
        cycleLengthStandardDeviation: Double = 0,
        completedCycleCount: Int = 0,
        manualOverride: CyclePhase? = nil,
        calendar: Calendar = .current
    ) -> CycleSnapshot {
        let cycleLength = max(21, min(45, averageCycleLength))
        let periodLength = max(2, min(10, averagePeriodLength))
        let start = calendar.startOfDay(for: latestPeriodStart)
        let target = calendar.startOfDay(for: date)
        let elapsed = calendar.dateComponents([.day], from: start, to: target).day ?? 0
        let normalizedElapsed = ((elapsed % cycleLength) + cycleLength) % cycleLength
        let day = normalizedElapsed + 1

        let ovulationDay = max(periodLength + 3, cycleLength - 14)
        let phase: CyclePhase
        if let manualOverride {
            phase = manualOverride
        } else if day <= periodLength {
            phase = .menstrual
        } else if day < ovulationDay - 1 {
            phase = .follicular
        } else if day <= ovulationDay + 1 {
            phase = .ovulatory
        } else {
            phase = .luteal
        }

        let daysUntilNextPeriod = cycleLength - normalizedElapsed
        let nextPeriodDate = calendar.date(byAdding: .day, value: daysUntilNextPeriod, to: target) ?? target
        let isIrregular = completedCycleCount >= 2 && cycleLengthStandardDeviation > 7
        let uncertainty = isIrregular ? max(1, Int(ceil(cycleLengthStandardDeviation))) : 0
        let rangeStart = calendar.date(byAdding: .day, value: -uncertainty, to: nextPeriodDate) ?? nextPeriodDate
        let rangeEnd = calendar.date(byAdding: .day, value: uncertainty, to: nextPeriodDate) ?? nextPeriodDate
        let ovulationDate = calendar.date(byAdding: .day, value: -14, to: nextPeriodDate) ?? nextPeriodDate
        return CycleSnapshot(
            day: day,
            phase: phase,
            nextPeriodDate: nextPeriodDate,
            predictedStartRange: rangeStart...rangeEnd,
            predictedOvulationDate: ovulationDate,
            isIrregular: isIrregular
        )
    }
}
