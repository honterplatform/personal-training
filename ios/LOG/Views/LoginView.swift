import SwiftUI

struct LoginView: View {
    @Environment(AppStore.self) private var store
    @State private var password: String = ""
    @State private var loading: Bool = false
    @State private var error: Bool = false
    @State private var shake: CGFloat = 0
    @FocusState private var fieldFocused: Bool

    var body: some View {
        ZStack {
            Theme.inkDark.ignoresSafeArea()
            // accent glow
            Circle()
                .fill(
                    RadialGradient(
                        gradient: Gradient(colors: [Theme.accent.opacity(0.27), .clear]),
                        center: .center, startRadius: 0, endRadius: 220)
                )
                .frame(width: 360, height: 360)
                .offset(x: -120, y: -260)
                .allowsHitTesting(false)

            VStack(spacing: 0) {
                Spacer()
                Text("LOG")
                    .font(AppFont.serif(96))
                    .foregroundStyle(Theme.cream)
                    .tracking(-3)
                Text("training daily")
                    .font(AppFont.mono(12))
                    .tracking(2)
                    .foregroundStyle(Theme.cream50)
                    .padding(.top, 10)

                VStack(spacing: 12) {
                    HStack(spacing: 12) {
                        Image(systemName: "lock")
                            .foregroundStyle(Theme.cream50)
                        SecureField("password", text: $password)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled(true)
                            .foregroundStyle(Theme.cream)
                            .font(AppFont.sans(16))
                            .focused($fieldFocused)
                            .onSubmit { Task { await submit() } }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                    .background(Theme.cream08)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(error ? Theme.accent : Theme.cream08.opacity(2.0), lineWidth: 1)
                    )
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .offset(x: shake)

                    Button {
                        Task { await submit() }
                    } label: {
                        Text(loading ? "…" : "enter")
                            .font(AppFont.sans(14, weight: .semibold))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 14)
                            .background(Theme.accent)
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                    }
                    .disabled(loading || password.isEmpty)
                }
                .padding(.top, 56)
                .padding(.horizontal, 32)
                .frame(maxWidth: 360)

                Spacer()
                Text("one user · gated · bogotá")
                    .font(AppFont.mono(10))
                    .tracking(1.5)
                    .foregroundStyle(Theme.cream35)
                    .padding(.bottom, 40)
            }
        }
        .onAppear { fieldFocused = true }
    }

    private func submit() async {
        guard !loading, !password.isEmpty else { return }
        loading = true
        error = false
        do {
            try await store.login(password: password)
        } catch {
            self.error = true
            withAnimation(.default) { shake = -8 }
            try? await Task.sleep(nanoseconds: 80_000_000)
            withAnimation(.default) { shake = 8 }
            try? await Task.sleep(nanoseconds: 80_000_000)
            withAnimation(.default) { shake = -6 }
            try? await Task.sleep(nanoseconds: 60_000_000)
            withAnimation(.default) { shake = 0 }
        }
        loading = false
    }
}
