import Foundation
import SwiftUI
import UniformTypeIdentifiers

struct LunaPlateArchive: Codable {
    let schemaVersion: Int
    let exportedAt: String
    let cycles: [ArchiveCycle]
    let days: [ArchiveDailyLog]
    let settings: ArchiveSettings
    let groceries: [ArchiveGroceryItem]

    init(
        schemaVersion: Int = 1,
        exportedAt: String = ISO8601DateFormatter().string(from: .now),
        cycles: [ArchiveCycle] = [],
        days: [ArchiveDailyLog] = [],
        settings: ArchiveSettings = .init(),
        groceries: [ArchiveGroceryItem] = []
    ) {
        self.schemaVersion = schemaVersion
        self.exportedAt = exportedAt
        self.cycles = cycles
        self.days = days
        self.settings = settings
        self.groceries = groceries
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        schemaVersion = try container.decodeIfPresent(Int.self, forKey: .schemaVersion) ?? 1
        exportedAt = try container.decodeIfPresent(String.self, forKey: .exportedAt) ?? ""
        cycles = try container.decodeIfPresent([ArchiveCycle].self, forKey: .cycles) ?? []
        days = try container.decodeIfPresent([ArchiveDailyLog].self, forKey: .days) ?? []
        settings = try container.decodeIfPresent(ArchiveSettings.self, forKey: .settings) ?? .init()
        groceries = try container.decodeIfPresent([ArchiveGroceryItem].self, forKey: .groceries) ?? []
    }

    func validate() throws {
        guard schemaVersion == 1 else { throw ArchiveError.unsupportedVersion }
        guard (21...45).contains(settings.averageCycleLength),
              (2...10).contains(settings.averagePeriodLength),
              (0...23).contains(settings.reminderHour),
              (0...59).contains(settings.reminderMinute) else {
            throw ArchiveError.invalidSettings
        }

        var cycleStarts = Set<String>()
        for cycle in cycles {
            guard let start = ArchiveDate.date(cycle.startDate) else { throw ArchiveError.invalidDate }
            if let endValue = cycle.endDate {
                guard let end = ArchiveDate.date(endValue), end >= start else { throw ArchiveError.invalidDate }
            }
            guard cycleStarts.insert(cycle.startDate).inserted else { throw ArchiveError.duplicateRecord }
        }

        var dayKeys = Set<String>()
        for day in days {
            guard ArchiveDate.date(day.date) != nil else { throw ArchiveError.invalidDate }
            guard (0...10).contains(day.painLevel),
                  (0...5000).contains(day.waterMilliliters) else { throw ArchiveError.invalidDailyLog }
            guard dayKeys.insert(day.date).inserted else { throw ArchiveError.duplicateRecord }
        }
    }
}

struct ArchiveCycle: Codable {
    let startDate: String
    let endDate: String?
}

struct ArchiveDailyLog: Codable {
    let date: String
    let symptoms: [String]
    let flow: String
    let mood: String
    let painLevel: Int
    let waterMilliliters: Int
    let notes: String
    let planChecks: [String]
}

struct ArchiveSettings: Codable {
    let averageCycleLength: Int
    let averagePeriodLength: Int
    let manualPhaseOverride: String?
    let localeIdentifier: String
    let notificationsEnabled: Bool
    let reminderHour: Int
    let reminderMinute: Int

    init(
        averageCycleLength: Int = 28,
        averagePeriodLength: Int = 5,
        manualPhaseOverride: String? = nil,
        localeIdentifier: String = Locale.current.identifier,
        notificationsEnabled: Bool = false,
        reminderHour: Int = 20,
        reminderMinute: Int = 0
    ) {
        self.averageCycleLength = averageCycleLength
        self.averagePeriodLength = averagePeriodLength
        self.manualPhaseOverride = manualPhaseOverride
        self.localeIdentifier = localeIdentifier
        self.notificationsEnabled = notificationsEnabled
        self.reminderHour = reminderHour
        self.reminderMinute = reminderMinute
    }

    private enum CodingKeys: String, CodingKey {
        case averageCycleLength
        case averagePeriodLength
        case avgCycleLength
        case avgPeriodLength
        case manualPhaseOverride
        case manualOverride
        case localeIdentifier
        case notificationsEnabled
        case reminderHour
        case reminderMinute
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        averageCycleLength = try container.decodeIfPresent(Int.self, forKey: .averageCycleLength)
            ?? container.decodeIfPresent(Int.self, forKey: .avgCycleLength)
            ?? 28
        averagePeriodLength = try container.decodeIfPresent(Int.self, forKey: .averagePeriodLength)
            ?? container.decodeIfPresent(Int.self, forKey: .avgPeriodLength)
            ?? 5
        manualPhaseOverride = try container.decodeIfPresent(String.self, forKey: .manualPhaseOverride)
            ?? container.decodeIfPresent(String.self, forKey: .manualOverride)
        localeIdentifier = try container.decodeIfPresent(String.self, forKey: .localeIdentifier) ?? Locale.current.identifier
        notificationsEnabled = try container.decodeIfPresent(Bool.self, forKey: .notificationsEnabled) ?? false
        reminderHour = try container.decodeIfPresent(Int.self, forKey: .reminderHour) ?? 20
        reminderMinute = try container.decodeIfPresent(Int.self, forKey: .reminderMinute) ?? 0
    }
}

struct ArchiveGroceryItem: Codable {
    let name: String
    let isCompleted: Bool
    let createdAt: String
}

struct LunaPlateArchiveDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    var archive: LunaPlateArchive

    init(archive: LunaPlateArchive = .init()) {
        self.archive = archive
    }

    init(configuration: ReadConfiguration) throws {
        guard let data = configuration.file.regularFileContents else { throw ArchiveError.unreadableFile }
        archive = try JSONDecoder().decode(LunaPlateArchive.self, from: data)
        try archive.validate()
    }

    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
        return FileWrapper(regularFileWithContents: try encoder.encode(archive))
    }
}

enum ArchiveDate {
    static func string(_ date: Date) -> String {
        let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }

    static func date(_ value: String) -> Date? {
        let parts = value.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }
        return Calendar.current.date(from: DateComponents(year: parts[0], month: parts[1], day: parts[2]))
    }
}

enum ArchiveError: LocalizedError {
    case unreadableFile
    case unsupportedVersion
    case invalidSettings
    case invalidDate
    case invalidDailyLog
    case duplicateRecord

    var errorDescription: String? {
        switch self {
        case .unreadableFile: String(localized: "archive.error.unreadable")
        case .unsupportedVersion: String(localized: "archive.error.version")
        case .invalidSettings: String(localized: "archive.error.settings")
        case .invalidDate: String(localized: "archive.error.date")
        case .invalidDailyLog: String(localized: "archive.error.log")
        case .duplicateRecord: String(localized: "archive.error.duplicate")
        }
    }
}
