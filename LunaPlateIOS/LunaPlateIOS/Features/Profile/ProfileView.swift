import SwiftData
import SwiftUI
import UniformTypeIdentifiers

struct ProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var settings: [UserSettings]
    @Query private var cycles: [CycleRecord]
    @Query private var logs: [DailyLog]
    @Query private var groceries: [GroceryItem]
    @State private var isExporting = false
    @State private var isImporting = false
    @State private var exportDocument = LunaPlateArchiveDocument()
    @State private var pendingImport: LunaPlateArchive?
    @State private var transferMessage: String?
    @State private var isDeleteConfirmationPresented = false

    var body: some View {
        Form {
            if let currentSettings = settings.first {
                ProfileCycleSettings(settings: currentSettings)
                NotificationSettingsView(settings: currentSettings, cycles: cycles)
            } else {
                ProgressView()
            }

            Section("profile.language.section") {
                Text("profile.language.help")
                    .foregroundStyle(.secondary)
            }

            Section("profile.data.section") {
                Button {
                    exportDocument = LunaPlateArchiveDocument(archive: makeArchive())
                    isExporting = true
                } label: {
                    Label("profile.data.export", systemImage: "square.and.arrow.up")
                }

                Button {
                    isImporting = true
                } label: {
                    Label("profile.data.import", systemImage: "square.and.arrow.down")
                }

                Button("profile.data.deleteAll", role: .destructive) {
                    isDeleteConfirmationPresented = true
                }

                Text("profile.data.help")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section("profile.privacy.section") {
                Label("profile.privacy.local", systemImage: "lock.shield")
                Text("profile.privacy.body")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                NavigationLink("profile.privacy.details") {
                    PrivacyView()
                }
            }

            Section {
                Text("profile.disclaimer")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
        .scrollContentBackground(.hidden)
        .background(AppTheme.pageBackground.ignoresSafeArea())
        .tint(AppTheme.primaryDeep)
        .navigationTitle("profile.title")
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("common.done") { dismiss() }
            }
        }
        .onAppear {
            if settings.isEmpty {
                modelContext.insert(UserSettings())
            }
        }
        .fileExporter(
            isPresented: $isExporting,
            document: exportDocument,
            contentType: .json,
            defaultFilename: "LunaPlate-backup"
        ) { result in
            if case .failure(let error) = result {
                transferMessage = error.localizedDescription
            }
        }
        .fileImporter(isPresented: $isImporting, allowedContentTypes: [.json]) { result in
            do {
                let url = try result.get()
                let accessing = url.startAccessingSecurityScopedResource()
                defer { if accessing { url.stopAccessingSecurityScopedResource() } }
                let values = try url.resourceValues(forKeys: [.fileSizeKey])
                guard (values.fileSize ?? 0) <= LunaPlateArchive.maximumFileSize else {
                    throw ArchiveError.fileTooLarge
                }
                let data = try Data(contentsOf: url, options: [.mappedIfSafe])
                guard data.count <= LunaPlateArchive.maximumFileSize else { throw ArchiveError.fileTooLarge }
                let archive = try JSONDecoder().decode(LunaPlateArchive.self, from: data)
                try archive.validate()
                pendingImport = archive
            } catch {
                transferMessage = error.localizedDescription
            }
        }
        .confirmationDialog(
            "profile.data.replaceTitle",
            isPresented: Binding(
                get: { pendingImport != nil },
                set: { if !$0 { pendingImport = nil } }
            ),
            titleVisibility: .visible
        ) {
            Button("profile.data.replace", role: .destructive) {
                if let pendingImport { apply(pendingImport) }
                pendingImport = nil
            }
            Button("common.cancel", role: .cancel) { pendingImport = nil }
        } message: {
            Text("profile.data.replaceHelp")
        }
        .confirmationDialog(
            "profile.data.deleteTitle",
            isPresented: $isDeleteConfirmationPresented,
            titleVisibility: .visible
        ) {
            Button("profile.data.deleteConfirm", role: .destructive) { deleteAllData() }
            Button("common.cancel", role: .cancel) {}
        } message: {
            Text("profile.data.deleteHelp")
        }
        .alert("profile.data.messageTitle", isPresented: Binding(
            get: { transferMessage != nil },
            set: { if !$0 { transferMessage = nil } }
        )) {
            Button("common.done", role: .cancel) {}
        } message: {
            Text(transferMessage ?? "")
        }
    }

    private func makeArchive() -> LunaPlateArchive {
        let current = settings.first ?? UserSettings()
        return LunaPlateArchive(
            cycles: cycles.map {
                ArchiveCycle(
                    startDate: ArchiveDate.string($0.startDate),
                    endDate: $0.endDate.map(ArchiveDate.string)
                )
            },
            days: logs.map {
                ArchiveDailyLog(
                    date: ArchiveDate.string($0.date),
                    symptoms: $0.symptoms,
                    flow: $0.flow,
                    mood: $0.mood,
                    painLevel: $0.painLevel,
                    waterMilliliters: $0.waterMilliliters,
                    notes: $0.notes,
                    planChecks: $0.planChecks
                )
            },
            settings: ArchiveSettings(
                averageCycleLength: current.averageCycleLength,
                averagePeriodLength: current.averagePeriodLength,
                manualPhaseOverride: current.manualPhaseOverride,
                localeIdentifier: current.localeIdentifier,
                notificationsEnabled: current.notificationsEnabled,
                reminderHour: current.reminderHour,
                reminderMinute: current.reminderMinute
            ),
            groceries: groceries.map {
                ArchiveGroceryItem(
                    name: $0.name,
                    isCompleted: $0.isCompleted,
                    createdAt: ISO8601DateFormatter().string(from: $0.createdAt)
                )
            }
        )
    }

    private func apply(_ archive: LunaPlateArchive) {
        do {
            cycles.forEach { modelContext.delete($0) }
            logs.forEach { modelContext.delete($0) }
            groceries.forEach { modelContext.delete($0) }
            settings.forEach { modelContext.delete($0) }

            for cycle in archive.cycles {
                guard let start = ArchiveDate.date(cycle.startDate) else { throw ArchiveError.invalidDate }
                modelContext.insert(CycleRecord(startDate: start, endDate: cycle.endDate.flatMap(ArchiveDate.date)))
            }
            for day in archive.days {
                guard let date = ArchiveDate.date(day.date) else { throw ArchiveError.invalidDate }
                modelContext.insert(DailyLog(
                    date: date,
                    symptoms: day.symptoms,
                    flow: day.flow,
                    mood: day.mood,
                    painLevel: day.painLevel,
                    waterMilliliters: day.waterMilliliters,
                    notes: day.notes,
                    planChecks: day.planChecks
                ))
            }
            modelContext.insert(UserSettings(
                averageCycleLength: archive.settings.averageCycleLength,
                averagePeriodLength: archive.settings.averagePeriodLength,
                manualPhaseOverride: CyclePhase.fromStoredValue(archive.settings.manualPhaseOverride),
                localeIdentifier: archive.settings.localeIdentifier,
                notificationsEnabled: archive.settings.notificationsEnabled,
                reminderHour: archive.settings.reminderHour,
                reminderMinute: archive.settings.reminderMinute
            ))
            for item in archive.groceries {
                modelContext.insert(GroceryItem(
                    name: item.name,
                    isCompleted: item.isCompleted,
                    createdAt: ISO8601DateFormatter().date(from: item.createdAt) ?? .now
                ))
            }
            try modelContext.save()
            transferMessage = String(localized: "profile.data.importSuccess")
        } catch {
            modelContext.rollback()
            transferMessage = error.localizedDescription
        }
    }

    private func deleteAllData() {
        do {
            cycles.forEach { modelContext.delete($0) }
            logs.forEach { modelContext.delete($0) }
            groceries.forEach { modelContext.delete($0) }
            settings.forEach { modelContext.delete($0) }
            modelContext.insert(UserSettings())
            try modelContext.save()
            NotificationService.shared.disable()
            transferMessage = String(localized: "profile.data.deleteSuccess")
        } catch {
            modelContext.rollback()
            transferMessage = error.localizedDescription
        }
    }

}

