# Flutter Build Troubleshooting

## If Installation is Stalling

### Quick Fixes:

1. **Cancel and try again with verbose output:**
   ```bash
   cd mobile
   flutter run -v
   ```
   This will show you exactly where it's hanging.

2. **Clean and rebuild:**
   ```bash
   cd mobile
   flutter clean
   cd ios
   rm -rf Pods Podfile.lock
   pod install
   cd ..
   flutter pub get
   flutter run
   ```

3. **Check device connection:**
   ```bash
   flutter devices
   ```
   Make sure your iPhone shows as connected.

4. **Try building from Xcode directly:**
   ```bash
   open mobile/ios/TMWY.xcworkspace
   ```
   Then in Xcode:
   - Select your device
   - Product → Run (⌘R)
   - This will show more detailed error messages

5. **Check code signing:**
   - Open Xcode: `open mobile/ios/TMWY.xcworkspace`
   - Select **TMWY** target → **Signing & Capabilities**
   - Make sure "Automatically manage signing" is checked
   - Select your team
   - Verify bundle ID is `com.tmwy.app`

6. **If it's hanging on "Installing app":**
   - Unlock your iPhone
   - Trust the developer certificate if prompted
   - Check iPhone Settings → General → VPN & Device Management
   - Trust the developer profile

7. **Kill any hanging processes:**
   ```bash
   killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null
   killall -9 Xcode 2>/dev/null
   ```

8. **Restart Flutter daemon:**
   ```bash
   flutter doctor -v
   flutter pub get
   ```

### Common Stalling Points:

- **"Running pod install"** - Usually completes in 10-30 seconds
- **"Running Xcode build"** - Can take 1-5 minutes first time
- **"Installing app"** - Usually 10-30 seconds, but can hang if:
  - Device is locked
  - Need to trust developer
  - Provisioning profile issue

### If Still Stalling:

Run with verbose output and check the last line:
```bash
flutter run -v 2>&1 | tee build.log
```

Then check the end of `build.log` to see where it stopped.

