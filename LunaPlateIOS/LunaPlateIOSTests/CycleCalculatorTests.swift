import XCTest
@testable import LunaPlate

final class CycleCalculatorTests: XCTestCase {
    private var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        return calendar
    }

    func testStatisticsUsesRecentRecordedCyclesAndPeriodLengths() {
        let records = [
            record("2026-01-01", end: "2026-01-05"),
            record("2026-01-29", end: "2026-02-02"),
            record("2026-02-28", end: "2026-03-04")
        ]

        let result = CycleCalculator.statistics(
            records: records,
            fallbackCycleLength: 35,
            fallbackPeriodLength: 7,
            calendar: calendar
        )

        XCTAssertEqual(result.averageCycleLength, 29)
        XCTAssertEqual(result.averagePeriodLength, 5)
        XCTAssertEqual(result.completedCycleCount, 2)
        XCTAssertEqual(result.cycleLengthStandardDeviation, 1, accuracy: 0.001)
        XCTAssertFalse(result.isIrregular)
    }

    func testStatisticsFallsBackUntilTwoCycleIntervalsExist() {
        let records = [record("2026-01-01"), record("2026-01-30")]

        let result = CycleCalculator.statistics(
            records: records,
            fallbackCycleLength: 27,
            fallbackPeriodLength: 6,
            calendar: calendar
        )

        XCTAssertEqual(result.averageCycleLength, 27)
        XCTAssertEqual(result.averagePeriodLength, 6)
        XCTAssertEqual(result.completedCycleCount, 1)
    }

    func testIrregularHistoryProducesPredictionRange() {
        let records = [
            record("2026-01-01"),
            record("2026-01-22"),
            record("2026-03-03")
        ]
        let settings = UserSettings(averageCycleLength: 28, averagePeriodLength: 5)

        let snapshot = CycleCalculator.snapshot(
            on: date("2026-03-10"),
            records: records,
            settings: settings,
            calendar: calendar
        )

        XCTAssertNotNil(snapshot)
        XCTAssertTrue(snapshot?.isIrregular == true)
        XCTAssertNotEqual(snapshot?.predictedStartRange.lowerBound, snapshot?.predictedStartRange.upperBound)
    }

    func testManualOverrideWinsWithoutChangingCycleDay() {
        let result = CycleCalculator.snapshot(
            on: date("2026-07-05"),
            latestPeriodStart: date("2026-07-01"),
            averageCycleLength: 28,
            averagePeriodLength: 5,
            manualOverride: .ovulatory,
            calendar: calendar
        )

        XCTAssertEqual(result.day, 5)
        XCTAssertEqual(result.phase, .ovulatory)
    }

    func testArchiveDecodesExistingWebCycleSchema() throws {
        let json = #"""
        {
          "schemaVersion": 1,
          "cycles": [{"startDate":"2026-06-05","endDate":"2026-06-10"}],
          "settings": {"avgCycleLength":29,"avgPeriodLength":6,"manualOverride":"luteal"}
        }
        """#.data(using: .utf8)!

        let archive = try JSONDecoder().decode(LunaPlateArchive.self, from: json)
        try archive.validate()

        XCTAssertEqual(archive.cycles.count, 1)
        XCTAssertEqual(archive.settings.averageCycleLength, 29)
        XCTAssertEqual(archive.settings.averagePeriodLength, 6)
        XCTAssertEqual(archive.settings.manualPhaseOverride, "luteal")
        XCTAssertTrue(archive.days.isEmpty)
    }

    func testArchiveRejectsUnsupportedVersion() throws {
        let archive = LunaPlateArchive(schemaVersion: 99)
        XCTAssertThrowsError(try archive.validate())
    }

    func testOvulatoryPhaseMapsToLegacyBackendAndWebValue() {
        XCTAssertEqual(CyclePhase.ovulatory.apiValue, "ovulation")
        XCTAssertEqual(CyclePhase.fromStoredValue("ovulation"), .ovulatory)
        XCTAssertEqual(CyclePhase.fromStoredValue("luteal"), .luteal)
    }

    private func record(_ start: String, end: String? = nil) -> CycleRecord {
        CycleRecord(startDate: date(start), endDate: end.map(date))
    }

    private func date(_ value: String) -> Date {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))!
    }
}
