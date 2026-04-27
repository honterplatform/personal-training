import Foundation

enum BogotaDate {
    static let tz = TimeZone(identifier: "America/Bogota")!

    private static let isoFormatter: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = tz
        f.dateFormat = "yyyy-MM-dd"
        return f
    }()

    static func todayISO() -> String {
        isoFormatter.string(from: Date())
    }

    static func iso(_ date: Date) -> String {
        isoFormatter.string(from: date)
    }

    static func date(fromISO iso: String) -> Date {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = tz
        let parts = iso.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return Date() }
        var dc = DateComponents()
        dc.year = parts[0]; dc.month = parts[1]; dc.day = parts[2]; dc.hour = 12
        return c.date(from: dc) ?? Date()
    }

    static func weekStartISO(_ iso: String) -> String {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = tz
        c.firstWeekday = 2 // Monday
        let d = date(fromISO: iso)
        let weekday = c.component(.weekday, from: d) // 1 = Sun, 2 = Mon
        let offset = (weekday + 5) % 7 // Monday=0
        let mon = c.date(byAdding: .day, value: -offset, to: d) ?? d
        return self.iso(mon)
    }

    static func weekDays(_ iso: String) -> [String] {
        var c = Calendar(identifier: .gregorian)
        c.timeZone = tz
        let start = date(fromISO: weekStartISO(iso))
        return (0..<7).map { i in
            let d = c.date(byAdding: .day, value: i, to: start) ?? start
            return self.iso(d)
        }
    }

    static func weekRange(_ iso: String) -> (start: String, end: String) {
        let days = weekDays(iso)
        return (days.first!, days.last!)
    }

    static func weekday(_ iso: String, full: Bool = true) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = tz
        f.dateFormat = full ? "EEEE" : "EEE"
        return f.string(from: date(fromISO: iso))
    }

    static func dayOfMonth(_ iso: String) -> Int {
        Int(iso.suffix(2)) ?? 0
    }

    static func displayMonthYear(_ iso: String) -> String {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX")
        f.timeZone = tz
        f.dateFormat = "LLLL yyyy"
        return f.string(from: date(fromISO: iso))
    }
}
