import SwiftData
import SwiftUI

@main
struct LunaPlateApp: App {
    var body: some Scene {
        WindowGroup {
            RootTabView()
                .tint(AppTheme.berry)
        }
        .modelContainer(for: [
            CycleRecord.self,
            DailyLog.self,
            UserSettings.self,
            GroceryItem.self
        ])
    }
}
