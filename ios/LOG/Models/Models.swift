import Foundation

struct AppSettings: Codable, Equatable {
    var bodyWeightKg: Double?
    var proteinGoalG: Double?
    var sex: String?
    var age: Int?
    var fitnessLevel: String?
}

enum Activity: String, Codable, CaseIterable, Identifiable {
    case walk, squash, taekwondo, strength, protein
    var id: String { rawValue }
    var label: String {
        switch self {
        case .walk:      return "Walk"
        case .squash:    return "Squash"
        case .taekwondo: return "Taekwondo"
        case .strength:  return "Strength"
        case .protein:   return "Protein"
        }
    }
    var target: String {
        switch self {
        case .walk:      return "≥6 km"
        case .squash:    return "60 min"
        case .taekwondo: return "60 min"
        case .strength:  return "8 moves"
        case .protein:   return ""
        }
    }
}

struct Entry: Codable, Identifiable, Equatable {
    var id: String { "\(date)|\(activity)" }
    let date: String
    let activity: String
    var done: Bool
    var distanceKm: Double?
    var durationMin: Double?
    var rpe: Int?
    var proteinG: Double?
    var notes: String?
    var caloriesBurned: Int?

    enum CodingKeys: String, CodingKey {
        case date, activity, done, distanceKm, durationMin, rpe, proteinG, notes, caloriesBurned
    }

    var hasSignal: Bool {
        done
            || distanceKm != nil
            || durationMin != nil
            || rpe != nil
            || proteinG != nil
            || (notes ?? "").isEmpty == false
    }
}

struct ChatMessage: Codable, Identifiable, Equatable {
    let role: String
    let content: String
    let createdAt: Date?
    var id: String { "\(role)-\(createdAt?.timeIntervalSince1970 ?? 0)-\(content.hashValue)" }
}
