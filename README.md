# Sudoku Angular + Capacitor Android App

This repository contains an Angular Sudoku application integrated with Capacitor to run as a native Android app. This README describes the **full workflow from building the project to deploying on an Android device**.

---

## Prerequisites

Before starting, ensure you have the following installed:

- [Node.js (>=20)](https://nodejs.org/) and [npm](https://www.npmjs.com/)
- [Angular CLI](https://angular.io/cli)
- [Capacitor CLI](https://capacitorjs.com/docs/getting-started)
- [Java JDK (LTS recommended, e.g., JDK 17)](https://adoptium.net/)
- [Android Studio](https://developer.android.com/studio)
- [Git](https://git-scm.com/)
- USB debugging enabled on your Android device (for physical testing)

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/sudoku-angular.git
cd sudoku-angular
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Build Angular Project

```bash
ng build --configuration production --output-path=dist/sudoku-angular/browser
```

## 4. Initialize Capacitor

```bash
npx cap init
```
App name: Sudoku
App ID: com.anna.sudoku
Web directory: dist/sudoku-angular/browser

## 5. Add Android Platform

```bash
npx cap add android
```

## 6. Sync Capacitor
Whenever you make Angular changes:

```bash
npx cap copy
npx cap sync
```

## 7. Open Android Project in Android Studio

```bash
npx cap open android
```

Android Studio opens the ```android/``` folder
Build, run, or debug on an emulator or connected device.

## 8. Running on Android Device
### 8.1 Using Emulator

Android Studio → AVD Manager → Create Virtual Device → Tablet or Phone

Click Run (green) button to launch the app.

### 8.2 Using Physical Device

Connect your device via USB.

Enable USB Debugging.

Build APK:

```bash
cd android
.\gradlew assembleRelease
```

Install APK via ADB:

```bash
adb devices               # Ensure your device is detected
adb install -r app\build\outputs\apk\release\app-release.apk
```

## 9. Updating App Icon

1. Android Studio → ```app → res → mipmap```
2. Right-click → **New** → **Image Asset**
3. Select your PNG icon → Finish
4. Rebuild APK and reinstall to see updated icon

## 10. Status Bar Customization

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

async setStatusBar() {
  // Only in dark mode
  await StatusBar.setStyle({ style: Style.Dark });
  await StatusBar.setBackgroundColor({ color: '#ffffff' });
}
```

## 11. Generate Keystore for Release

```bash
keytool -genkey -v -keystore sudoku-release-key.jks -alias sudokuKey -keyalg RSA -keysize 2048 -validity 10000
```

- Keep the keystore safe
- Needed for signing APK/AAB

## 12. Build Signed APK/AAB

```bash
.\gradlew assembleRelease   # APK
.\gradlew bundleRelease     # AAB
```

## 13. Publish to Google Play

1. Sign APK/AAB using keystore
2. Create a Google Play Developer account
3. Upload AAB to Play Console
4. Add **store listing, privacy policy, screenshots, feature graphic, tags**
5. Submit for review

## 14. Notes / Tips

- Always ```ng build``` → ```npx cap sync``` after Angular changes
- ```.apk``` for testing, ```.aab``` for Play Store
- If status bar overlaps app, add padding via CSS or Capacitor plugin
- Use ```--prod``` build to ensure optimized bundle

For device testing, allow installation from unknown sources
