import SwiftData
import SwiftUI

struct GroceryListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \GroceryItem.createdAt) private var items: [GroceryItem]
    @State private var newItem = ""

    var body: some View {
        List {
            Section {
                HStack {
                    TextField("grocery.new.placeholder", text: $newItem)
                        .textInputAutocapitalization(.sentences)
                        .submitLabel(.done)
                        .onSubmit(addItem)
                        .accessibilityIdentifier("grocery.newItem")
                    Button(action: addItem) {
                        Image(systemName: "plus.circle.fill")
                            .font(.title3)
                    }
                    .disabled(trimmedNewItem.isEmpty)
                    .accessibilityLabel("grocery.add")
                    .accessibilityIdentifier("grocery.add")
                }
            }

            if items.isEmpty {
                ContentUnavailableView(
                    "grocery.empty.title",
                    systemImage: "basket",
                    description: Text("grocery.empty.body")
                )
                .listRowBackground(Color.clear)
            } else {
                Section("grocery.items") {
                    ForEach(items) { item in
                        GroceryRow(item: item)
                            .swipeActions {
                                Button("common.delete", role: .destructive) {
                                    modelContext.delete(item)
                                }
                            }
                    }
                }
            }
        }
        .navigationTitle("grocery.title")
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("grocery.clearCompleted") { clearCompleted() }
                    .disabled(!items.contains(where: \.isCompleted))
            }
        }
    }

    private var trimmedNewItem: String {
        newItem.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    private func addItem() {
        let value = trimmedNewItem
        guard !value.isEmpty else { return }
        let exists = items.contains { $0.name.caseInsensitiveCompare(value) == .orderedSame }
        if !exists {
            modelContext.insert(GroceryItem(name: value))
        }
        newItem = ""
    }

    private func clearCompleted() {
        items.filter(\.isCompleted).forEach(modelContext.delete)
    }
}

private struct GroceryRow: View {
    @Bindable var item: GroceryItem

    var body: some View {
        Button {
            item.isCompleted.toggle()
        } label: {
            HStack(spacing: 12) {
                Image(systemName: item.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundStyle(item.isCompleted ? AppTheme.sage : .secondary)
                Text(item.name)
                    .strikethrough(item.isCompleted)
                    .foregroundStyle(item.isCompleted ? .secondary : .primary)
                Spacer()
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(item.name)
        .accessibilityValue(item.isCompleted ? String(localized: "grocery.completed") : String(localized: "grocery.notCompleted"))
    }
}
