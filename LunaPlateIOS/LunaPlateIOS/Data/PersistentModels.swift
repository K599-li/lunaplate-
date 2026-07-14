import Foundation
import SwiftData

enum CyclePhase: String, Codable, CaseIterable {
    case menstrual
    case follicular
    case ovulatory
    case luteal

    var localizedName: String {
        switch self {
        case .menstrual: String(localized: "phase.menstrual")
        case .follicular: String(localized: "phase.follicular")
        case .ovulatory: String(localized: "phase.ovulatory")
        case .luteal: String(localized: "phase.luteal")
        }
    }
}

@Model
final class CycleRecord {
    @Attribute(.unique) var id: UUID
    var startDate: Date
    var endDate: Date?

    init(id: UUID = UUID(), startDate: Date, endDate: Date? = nil) {
        self.id = id
        self.startDate = startDate
        self.endDate = endDate
    }
}

@Model
final class DailyLog {
    @Attribute(.unique) var dateKey: String
    var date: Date
    var symptoms: [String]
    var flow: String
    var mood: String
    var waterMilliliters: Int
    var notes: String
    var planChecks: [String]

    init(
        date: Date,
        symptoms: [String] = [],
        flow: String = "none",
        mood: String = "ok",
        waterMilliliters: Int = 0,
        notes: String = "",
        planChecks: [String] = []
    ) {
        self.date = date
        self.dateKey = Self.makeDateKey(date)
        self.symptoms = symptoms
        self.flow = flow
        self.mood = mood
        self.waterMilliliters = waterMilliliters
        self.notes = notes
        self.planChecks = planChecks
    }

    private static func makeDateKey(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }
}

@Model
final class UserSettings {
    @Attribute(.unique) var id: String
    var averageCycleLength: Int
    var averagePeriodLength: Int
    var manualPhaseOverride: String?
    var localeIdentifier: String

    init(
        id: String = "current-user",
        averageCycleLength: Int = 28,
        averagePeriodLength: Int = 5,
        manualPhaseOverride: CyclePhase? = nil,
        localeIdentifier: String = Locale.current.identifier
    ) {
        self.id = id
        self.averageCycleLength = averageCycleLength
        self.averagePeriodLength = averagePeriodLength
        self.manualPhaseOverride = manualPhaseOverride?.rawValue
        self.localeIdentifier = localeIdentifier
    }
}

@Model
final class GroceryItem {
    @Attribute(.unique) var id: UUID
    var name: String
    var isCompleted: Bool
    var createdAt: Date

    init(id: UUID = UUID(), name: String, isCompleted: Bool = false, createdAt: Date = .now) {
        self.id = id
        self.name = name
        self.isCompleted = isCompleted
        self.createdAt = createdAt
    }
}
