import SwiftUI

@main
struct LOGApp: App {
    @State private var store = AppStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(store)
                .task { await store.boot() }
                .preferredColorScheme(.light)
        }
    }
}

struct RootView: View {
    @Environment(AppStore.self) private var store

    var body: some View {
        Group {
            if !store.booted {
                ZStack {
                    Theme.cream.ignoresSafeArea()
                    ProgressView()
                        .tint(Theme.accent)
                }
            } else if !store.authed {
                LoginView()
            } else {
                HomeView()
            }
        }
        .animation(.easeInOut(duration: 0.2), value: store.authed)
        .animation(.easeInOut(duration: 0.2), value: store.booted)
    }
}
