import SwiftUI

enum AppTheme {
    // LunaPlate brand tokens, matched to the mobile reference and Web product.
    static let ink = Color(hex: 0x543B3F)
    static let muted = Color(hex: 0x756461)
    static let quiet = Color(hex: 0xAA9B95)
    static let line = Color(hex: 0xEEE6DC)
    static let canvas = Color(hex: 0xF5F1E6)
    static let surface = Color(hex: 0xFFFDF8)
    static let surfaceSoft = Color(hex: 0xF8F2EC)
    static let primary = Color(hex: 0x9D5F68)
    static let primaryDeep = Color(hex: 0x7B424C)
    static let primarySoft = Color(hex: 0xF4D9DC)
    static let green = Color(hex: 0x6D806A)
    static let greenDeep = Color(hex: 0x52664F)
    static let greenSoft = Color(hex: 0xEDF4E6)
    static let coral = Color(hex: 0xD88991)
    static let peach = Color(hex: 0xE5C8AA)
    static let gold = Color(hex: 0xBD9147)

    // Backwards-compatible aliases used by the existing feature screens.
    static let ivory = canvas
    static let porcelain = surface
    static let berry = primaryDeep
    static let rose = primary
    static let sage = greenDeep
    static let oat = peach
    static let plumText = ink

    static let pagePadding: CGFloat = 20
    static let cardRadius: CGFloat = 22
    static let compactRadius: CGFloat = 14
    static let iconSize: CGFloat = 22

    static let pageBackground = LinearGradient(
        colors: [surface, canvas],
        startPoint: .top,
        endPoint: .bottom
    )

    static func brandFont(_ style: Font.TextStyle, weight: Font.Weight = .regular) -> Font {
        .system(style, design: .serif, weight: weight)
    }
}

private extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255,
            opacity: alpha
        )
    }
}

struct LunaCardModifier: ViewModifier {
    var padding: CGFloat = 18

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(AppTheme.surface, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous))
            .overlay {
                RoundedRectangle(cornerRadius: AppTheme.cardRadius, style: .continuous)
                    .stroke(AppTheme.line.opacity(0.9), lineWidth: 1)
            }
            .shadow(color: AppTheme.ink.opacity(0.07), radius: 18, y: 9)
    }
}

struct LunaIconButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .frame(width: 44, height: 44)
            .foregroundStyle(AppTheme.primaryDeep)
            .background(
                configuration.isPressed ? AppTheme.primarySoft : AppTheme.surface,
                in: Circle()
            )
            .overlay {
                Circle().stroke(AppTheme.line, lineWidth: 1)
            }
            .opacity(configuration.isPressed ? 0.78 : 1)
            .animation(.easeOut(duration: 0.16), value: configuration.isPressed)
    }
}

extension View {
    func lunaCard(padding: CGFloat = 18) -> some View {
        modifier(LunaCardModifier(padding: padding))
    }
}
