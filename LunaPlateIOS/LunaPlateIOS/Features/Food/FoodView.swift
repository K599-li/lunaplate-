import SwiftUI

@MainActor
final class FoodViewModel: ObservableObject {
    @Published private(set) var meals: [Meal] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            meals = try await APIClient.shared.meals(phase: .luteal, symptoms: [])
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct FoodView: View {
    @StateObject private var viewModel = FoodViewModel()

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
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }

    private func mealRow(_ meal: Meal) -> some View {
        HStack(spacing: 14) {
            AsyncImage(url: meal.image) { image in
                image.resizable().scaledToFill()
            } placeholder: {
                AppTheme.oat.opacity(0.35)
            }
            .frame(width: 104, height: 104)
            .clipShape(RoundedRectangle(cornerRadius: 16))

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
        }
        .lunaCard()
    }
}
