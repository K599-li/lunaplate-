import SwiftUI
import SwiftData

struct RootTabView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Query private var settings: [UserSettings]
    @Query private var cycles: [CycleRecord]
    @State private var isProfilePresented = false

    var body: some View {
        TabView {
            navigationTab(title: "nav.today", systemImage: "sun.max") {
                TodayView()
            }

            navigationTab(title: "nav.insights", systemImage: "chart.xyaxis.line") {
                InsightsView()
            }

            navigationTab(title: "nav.food", systemImage: "fork.knife") {
                FoodView()
            }

            navigationTab(title: "nav.movement", systemImage: "figure.mind.and.body") {
                MovementView()
            }
        }
        .sheet(isPresented: $isProfilePresented) {
            NavigationStack {
                ProfileView()
            }
        }
        .task {
            await NotificationService.shared.rescheduleIfEnabled(settings: settings.first, cycles: cycles)
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task {
                await NotificationService.shared.rescheduleIfEnabled(settings: settings.first, cycles: cycles)
            }
        }
    }

    private func navigationTab<Content: View>(
        title: LocalizedStringKey,
        systemImage: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        NavigationStack {
            content()
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            isProfilePresented = true
                        } label: {
                            Label("profile.open", systemImage: "person.crop.circle")
                        }
                    }
                }
        }
        .tabItem {
            Label(title, systemImage: systemImage)
        }
    }
}

#Preview {
    RootTabView()
        .modelContainer(for: [CycleRecord.self, DailyLog.self, UserSettings.self, GroceryItem.self], inMemory: true)
}
