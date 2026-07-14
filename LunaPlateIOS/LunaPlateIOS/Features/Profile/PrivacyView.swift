import SwiftUI

struct PrivacyView: View {
    var body: some View {
        List {
            Section("privacy.local.title") {
                Text("privacy.local.body")
            }
            Section("privacy.network.title") {
                Text("privacy.network.body")
            }
            Section("privacy.notUsed.title") {
                Text("privacy.notUsed.body")
            }
            Section("privacy.controls.title") {
                Text("privacy.controls.body")
            }
            Section("privacy.medical.title") {
                Text("profile.disclaimer")
            }
        }
        .navigationTitle("privacy.title")
    }
}
