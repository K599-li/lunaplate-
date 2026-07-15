import SwiftData
import SwiftUI

struct RootTabView: View {
    @Environment(\.scenePhase) private var scenePhase
    @Query private var settings: [UserSettings]
    @Query private var cycles: [CycleRecord]
    @State private var isProfilePresented = false
    @State private var selectedTab: AppTab = .today

    var body: some View {
        TabView(selection: $selectedTab) {
            navigationTab(tab: .today, showsProfileButton: false) {
                TodayView(onProfileTap: { isProfilePresented = true })
            }

            navigationTab(tab: .insights) {
                InsightsView()
            }

            navigationTab(tab: .food) {
                FoodView()
            }

            navigationTab(tab: .movement) {
                MovementView()
            }
        }
        .toolbar(.hidden, for: .tabBar)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            LunaTabBar(selection: $selectedTab)
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 6)
                .background(.clear)
        }
        .tint(AppTheme.primaryDeep)
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
        tab: AppTab,
        showsProfileButton: Bool = true,
        @ViewBuilder content: () -> Content
    ) -> some View {
        NavigationStack {
            content()
                .toolbar {
                    if showsProfileButton {
                        ToolbarItem(placement: .topBarLeading) {
                            Button {
                                isProfilePresented = true
                            } label: {
                                Label("profile.open", systemImage: "person.crop.circle")
                            }
                        }
                    }
                }
        }
        .tag(tab)
        .tabItem {
            Label(tab.title, systemImage: tab.systemImage)
        }
    }
}

private enum AppTab: String, CaseIterable, Hashable {
    case today
    case insights
    case food
    case movement

    var title: LocalizedStringKey {
        switch self {
        case .today: "nav.today"
        case .insights: "nav.insights"
        case .food: "nav.food"
        case .movement: "nav.movement"
        }
    }

    var systemImage: String {
        switch self {
        case .today: "house"
        case .insights: "chart.xyaxis.line"
        case .food: "fork.knife"
        case .movement: "figure.mind.and.body"
        }
    }

    var selectedSystemImage: String {
        switch self {
        case .today: "house.fill"
        case .insights: "chart.xyaxis.line"
        case .food: "fork.knife"
        case .movement: "figure.mind.and.body"
        }
    }
}

private struct LunaTabBar: View {
    @Binding var selection: AppTab
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        HStack(spacing: 4) {
            ForEach(AppTab.allCases, id: \.self) { tab in
                Button {
                    if reduceMotion {
                        selection = tab
                    } else {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            selection = tab
                        }
                    }
                } label: {
                    VStack(spacing: 5) {
                        Image(systemName: selection == tab ? tab.selectedSystemImage : tab.systemImage)
                            .font(.system(size: AppTheme.iconSize, weight: selection == tab ? .semibold : .regular))
                            .frame(width: 44, height: 32)
                            .background {
                                if selection == tab {
                                    Capsule()
                                        .fill(AppTheme.primarySoft)
                                        .matchedGeometryEffect(id: "selectedTab", in: tabNamespace)
                                }
                            }
                        Text(tab.title)
                            .font(.caption2.weight(selection == tab ? .bold : .semibold))
                            .lineLimit(1)
                            .minimumScaleFactor(0.78)
                    }
                    .foregroundStyle(selection == tab ? AppTheme.primaryDeep : AppTheme.muted)
                    .frame(maxWidth: .infinity, minHeight: 58)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(selection == tab ? .isSelected : [])
            }
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 7)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .background(AppTheme.surface.opacity(0.82), in: RoundedRectangle(cornerRadius: 28, style: .continuous))
        .overlay {
            RoundedRectangle(cornerRadius: 28, style: .continuous)
                .stroke(AppTheme.line.opacity(0.9), lineWidth: 1)
        }
        .shadow(color: AppTheme.ink.opacity(0.14), radius: 24, y: 12)
        .sensoryFeedback(.selection, trigger: selection)
    }

    @Namespace private var tabNamespace
}

#Preview {
    RootTabView()
        .modelContainer(for: [CycleRecord.self, DailyLog.self, UserSettings.self, GroceryItem.self], inMemory: true)
}
