import SwiftUI

enum AppTheme {
    static let ivory = Color(red: 0.98, green: 0.96, blue: 0.92)
    static let porcelain = Color(red: 1.00, green: 0.99, blue: 0.97)
    static let berry = Color(red: 0.49, green: 0.25, blue: 0.31)
    static let rose = Color(red: 0.72, green: 0.47, blue: 0.50)
    static let sage = Color(red: 0.43, green: 0.56, blue: 0.47)
    static let oat = Color(red: 0.88, green: 0.80, blue: 0.67)
    static let plumText = Color(red: 0.22, green: 0.14, blue: 0.17)

    static let pagePadding: CGFloat = 20
    static let cardRadius: CGFloat = 20
}

struct LunaCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(18)
            .background(AppTheme.porcelain, in: RoundedRectangle(cornerRadius: AppTheme.cardRadius))
            .overlay {
                RoundedRectangle(cornerRadius: AppTheme.cardRadius)
                    .stroke(Color.primary.opacity(0.06))
            }
            .shadow(color: AppTheme.plumText.opacity(0.06), radius: 14, y: 6)
    }
}

extension View {
    func lunaCard() -> some View {
        modifier(LunaCardModifier())
    }
}
