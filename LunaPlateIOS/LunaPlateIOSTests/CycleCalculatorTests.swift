import Foundation
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

    func testSnapshotStatisticsIgnoreFutureRecords() {
        let records = [
            record("2026-05-01", end: "2026-05-05"),
            record("2026-05-29", end: "2026-06-02"),
            record("2026-06-26", end: "2026-06-30"),
            record("2026-09-20", end: "2026-09-24")
        ]
        let settings = UserSettings(averageCycleLength: 35, averagePeriodLength: 5)

        let snapshot = CycleCalculator.snapshot(
            on: date("2026-07-01"),
            records: records,
            settings: settings,
            calendar: calendar
        )

        XCTAssertEqual(snapshot?.nextPeriodDate, date("2026-07-24"))
        XCTAssertEqual(snapshot?.phase, .follicular)
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

    func testArchiveRejectsInvalidHealthAndGroceryValues() {
        let badLog = ArchiveDailyLog(
            date: "2026-07-01", symptoms: ["unknown"], flow: "massive", mood: "ok",
            painLevel: 5, waterMilliliters: 500, notes: "", planChecks: []
        )
        let badGrocery = ArchiveGroceryItem(name: "", isCompleted: false, createdAt: "not-a-date")

        XCTAssertThrowsError(try LunaPlateArchive(days: [badLog]).validate())
        XCTAssertThrowsError(try LunaPlateArchive(groceries: [badGrocery]).validate())
    }

    func testArchiveRoundTripsGroceryItems() throws {
        let original = LunaPlateArchive(groceries: [
            ArchiveGroceryItem(name: "rolled oats", isCompleted: true, createdAt: "2026-07-14T12:00:00Z")
        ])
        let data = try JSONEncoder().encode(original)
        let decoded = try JSONDecoder().decode(LunaPlateArchive.self, from: data)
        try decoded.validate()

        XCTAssertEqual(decoded.groceries.first?.name, "rolled oats")
        XCTAssertEqual(decoded.groceries.first?.isCompleted, true)
    }

    func testOvulatoryPhaseMapsToLegacyBackendAndWebValue() {
        XCTAssertEqual(CyclePhase.ovulatory.apiValue, "ovulation")
        XCTAssertEqual(CyclePhase.fromStoredValue("ovulation"), .ovulatory)
        XCTAssertEqual(CyclePhase.fromStoredValue("luteal"), .luteal)
    }

    func testOfflineMealsPrioritizeTheActivePhase() {
        let meals = OfflineContent.meals(phase: .menstrual, symptoms: ["cramps"])

        XCTAssertGreaterThanOrEqual(meals.count, 10)
        XCTAssertEqual(meals.first?.id, "oat-berry")
        XCTAssertTrue(meals.allSatisfy { $0.source == "offline" })
    }

    func testOfflineTodayMealUsesTimeOfDay() {
        let lunch = OfflineContent.todayMeal(phase: .follicular, symptoms: [], hour: 13)
        let dinner = OfflineContent.todayMeal(phase: .follicular, symptoms: [], hour: 19)

        XCTAssertEqual(lunch?.type, "lunch")
        XCTAssertEqual(dinner?.type, "dinner")
    }

    func testOfflineMovementRespondsToSymptomsAndLimit() {
        let exercises = OfflineContent.exercises(phase: .menstrual, symptoms: ["cramps"], limit: 3)

        XCTAssertEqual(exercises.count, 3)
        XCTAssertTrue(["breathing", "cat-cow", "hips"].contains(exercises.first?.id ?? ""))
        XCTAssertTrue(exercises.allSatisfy { $0.source == "offline" })
    }

    private func record(_ start: String, end: String? = nil) -> CycleRecord {
        CycleRecord(startDate: date(start), endDate: end.map(date))
    }

    private func date(_ value: String) -> Date {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        return calendar.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))!
    }
}

final class APIClientTests: XCTestCase {
    func testHealthRecommendationUsesJSONPostWithoutURLQuery() throws {
        let client = APIClient(baseURL: URL(string: "https://example.test")!)
        let request = try client.makeRecommendationRequest(
            path: "api/female-exercises", phase: .menstrual, symptoms: ["cramps"], limit: 3
        )
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertNil(request.url?.query)
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try XCTUnwrap(request.httpBody)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        XCTAssertEqual(json["phase"] as? String, "menstrual")
        XCTAssertEqual(json["symptoms"] as? [String], ["cramps"])
        XCTAssertEqual(json["limit"] as? Int, 3)
    }
}
