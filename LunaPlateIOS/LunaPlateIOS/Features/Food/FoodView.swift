import SwiftUI
import SwiftData

@MainActor
final class FoodViewModel: ObservableObject {
    @Published private(set) var meals: [Meal] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?
    @Published private(set) var isUsingOfflineContent = false

    func load(phase: CyclePhase, symptoms: [String]) async {
        isLoading = true
        errorMessage = nil
        isUsingOfflineContent = false
        defer { isLoading = false }
        do {
            meals = try await APIClient.shared.meals(phase: phase, symptoms: symptoms)
        } catch {
            meals = OfflineContent.meals(phase: phase, symptoms: symptoms)
            isUsingOfflineContent = true
        }
    }
}

struct FoodView: View {
    @StateObject private var viewModel = FoodViewModel()
    @Query(sort: \CycleRecord.startDate, order: .reverse) private var cycles: [CycleRecord]
    @Query private var settings: [UserSettings]
    @Query private var logs: [DailyLog]
    @Query private var groceries: [GroceryItem]

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                Text("food.title")
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .foregroundStyle(AppTheme.plumText)

                if viewModel.isLoading {
                    ProgressView().frame(maxWidth: .infinity, minHeight: 180)
                } else if let error = viewModel.errorMessage {
                    ContentUnavailableView("food.error", systemImage: "wifi.exclamationmark", description: Text(error))
                } else {
                    if viewModel.isUsingOfflineContent {
                        offlineNotice
                    }
                    ForEach(viewModel.meals) { meal in
                        mealRow(meal)
                    }
                }
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.food")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                NavigationLink {
                    GroceryListView()
                } label: {
                    Label {
                        Text("grocery.title")
                    } icon: {
                        Image(systemName: groceries.contains(where: { !$0.isCompleted }) ? "basket.fill" : "basket")
                    }
                }
                .accessibilityIdentifier("food.groceryList")
            }
        }
        .task(id: requestKey) { await viewModel.load(phase: activePhase, symptoms: todaySymptoms) }
        .refreshable { await viewModel.load(phase: activePhase, symptoms: todaySymptoms) }
    }

    private var offlineNotice: some View {
        Label("content.offline.notice", systemImage: "wifi.slash")
            .font(.caption)
            .foregroundStyle(AppTheme.sage)
            .padding(.horizontal, 12)
            .padding(.vertical, 9)
            .background(AppTheme.sage.opacity(0.10), in: Capsule())
            .accessibilityIdentifier("food.offlineNotice")
    }

    private func mealRow(_ meal: Meal) -> some View {
        NavigationLink {
            MealDetailView(meal: meal)
        } label: {
            HStack(spacing: 14) {
                MealArtwork(meal: meal, size: 104)
                VStack(alignment: .leading, spacing: 7) {
                    Text(meal.name).font(.headline).lineLimit(2)
                    Text(meal.tags.prefix(3).joined(separator: " · "))
                        .font(.caption)
                        .foregroundStyle(AppTheme.sage)
                        .lineLimit(2)
                    Text("\(meal.time) min")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.caption.bold())
                    .foregroundStyle(.tertiary)
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .lunaCard()
        .accessibilityIdentifier("food.meal.\(meal.id)")
    }

    private var activePhase: CyclePhase {
        let currentSettings = settings.first ?? UserSettings()
        return CycleCalculator.snapshot(records: cycles, settings: currentSettings)?.phase ?? .luteal
    }

    private var todaySymptoms: [String] {
        logs.first { Calendar.current.isDateInToday($0.date) }?.symptoms ?? []
    }

    private var requestKey: String {
        "\(activePhase.rawValue)|\(todaySymptoms.sorted().joined(separator: ","))"
    }
}

struct MealDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Query private var groceries: [GroceryItem]
    @State private var isAddedAlertPresented = false
    let meal: Meal

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 22) {
                MealArtwork(meal: meal, size: 220)
                    .frame(maxWidth: .infinity)

                VStack(alignment: .leading, spacing: 9) {
                    Text(meal.name)
                        .font(.system(.largeTitle, design: .rounded, weight: .bold))
                        .foregroundStyle(AppTheme.plumText)
                    Label("\(meal.time) min", systemImage: "clock")
                        .foregroundStyle(.secondary)
                    if let calories = meal.calories {
                        Text("\(calories) kcal")
                            .font(.subheadline.bold())
                            .foregroundStyle(AppTheme.sage)
                    }
                    if let macros = meal.macros {
                        Text(String(format: String(localized: "meal.macros.format"), macros.protein, macros.carbs, macros.fat))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                detailSection(title: "meal.ingredients", values: meal.ingredients, numbered: false)
                Button {
                    addIngredientsToGroceryList()
                } label: {
                    Label("meal.addToGrocery", systemImage: "basket.badge.plus")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .disabled(missingIngredients.isEmpty)
                .accessibilityIdentifier("meal.addToGrocery")
                detailSection(title: "meal.steps", values: meal.steps, numbered: true)
                Text("meal.nutrition.notice")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("meal.details")
        .navigationBarTitleDisplayMode(.inline)
        .alert("meal.grocery.added", isPresented: $isAddedAlertPresented) {
            Button("common.done", role: .cancel) {}
        }
    }

    private func detailSection(title: LocalizedStringKey, values: [String], numbered: Bool) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.title3.bold())
                .foregroundStyle(AppTheme.berry)
            ForEach(Array(values.enumerated()), id: \.offset) { index, value in
                HStack(alignment: .top, spacing: 10) {
                    Text(numbered ? "\(index + 1)" : "•")
                        .font(.subheadline.bold())
                        .foregroundStyle(AppTheme.sage)
                        .frame(width: 24)
                    Text(value).frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .lunaCard()
    }

    private var missingIngredients: [String] {
        let existing = Set(groceries.map { $0.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() })
        return meal.ingredients.filter {
            !existing.contains($0.trimmingCharacters(in: .whitespacesAndNewlines).lowercased())
        }
    }

    private func addIngredientsToGroceryList() {
        let additions = missingIngredients
        guard !additions.isEmpty else { return }
        additions.forEach { modelContext.insert(GroceryItem(name: $0)) }
        try? modelContext.save()
        isAddedAlertPresented = true
    }
}

struct MealArtwork: View {
    let meal: Meal
    let size: CGFloat

    var body: some View {
        Group {
            if let image = meal.image {
                AsyncImage(url: image) { loaded in
                    loaded.resizable().scaledToFill()
                } placeholder: {
                    placeholder
                }
            } else {
                placeholder
            }
        }
        .frame(width: size, height: size)
        .clipShape(RoundedRectangle(cornerRadius: min(size * 0.16, 22)))
    }

    private var placeholder: some View {
        AppTheme.oat.opacity(0.35)
            .overlay {
                Image(systemName: "fork.knife")
                    .font(.system(size: size * 0.30, weight: .light))
                    .foregroundStyle(AppTheme.berry.opacity(0.75))
            }
    }
}
