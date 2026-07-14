import Foundation

struct CareLibrary: Decodable {
    let schemaVersion: Int
    let reviewedAt: String
    let sources: [CareSource]
    let rules: [CareRule]
    let redFlags: [CareRedFlag]

    static let bundled: CareLibrary = {
        guard let url = Bundle.main.url(forResource: "care-rules", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let library = try? JSONDecoder().decode(CareLibrary.self, from: data) else {
            return CareLibrary(schemaVersion: 1, reviewedAt: "", sources: [], rules: [], redFlags: [])
        }
        return library
    }()

    func source(id: String) -> CareSource? {
        sources.first { $0.id == id }
    }
}

struct CareSource: Decodable, Identifiable {
    let id: String
    let organization: String
    let title: String
    let url: URL
}

struct CareRule: Decodable, Identifiable {
    let id: String
    let phases: [CyclePhase]
    let symptoms: [String]
    let category: String
    let priority: Int
    let title: LocalizedCareText
    let action: LocalizedCareText
    let reason: LocalizedCareText
    let safety: LocalizedCareText
    let sourceIds: [String]
}

struct CareRedFlag: Decodable, Identifiable {
    let id: String
    let kind: String
    let threshold: Int
    let message: LocalizedCareText
    let sourceIds: [String]
}

struct LocalizedCareText: Decodable {
    let en: String
    let zh: String
    let ru: String

    var value: String {
        let language = Locale.current.language.languageCode?.identifier ?? "en"
        if language == "zh" { return zh }
        if language == "ru" { return ru }
        return en
    }
}

enum CarePlanEngine {
    static func recommendations(
        phase: CyclePhase,
        symptoms: [String],
        library: CareLibrary = .bundled,
        limit: Int = 4
    ) -> [CareRule] {
        let symptomSet = Set(symptoms)
        let ranked = library.rules.compactMap { rule -> (CareRule, Int)? in
            guard rule.phases.contains(phase) else { return nil }
            let matches = symptomSet.intersection(rule.symptoms).count
            guard rule.symptoms.isEmpty || matches > 0 else { return nil }
            return (rule, rule.priority + matches * 50)
        }
        .sorted {
            if $0.1 == $1.1 { return $0.0.id < $1.0.id }
            return $0.1 > $1.1
        }
        return Array(ranked.prefix(max(1, limit)).map(\.0))
    }

    static func safetyNotice(
        logs: [DailyLog],
        library: CareLibrary = .bundled,
        calendar: Calendar = .current
    ) -> CareRedFlag? {
        if let today = logs.first(where: { calendar.isDateInToday($0.date) }),
           let painRule = library.redFlags.first(where: { $0.kind == "painLevel" }),
           today.painLevel >= painRule.threshold {
            return painRule
        }

        guard let flowRule = library.redFlags.first(where: { $0.kind == "heavyFlowConsecutiveDays" }) else {
            return nil
        }
        let heavyDays = Set(logs.filter { $0.flow == "heavy" }.map { DailyLog.dateKey(for: $0.date) })
        var cursor = calendar.startOfDay(for: .now)
        var consecutive = 0
        while heavyDays.contains(DailyLog.dateKey(for: cursor)) {
            consecutive += 1
            cursor = calendar.date(byAdding: .day, value: -1, to: cursor) ?? cursor
        }
        return consecutive >= flowRule.threshold ? flowRule : nil
    }
}