private struct ProfileCycleSettings: View {
    @Bindable var settings: UserSettings

    var body: some View {
        Section("profile.cycle.section") {
            Stepper(value: $settings.averageCycleLength, in: 21...45) {
                LabeledContent("profile.cycle.length", value: "\(settings.averageCycleLength)")
            }
            Stepper(value: $settings.averagePeriodLength, in: 2...10) {
                LabeledContent("profile.period.length", value: "\(settings.averagePeriodLength)")
            }
            Picker("profile.phaseOverride", selection: phaseSelection) {
                Text("profile.phaseAutomatic").tag("automatic")
                ForEach(CyclePhase.allCases, id: \.rawValue) { phase in
                    Text(phase.localizedName).tag(phase.rawValue)
                }
            }
        }
    }

    private var phaseSelection: Binding<String> {
        Binding(
            get: { settings.manualPhaseOverride ?? "automatic" },
            set: { settings.manualPhaseOverride = $0 == "automatic" ? nil : $0 }
        )
    }
}

private struct NotificationSettingsView: View {
    @Bindable var settings: UserSettings
    let cycles: [CycleRecord]
    @State private var permissionDenied = false

    var body: some View {
        Section("profile.notifications.section") {
            Toggle("profile.notifications.enable", isOn: Binding(
                get: { settings.notificationsEnabled },
                set: configure
            ))

            if settings.notificationsEnabled {
                DatePicker(
                    "profile.notifications.time",
                    selection: reminderTime,
                    displayedComponents: .hourAndMinute
                )
            }

            Text("profile.notifications.help")
                .font(.footnote)
                .foregroundStyle(.secondary)
        }
        .alert("profile.notifications.deniedTitle", isPresented: $permissionDenied) {
            Button("common.done", role: .cancel) {}
        } message: {
            Text("profile.notifications.deniedBody")
        }
    }

    private func configure(_ enabled: Bool) {
        if !enabled {
            settings.notificationsEnabled = false
            NotificationService.shared.disable()
            return
        }
        Task {
            let granted = await NotificationService.shared.enableAndSchedule(settings: settings, cycles: cycles)
            settings.notificationsEnabled = granted
            permissionDenied = !granted
        }
    }

    private var reminderTime: Binding<Date> {
        Binding(
            get: {
                Calendar.current.date(
                    bySettingHour: settings.reminderHour,
                    minute: settings.reminderMinute,
                    second: 0,
                    of: .now
                ) ?? .now
            },
            set: { date in
                let components = Calendar.current.dateComponents([.hour, .minute], from: date)
                settings.reminderHour = components.hour ?? 20
                settings.reminderMinute = components.minute ?? 0
                Task {
                    await NotificationService.shared.rescheduleIfEnabled(settings: settings, cycles: cycles)
                }
            }
        )
    }
}
