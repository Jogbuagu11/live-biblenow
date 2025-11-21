# How to See Build Errors in Xcode

Since the build is stalling, follow these steps to see the actual errors:

## Method 1: Check Xcode Build Log
1. Open Xcode: `open mobile/ios/TMWY.xcworkspace`
2. Select the **Runner** scheme (top left)
3. Click **Product** → **Build** (or press `Cmd+B`)
4. When it fails, click on the **red error icon** in the top right of the Issue Navigator (left sidebar)
5. This will show you the 2 errors and 684 warnings

## Method 2: View Recent Build Log
1. In Xcode, go to **View** → **Navigators** → **Report Navigator** (or press `Cmd+9`)
2. Click on the most recent build (should show "Build failed")
3. Expand the errors section to see the specific issues

## Method 3: Check Build Settings
1. Select the **TMWY** target in the left sidebar
2. Go to **Build Settings** tab
3. Search for any red/invalid entries

## Common Issues to Check:
- ✅ Entitlements file path (should be `TMWY.entitlements`)
- ✅ Info.plist path (should be `Runner/Info.plist`)
- ✅ Bridging header path (should be `Runner/Runner-Bridging-Header.h`)
- ✅ Code signing settings
- ✅ Missing files in the project

## Quick Fixes to Try:
1. Clean build folder: **Product** → **Clean Build Folder** (or `Shift+Cmd+K`)
2. Delete derived data: **Xcode** → **Settings** → **Locations** → Click arrow next to Derived Data → Delete folder
3. Re-run pod install: `cd mobile/ios && pod install`
4. Rebuild: **Product** → **Build**

