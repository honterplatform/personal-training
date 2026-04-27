import SwiftUI

struct HomeView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        VStack(spacing: 0) {
            Text("LOG")
                .font(AppFont.serif(48))
                .foregroundStyle(Theme.accent)
                .padding(.top, 40)
            Text("welcome — UI building blocks coming next")
                .font(AppFont.mono(11))
                .tracking(1)
                .foregroundStyle(Theme.mutedInk)
                .textCase(.uppercase)
                .padding(.top, 12)

            Spacer()

            VStack(alignment: .leading, spacing: 8) {
                Text("settings")
                    .font(AppFont.mono(10))
                    .foregroundStyle(Theme.mutedInk)
                Text("body weight: \(format(store.settings.bodyWeightKg)) kg")
                Text("protein goal: \(format(store.settings.proteinGoalG)) g")
                Text("entries this week: \(store.weekEntries.count)")
            }
            .font(AppFont.sans(14))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .background(Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: 22))
            .padding(.horizontal, 16)

            Spacer()
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Theme.cream.ignoresSafeArea())
    }

    private func format(_ d: Double?) -> String {
        guard let d else { return "—" }
        if d.truncatingRemainder(dividingBy: 1) == 0 { return String(Int(d)) }
        return String(format: "%.1f", d)
    }
}
