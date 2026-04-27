import Foundation

enum APIError: Error, LocalizedError {
    case unauthorized
    case server(String)
    case decoding(String)
    case transport(Error)

    var errorDescription: String? {
        switch self {
        case .unauthorized:        return "unauthorized"
        case .server(let m):       return m
        case .decoding(let m):     return "decode: \(m)"
        case .transport(let e):    return e.localizedDescription
        }
    }
}

final class APIClient {
    static let shared = APIClient()

    /// Override at runtime by setting UserDefaults key "apiBaseURL" if needed.
    let baseURL: URL = {
        if let stored = UserDefaults.standard.string(forKey: "apiBaseURL"),
           let u = URL(string: stored) {
            return u
        }
        return URL(string: "https://personal-training-production.up.railway.app")!
    }()

    private let session: URLSession

    private init() {
        let cfg = URLSessionConfiguration.default
        cfg.httpCookieStorage = .shared
        cfg.httpCookieAcceptPolicy = .always
        cfg.httpShouldSetCookies = true
        cfg.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(configuration: cfg)
    }

    private lazy var encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .useDefaultKeys
        return e
    }()

    private lazy var decoder: JSONDecoder = {
        let d = JSONDecoder()
        let iso = ISO8601DateFormatter()
        iso.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        d.dateDecodingStrategy = .custom { decoder in
            let c = try decoder.singleValueContainer()
            let s = try c.decode(String.self)
            if let d = iso.date(from: s) { return d }
            let iso2 = ISO8601DateFormatter()
            iso2.formatOptions = [.withInternetDateTime]
            if let d = iso2.date(from: s) { return d }
            throw DecodingError.dataCorruptedError(in: c, debugDescription: "bad date \(s)")
        }
        return d
    }()

    private func request<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: Encodable? = nil
    ) async throws -> T {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            req.httpBody = try encoder.encode(AnyEncodable(body))
        }
        let (data, resp): (Data, URLResponse)
        do {
            (data, resp) = try await session.data(for: req)
        } catch {
            throw APIError.transport(error)
        }
        guard let http = resp as? HTTPURLResponse else {
            throw APIError.server("no http response")
        }
        if http.statusCode == 401 { throw APIError.unauthorized }
        guard (200..<300).contains(http.statusCode) else {
            let body = String(data: data, encoding: .utf8) ?? ""
            throw APIError.server("HTTP \(http.statusCode): \(body)")
        }
        if T.self == EmptyResponse.self {
            return EmptyResponse() as! T
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decoding("\(error)")
        }
    }

    // MARK: Auth

    func login(password: String) async throws {
        struct Body: Encodable { let password: String }
        let _: AuthResp = try await request("/api/auth", method: "POST", body: Body(password: password))
    }

    struct AuthResp: Decodable { let ok: Bool }

    // MARK: Settings

    func getSettings() async throws -> AppSettings {
        try await request("/api/settings")
    }

    func saveSettings(_ s: AppSettings) async throws -> AppSettings {
        try await request("/api/settings", method: "PUT", body: s)
    }

    // MARK: Entries

    func getEntries(start: String, end: String) async throws -> [Entry] {
        try await request("/api/entries?start=\(start)&end=\(end)")
    }

    struct EntryPatch: Encodable {
        var done: Bool?
        var distanceKm: Double?
        var durationMin: Double?
        var rpe: Int?
        var proteinG: Double?
        var notes: String?

        func encode(to encoder: Encoder) throws {
            var c = encoder.container(keyedBy: AnyKey.self)
            if let v = done        { try c.encode(v,  forKey: .init("done")) }
            if let v = distanceKm  { try c.encode(v,  forKey: .init("distanceKm")) }
            if let v = durationMin { try c.encode(v,  forKey: .init("durationMin")) }
            if let v = rpe         { try c.encode(v,  forKey: .init("rpe")) }
            if let v = proteinG    { try c.encode(v,  forKey: .init("proteinG")) }
            if let v = notes       { try c.encode(v,  forKey: .init("notes")) }
        }
    }

    func saveEntry(date: String, activity: String, patch: EntryPatch) async throws -> Entry {
        try await request("/api/entries/\(date)/\(activity)", method: "PUT", body: patch)
    }

    func deleteEntry(date: String, activity: String) async throws {
        let _: EmptyResponse = try await request(
            "/api/entries/\(date)/\(activity)", method: "DELETE")
    }

    // MARK: Coach

    struct CoachThread: Decodable { let messages: [ChatMessage] }

    func getCoachThread() async throws -> CoachThread {
        try await request("/api/coach")
    }

    struct CoachSend: Encodable { let message: String; let date: String? }
    func sendCoachMessage(_ message: String, date: String?) async throws -> CoachThread {
        try await request("/api/coach", method: "POST",
                          body: CoachSend(message: message, date: date))
    }
    struct CoachOpener: Encodable { let date: String? }
    func coachOpener(date: String?) async throws -> CoachThread {
        try await request("/api/coach/opener", method: "POST",
                          body: CoachOpener(date: date))
    }
    func resetCoach() async throws -> CoachThread {
        try await request("/api/coach", method: "DELETE")
    }
}

struct EmptyResponse: Decodable {}

private struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ v: Encodable) { self.value = v }
    func encode(to encoder: Encoder) throws {
        try value.encode(to: encoder)
    }
}

private struct AnyKey: CodingKey {
    let stringValue: String
    init(_ s: String) { self.stringValue = s }
    init?(stringValue: String) { self.stringValue = stringValue }
    var intValue: Int? { nil }
    init?(intValue: Int) { return nil }
}
