import Foundation
import SwiftData

enum CyclePhase: String, Codable, CaseIterable, Hashable, Sendable {
    case menstrual
    case follicular
    case ovulatory
    case luteal

    var apiValue: String {
        self == .ovulatory ? "ovulation" : rawValue
    }

    static func fromStoredValue(_ value: String?) -> CyclePhase? {
        guard let value else { return nil }
        if value == "ovulation" { return .ovulatory }
        return CyclePhase(rawValue: value)
    }

    var localizedName: String {
        switch self {
        case .menstrual: String(localized: "phase.menstrual")
        case .follicular: String(localized: "phase.follicular")
        case .ovulatory: String(localized: "phase.ovulatory")
        case .luteal: String(localized: "phase.luteal")
        }
    }
}

enum SymptomCatalog {
    static let all = ["cramps", "bloating", "headache", "fatigue", "insomnia", "mood_changes", "acne", "breast_tenderness"]

    static func localizedName(_ value: String) -> String {
        switch value {
        case "cramps": String(localized: "symptom.cramps")
        case "bloating": String(localized: "symptom.bloating")
        case "headache": String(localized: "symptom.headache")
        case "fatigue": String(localized: "symptom.fatigue")
        case "insomnia": String(localized: "symptom.insomnia")
        case "mood_changes": String(localized: "symptom.moodChanges")
        case "acne": String(localized: "symptom.acne")
        case "breast_tenderness": String(localized: "symptom.breastTenderness")
        default: value
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
    var painLevel: Int = 0
    var waterMilliliters: Int
    var notes: String
    var planChecks: [String]

    init(
        date: Date,
        symptoms: [String] = [],
        flow: String = "none",
        mood: String = "ok",
        painLevel: Int = 0,
        waterMilliliters: Int = 0,
        notes: String = "",
        planChecks: [String] = []
    ) {
        self.date = date
        self.dateKey = Self.dateKey(for: date)
        self.symptoms = symptoms
        self.flow = flow
        self.mood = mood
        self.painLevel = max(0, min(10, painLevel))
        self.waterMilliliters = waterMilliliters
        self.notes = notes
        self.planChecks = planChecks
    }

    static func dateKey(for date: Date) -> String {
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
    var notificationsEnabled: Bool = false
    var reminderHour: Int = 20
    var reminderMinute: Int = 0

    init(
        id: String = "current-user",
        averageCycleLength: Int = 28,
        averagePeriodLength: Int = 5,
        manualPhaseOverride: CyclePhase? = nil,
        localeIdentifier: String = Locale.current.identifier,
        notificationsEnabled: Bool = false,
        reminderHour: Int = 20,
        reminderMinute: Int = 0
    ) {
        self.id = id
        self.averageCycleLength = averageCycleLength
        self.averagePeriodLength = averagePeriodLength
        self.manualPhaseOverride = manualPhaseOverride?.rawValue
        self.localeIdentifier = localeIdentifier
        self.notificationsEnabled = notificationsEnabled
        self.reminderHour = max(0, min(23, reminderHour))
        self.reminderMinute = max(0, min(59, reminderMinute))
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
