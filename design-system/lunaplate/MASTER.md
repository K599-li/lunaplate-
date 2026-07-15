# LunaPlate Design System

This file is the visual source of truth for the LunaPlate Web and SwiftUI apps. The supplied mobile Today screenshot is the primary visual reference; generic wellness recommendations are secondary.

## Direction

- Product: women's cycle-care, meals, movement, hydration, and daily self-care.
- Tone: calm, warm, premium, supportive, and clinically trustworthy.
- Style: editorial wellness with soft depth; avoid dashboard density and decorative gradients.
- Density: 4/10. Motion: 3/10. Variation: 4/10.

## Brand Tokens

| Role | Value | SwiftUI name |
|---|---:|---|
| Primary text | `#543B3F` | `ink` |
| Secondary text | `#756461` | `muted` |
| Quiet text | `#AA9B95` | `quiet` |
| Page canvas | `#F5F1E6` | `canvas` |
| Main surface | `#FFFDF8` | `surface` |
| Soft surface | `#F8F2EC` | `surfaceSoft` |
| Primary rose | `#9D5F68` | `primary` |
| Deep berry | `#7B424C` | `primaryDeep` |
| Soft rose | `#F4D9DC` | `primarySoft` |
| Sage | `#6D806A` | `green` |
| Deep sage text | `#52664F` | `greenDeep` |
| Soft sage | `#EDF4E6` | `greenSoft` |
| Coral | `#D88991` | `coral` |
| Oat/peach | `#E5C8AA` | `peach` |
| Muted gold | `#BD9147` | `gold` |
| Hairline | `#EEE6DC` | `line` |

Use semantic tokens from `AppTheme`; do not hardcode colors inside feature views.

## Typography

- Brand name, cycle numbers, and emotional headings: system serif design so Dynamic Type continues to work.
- Navigation, controls, labels, card details, and body text: system sans-serif.
- Never scale fonts from screen width. Prefer semantic text styles and multiline wrapping.
- English, Simplified Chinese, and Russian must fit without clipping.

## Spacing and Shape

- Base rhythm: 4 / 8 / 12 / 16 / 20 / 24 / 32 points.
- Phone gutter: 20 points.
- Primary card radius: 22 points; compact controls: 14 points; chips and navigation can be capsules.
- Shadows are warm and subtle. Cards should remain distinguishable from the canvas without looking raised like plastic.
- Do not put every section inside a card. Use cards only for content or actions that behave as units.

## Today Screen

1. Brand header: official circular logo, LunaPlate wordmark, one supporting line, grocery and reminder actions.
2. Cycle hero: centered 200–260pt ring, phase and day inside, one editorial headline, one short supportive sentence.
3. Primary actions: calendar and check-in, both at least 44pt tall.
4. Today's plan: separate soft cards for nourishment, movement, and hydration. Each card has one SF Symbol, concise copy, and a clear completion control.
5. Hydration: 250ml controls, current total, and progress toward 2000ml.
6. Care recommendations: short, actionable, phase-aware copy with expandable safety/source details.
7. Meal recommendation: large food image, bottom gradient, readable title and metadata, with an intentional fallback artwork.
8. Floating navigation: four sections only; selected state uses rose fill plus text, never color alone.

## SwiftUI Implementation Rules

- Use `NavigationStack`, semantic `Button`/`NavigationLink`, SF Symbols, safe areas, and SwiftData state already present in the project.
- Interactive targets are at least 44x44pt with at least 8pt separation.
- Use semantic text styles or `@ScaledMetric` for large art-directed type.
- Respect Reduce Motion. State transitions should use opacity/color/elevation and last 150–300ms.
- Loading states must show progress; remote images must reserve space and have a fallback.
- Fixed bottom navigation must not cover scrolling content.
- Keep VoiceOver order equal to the visual order and label icon-only controls.

## Anti-patterns

- No emoji as structural icons.
- No loud purple/pink gradients or all-beige screens.
- No card-in-card stacks when dividers or rows are enough.
- No tiny explanatory copy, clipped translations, or fixed English-only layouts.
- No no-op buttons, hover-only behavior, or gestures without an accessible button alternative.
- Do not embed the Web app in `WKWebView` as a substitute for native SwiftUI implementation.

## Verification

- Build and run with Xcode 16+ on iOS 17+.
- Check a small iPhone, large iPhone, landscape, largest Dynamic Type, VoiceOver order, and Reduce Motion.
- Confirm light-mode contrast, 44pt controls, unobscured content, correct cycle data, remote/offline meal states, and all three locales.
