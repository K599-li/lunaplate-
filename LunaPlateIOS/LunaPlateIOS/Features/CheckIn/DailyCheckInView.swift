import SwiftData
import SwiftUI

struct DailyCheckInView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var logs: [DailyLog]

    let date: Date
    @State private var selectedSymptoms: Set<String> = []
    @State private var flow = "none"
    @State private var mood = "ok"
    @State private var painLevel = 0
    @State private var waterMilliliters = 0
    @State private var notes = ""
    @State private var hasLoaded = false
    @State private var saveError: String?

    private let symptoms = SymptomCatalog.all
    private let flows = ["none", "spotting", "light", "medium", "heavy"]
    private let moods = ["great", "ok", "low", "irritable", "anxious"]

    var body: some View {
        Form {
            Section {
                LabeledContent("checkin.date", value: date.formatted(date: .long, time: .omitted))
            }

            Section("checkin.symptoms") {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 130), spacing: 10)], spacing: 10) {
                    ForEach(symptoms, id: \.self) { symptom in
                        Button {
                            if selectedSymptoms.contains(symptom) {
                                selectedSymptoms.remove(symptom)
                            } else {
                                selectedSymptoms.insert(symptom)
                            }
                        } label: {
                            Label(SymptomCatalog.localizedName(symptom), systemImage: selectedSymptoms.contains(symptom) ? "checkmark.circle.fill" : "circle")
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .buttonStyle(.bordered)
                        .tint(selectedSymptoms.contains(symptom) ? AppTheme.berry : .secondary)
                    }
                }
                .padding(.vertical, 4)
            }

            Section("checkin.flow") {
                Picker("checkin.flow", selection: $flow) {
                    ForEach(flows, id: \.self) { value in
                        Text(flowName(value)).tag(value)
                    }
                }
                .pickerStyle(.menu)
            }

            Section("checkin.mood") {
                Picker("checkin.mood", selection: $mood) {
                    ForEach(moods, id: \.self) { value in
                        Text(moodName(value)).tag(value)
                    }
                }
                .pickerStyle(.menu)
            }

            Section("checkin.pain") {
                Stepper(value: $painLevel, in: 0...10) {
                    HStack {
                        Text("checkin.painLevel")
                        Spacer()
                        Text(painLevel, format: .number)
                            .font(.headline)
                            .foregroundStyle(painLevel >= 8 ? Color.red : AppTheme.berry)
                    }
                }
                Text("checkin.pain.help")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Section("checkin.hydration") {
                Stepper(value: $waterMilliliters, in: 0...5000, step: 250) {
                    Text("\(waterMilliliters) ml")
                }
            }

            Section("checkin.notes") {
                TextField("checkin.notes.placeholder", text: $notes, axis: .vertical)
                    .lineLimit(3...7)
            }
        }
        .navigationTitle("checkin.title")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("common.cancel") { dismiss() }
            }
            ToolbarItem(placement: .confirmationAction) {
                Button("common.save") { save() }
            }
        }
        .onAppear { loadExistingLogOnce() }
        .alert("common.couldNotSave", isPresented: Binding(
            get: { saveError != nil },
            set: { if !$0 { saveError = nil } }
        )) {
            Button("common.done", role: .cancel) {}
        } message: {
            Text(saveError ?? "")
        }
    }

    private var existingLog: DailyLog? {
        let key = DailyLog.dateKey(for: date)
        return logs.first { $0.dateKey == key }
    }

    private func loadExistingLogOnce() {
        guard !hasLoaded else { return }
        hasLoaded = true
        guard let log = existingLog else { return }
        selectedSymptoms = Set(log.symptoms)
        flow = log.flow
        mood = log.mood
        painLevel = log.painLevel
        waterMilliliters = log.waterMilliliters
        notes = log.notes
    }

    private func save() {
        if let log = existingLog {
            log.symptoms = selectedSymptoms.sorted()
            log.flow = flow
            log.mood = mood
            log.painLevel = painLevel
            log.waterMilliliters = waterMilliliters
            log.notes = notes.trimmingCharacters(in: .whitespacesAndNewlines)
        } else {
            modelContext.insert(DailyLog(
                date: Calendar.current.startOfDay(for: date),
                symptoms: selectedSymptoms.sorted(),
                flow: flow,
                mood: mood,
                painLevel: painLevel,
                waterMilliliters: waterMilliliters,
                notes: notes.trimmingCharacters(in: .whitespacesAndNewlines)
            ))
        }
        do {
            try modelContext.save()
            dismiss()
        } catch {
            saveError = error.localizedDescription
        }
    }

    private func flowName(_ value: String) -> String {
        switch value {
        case "none": String(localized: "flow.none")
        case "spotting": String(localized: "flow.spotting")
        case "light": String(localized: "flow.light")
        case "medium": String(localized: "flow.medium")
        case "heavy": String(localized: "flow.heavy")
        default: value
        }
    }

    private func moodName(_ value: String) -> String {
        switch value {
        case "great": String(localized: "mood.great")
        case "ok": String(localized: "mood.ok")
        case "low": String(localized: "mood.low")
        case "irritable": String(localized: "mood.irritable")
        case "anxious": String(localized: "mood.anxious")
        default: value
        }
    }
}
