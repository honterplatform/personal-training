import Foundation
import Observation

@Observable
final class AppStore {
    var booted: Bool = false
    var authed: Bool = false
    var settings: AppSettings = AppSettings()
    var weekEntries: [Entry] = []
    var selectedDate: String = BogotaDate.todayISO()
    var lastError: String? = nil

    func boot() async {
        do {
            settings = try await APIClient.shared.getSettings()
            try await refreshWeek()
            authed = true
        } catch APIError.unauthorized {
            authed = false
        } catch {
            lastError = error.localizedDescription
        }
        booted = true
    }

    func refreshWeek() async throws {
        let (start, end) = BogotaDate.weekRange(selectedDate)
        weekEntries = try await APIClient.shared.getEntries(start: start, end: end)
    }

    func login(password: String) async throws {
        try await APIClient.shared.login(password: password)
        await boot()
    }

    func selectDate(_ iso: String) async {
        selectedDate = iso
        do { try await refreshWeek() }
        catch APIError.unauthorized { authed = false }
        catch { lastError = error.localizedDescription }
    }

    func saveEntry(date: String, activity: String, patch: APIClient.EntryPatch) async {
        do {
            _ = try await APIClient.shared.saveEntry(date: date, activity: activity, patch: patch)
            try await refreshWeek()
        } catch APIError.unauthorized {
            authed = false
        } catch {
            lastError = error.localizedDescription
        }
    }

    func deleteEntry(date: String, activity: String) async {
        do {
            try await APIClient.shared.deleteEntry(date: date, activity: activity)
            try await refreshWeek()
        } catch APIError.unauthorized {
            authed = false
        } catch {
            lastError = error.localizedDescription
        }
    }

    func saveSettings(_ s: AppSettings) async {
        do {
            settings = try await APIClient.shared.saveSettings(s)
        } catch APIError.unauthorized {
            authed = false
        } catch {
            lastError = error.localizedDescription
        }
    }

    func entriesForSelectedDate() -> [Entry] {
        weekEntries.filter { $0.date == selectedDate }
    }

    func dayKcal() -> Int {
        entriesForSelectedDate().reduce(0) { $0 + ($1.caloriesBurned ?? 0) }
    }
}
