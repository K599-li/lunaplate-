import SwiftUI

@MainActor
final class MovementViewModel: ObservableObject {
    @Published private(set) var exercises: [Exercise] = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    func load() async {
        isLoading = true
        errorMessage = nil
        defer { isLoading = false }
        do {
            exercises = try await APIClient.shared.exercises(phase: .luteal, symptoms: [])
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

struct MovementView: View {
    @StateObject private var viewModel = MovementViewModel()

    var body: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: 18) {
                Text("movement.title")
                    .font(.system(.largeTitle, design: .rounded, weight: .bold))
                    .foregroundStyle(AppTheme.plumText)

                if viewModel.isLoading {
                    ProgressView().frame(maxWidth: .infinity, minHeight: 180)
                } else if let error = viewModel.errorMessage {
                    ContentUnavailableView("movement.error", systemImage: "figure.walk.motion", description: Text(error))
                } else {
                    ForEach(viewModel.exercises) { exercise in
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text(exercise.name).font(.headline)
                                Spacer()
                                Label("\(exercise.duration) min", systemImage: "clock")
                                    .font(.caption)
                                    .foregroundStyle(AppTheme.berry)
                            }
                            Text(exercise.summary).foregroundStyle(.secondary)
                            Divider()
                            Label(exercise.safety, systemImage: "shield.checkered")
                                .font(.caption)
                                .foregroundStyle(AppTheme.sage)
                        }
                        .lunaCard()
                    }
                }
            }
            .padding(.horizontal, AppTheme.pagePadding)
            .padding(.bottom, 28)
        }
        .background(AppTheme.ivory.ignoresSafeArea())
        .navigationTitle("nav.movement")
        .navigationBarTitleDisplayMode(.inline)
        .task { await viewModel.load() }
        .refreshable { await viewModel.load() }
    }
}
