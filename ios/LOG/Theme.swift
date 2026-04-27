import SwiftUI

enum Theme {
    static let ink         = Color(hex: 0x1A1716)
    static let inkDark     = Color(hex: 0x17140F)
    static let page        = Color(hex: 0x1D1A17)
    static let cream       = Color(hex: 0xF4EFE5)
    static let creamTint   = Color(hex: 0xEBE5D6)
    static let card        = Color.white
    static let accent      = Color(hex: 0xFF5A3C)
    static let mutedInk    = Color(hex: 0x1A1716, opacity: 0.5)
    static let faintInk    = Color(hex: 0x1A1716, opacity: 0.25)
    static let cream70     = Color(hex: 0xF4EFE5, opacity: 0.7)
    static let cream50     = Color(hex: 0xF4EFE5, opacity: 0.5)
    static let cream35     = Color(hex: 0xF4EFE5, opacity: 0.35)
    static let cream08     = Color(hex: 0xF4EFE5, opacity: 0.08)
}

enum AppFont {
    static func serif(_ size: CGFloat, italic: Bool = true) -> Font {
        if let _ = UIFont(name: "InstrumentSerif-Italic", size: size) {
            return .custom(italic ? "InstrumentSerif-Italic" : "InstrumentSerif-Regular", size: size)
        }
        return italic ? .system(size: size, weight: .regular, design: .serif).italic() : .system(size: size, weight: .regular, design: .serif)
    }
    static func sans(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        if let _ = UIFont(name: "Inter-Regular", size: size) {
            let face: String
            switch weight {
            case .bold:    face = "Inter-Bold"
            case .semibold:face = "Inter-SemiBold"
            case .medium:  face = "Inter-Medium"
            default:       face = "Inter-Regular"
            }
            return .custom(face, size: size)
        }
        return .system(size: size, weight: weight)
    }
    static func mono(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        if let _ = UIFont(name: "JetBrainsMono-Regular", size: size) {
            return .custom(weight == .medium ? "JetBrainsMono-Medium" : "JetBrainsMono-Regular", size: size)
        }
        return .system(size: size, weight: weight, design: .monospaced)
    }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255.0
        let g = Double((hex >>  8) & 0xFF) / 255.0
        let b = Double( hex        & 0xFF) / 255.0
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}
