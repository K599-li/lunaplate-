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

Next implementation milestones:

1. Period start/end editing and calendar history
2. Daily symptom, flow, mood, hydration, and notes check-in
3. JSON import from the web app's `lunaplate.cycles.v1` schema
4. Phase-aware Food and Movement queries using the active SwiftData snapshot
5. Local notifications and offline recommendation fallback
6. App icon artwork, privacy manifest, tests, and App Store signing
