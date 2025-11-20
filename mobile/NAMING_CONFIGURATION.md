# TMWY App Naming Configuration

This document outlines all the places where "TMWY" is configured as the app name.

## iOS Configuration

### Info.plist
- **CFBundleDisplayName**: `TMWY` - This is the name shown on the iOS home screen
- **CFBundleName**: `TMWY` - Internal bundle name
- **Location**: `ios/Runner/Info.plist`

### Xcode Project
- **Bundle Identifier**: `com.tmwy.app`
- **Location**: `ios/Runner.xcodeproj/project.pbxproj`
- **Note**: The PRODUCT_NAME in Xcode still shows "Runner" internally, but the app name displayed on devices is controlled by CFBundleDisplayName in Info.plist

## Android Configuration

### AndroidManifest.xml
- **App Label**: Uses `@string/app_name` which is set to "TMWY"
- **Location**: `android/app/src/main/AndroidManifest.xml`

### strings.xml
- **app_name**: `TMWY`
- **Location**: `android/app/src/main/res/values/strings.xml`

### build.gradle.kts
- **Application ID**: `com.tmwy.app`
- **Namespace**: `com.tmwy.app`
- **Location**: `android/app/build.gradle.kts`

### MainActivity.kt
- **Package**: `com.tmwy.app`
- **Location**: `android/app/src/main/kotlin/com/tmwy/app/MainActivity.kt`

## Verification

To verify the app name is correctly set:

### iOS
1. Build and run the app on a device or simulator
2. Check the home screen - the app icon should show "TMWY" underneath
3. In Xcode, check the Info.plist file to confirm CFBundleDisplayName is "TMWY"

### Android
1. Build and run the app on a device or emulator
2. Check the app drawer - the app should be listed as "TMWY"
3. Check `android/app/src/main/res/values/strings.xml` to confirm app_name is "TMWY"

## Notes

- The Xcode project internal name may still show "Runner" in some places, but this doesn't affect the user-facing app name
- The bundle identifier/application ID can be changed if needed, but ensure it's updated consistently across all files
- After making changes, you may need to clean and rebuild:
  - iOS: `flutter clean && flutter pub get && cd ios && pod install && cd ..`
  - Android: `flutter clean && flutter pub get`

