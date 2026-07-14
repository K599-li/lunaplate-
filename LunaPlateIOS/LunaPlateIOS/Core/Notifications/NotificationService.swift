import Foundation
import UserNotifications

@MainActor
final class NotificationService {
    static let shared = NotificationService()
    private let center = UNUserNotificationCenter.current()
    private let identifiers = ["lunaplate.period.upcoming", "lunaplate.period.today", "lunaplate.checkin.daily"]

    func enableAndSchedule(settings: UserSettings, cycles: [CycleRecord]) async -> Bool {
        do {
            let granted = try await center.requestAuthorization(options: [.alert, .sound, .badge])
            guard granted else { return false }
            await schedule(settings: settings, cycles: cycles)
            return true
        } catch {
            return false
        }
    }

    func rescheduleIfEnabled(settings: UserSettings?, cycles: [CycleRecord]) async {
        guard let settings, settings.notificationsEnabled else { return }
        await schedule(settings: settings, cycles: cycles)
    }

    func disable() {
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
    }

    private func schedule(settings: UserSettings, cycles: [CycleRecord]) async {
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        scheduleDailyCheckIn(hour: settings.reminderHour, minute: settings.reminderMinute)

        guard let snapshot = CycleCalculator.snapshot(records: cycles, settings: settings) else { return }
        scheduleOneTime(
            identifier: "lunaplate.period.upcoming",
            date: Calendar.current.date(byAdding: .day, value: -2, to: snapshot.nextPeriodDate),
            title: String(localized: "notification.periodSoon.title"),
            body: String(localized: "notification.periodSoon.body")
        )
        scheduleOneTime(
            identifier: "lunaplate.period.today",
            date: snapshot.nextPeriodDate,
            title: String(localized: "notification.periodToday.title"),
            body: String(localized: "notification.periodToday.body")
        )
    }

    private func scheduleDailyCheckIn(hour: Int, minute: Int) {
        let content = UNMutableNotificationContent()
        content.title = String(localized: "notification.checkin.title")
        content.body = String(localized: "notification.checkin.body")
        content.sound = .default

        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        let request = UNNotificationRequest(
            identifier: "lunaplate.checkin.daily",
            content: content,
            trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
        )
        center.add(request, withCompletionHandler: nil)
    }

    private func scheduleOneTime(identifier: String, date: Date?, title: String, body: String) {
        guard let date else { return }
        let deliveryDate = Calendar.current.date(
            bySettingHour: 9,
            minute: 0,
            second: 0,
            of: date
        ) ?? date
        guard deliveryDate > .now else { return }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: deliveryDate)
        center.add(UNNotificationRequest(
            identifier: identifier,
            content: content,
            trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        ), withCompletionHandler: nil)
    }
}
