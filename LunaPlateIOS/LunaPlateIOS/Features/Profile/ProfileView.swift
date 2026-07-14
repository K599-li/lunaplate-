import SwiftData
import SwiftUI

struct ProfileView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var settings: [UserSettings]

    var body: some View {
        Form {
            Section("profile.cycle.section") {
                LabeledContent("profile.cycle.length", value: "\(currentSettings.averageCycleLength)")
                LabeledContent("profile.period.length", value: "\(currentSettings.averagePeriodLength)")
            }

            Section("profile.language.section") {
                Text("profile.language.help")
                    .foregroundStyle(.secondary)
            }

            Section("profile.privacy.section") {
                Label("profile.privacy.local", systemImage: "lock.shield")
                Text("profile.privacy.body")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }

            Section {
                Text("profile.disclaimer")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
            }
        }
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
    }

    private var currentSettings: UserSettings {
        settings.first ?? UserSettings()
    }
}
