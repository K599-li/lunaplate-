import Foundation

struct CycleSnapshot: Equatable {
    let day: Int
    let phase: CyclePhase
    let nextPeriodDate: Date
}

enum CycleCalculator {
    static func snapshot(
        on date: Date = .now,
        latestPeriodStart: Date,
        averageCycleLength: Int,
        averagePeriodLength: Int,
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
        return CycleSnapshot(day: day, phase: phase, nextPeriodDate: nextPeriodDate)
    }
}
