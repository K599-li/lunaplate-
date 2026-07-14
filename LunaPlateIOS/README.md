# LunaPlate iOS

Native SwiftUI skeleton for LunaPlate. The existing web app and Python API remain in the repository while screens migrate incrementally.

## Requirements

- macOS with Xcode 16 or later
- iOS 17 deployment target
- The existing Python server for live meal and movement recommendations

## Run

1. Start the existing backend from the repository root:

   ```sh
   python server.py
   ```

2. Open `LunaPlateIOS/LunaPlateIOS.xcodeproj` in Xcode.
3. Select the `LunaPlateIOS` scheme and an iPhone simulator.
4. Set a unique bundle identifier and your development team under Signing & Capabilities.
5. Run the app.

The simulator uses `http://localhost:5178` by default. A physical iPhone cannot reach the Mac through that loopback address; change `LUNAPLATE_API_BASE_URL` in `LunaPlateIOS/Resources/Info.plist` to the Mac's LAN URL during development or to the production HTTPS API.

## Structure

- `App`: app entry point and native tab/navigation shell
- `Core/Design`: LunaPlate colors and shared card treatment
- `Core/Models`: API response models
- `Core/Networking`: URLSession API client
- `Data`: SwiftData models and cycle phase calculation
- `Features`: Today, Insights, Food, Movement, and Profile views
- `Resources`: asset catalog, Info.plist, and English/Chinese/Russian String Catalog

## Migration boundary

The iOS app owns private user data locally through SwiftData. The Python service remains stateless and supplies public recommendation content. HTML, CSS, localStorage, and service-worker behavior are not embedded in the native app.

Implemented native capabilities:

1. Period start/end editing, calendar history, predicted ranges, and ovulation estimates
2. Daily symptom, flow, mood, pain, hydration, and notes check-ins
3. Versioned JSON backup/restore, including the web app's `lunaplate.cycles.v1` schema
4. Phase- and symptom-aware Food, Movement, and evidence-linked care recommendations
5. Local cycle/check-in notifications, real Swift Charts insights, privacy details, and delete-all controls
6. XCTest coverage for prediction/archive compatibility plus CI content and simulator tests
7. Automatic offline fallback with 12 meal ideas and 8 phase/symptom-aware movement options

Remaining release work:

1. Add fully offline movement illustrations
2. Complete App Icon artwork, screenshots, production signing, and App Store metadata
3. Publish the privacy policy at a stable public URL and configure the production HTTPS API
