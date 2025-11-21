# COMPLETE Xcode OAuth Setup Instructions

## ⚠️ CRITICAL: You MUST complete ALL these steps for OAuth to work!

---

## PART 1: Apple Sign In Setup

### Step 1: Enable Capability in Xcode
1. Open `mobile/ios/TMWY.xcodeproj` (or `Runner.xcworkspace` if using CocoaPods) in Xcode
2. Select the **Runner** target in the left sidebar
3. Click the **Signing & Capabilities** tab at the top
4. Click the **+ Capability** button (top left)
5. Search for **"Sign in with Apple"** and double-click it
6. Xcode will automatically add the entitlement

### Step 2: Verify Entitlements File is Linked
1. Still in **Signing & Capabilities** tab
2. Scroll down to see if "Sign in with Apple" appears in the capabilities list
3. If you see it, the entitlements file is automatically linked ✅

### Step 3: Enable in Apple Developer Portal
1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
4. Click on your App ID: **`com.tmwy.app`**
5. Check the box for **"Sign in with Apple"**
6. Click **Save**
7. You may need to regenerate your provisioning profile after this

### Step 4: Configure in Supabase Dashboard
1. Go to your Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and toggle it **ON**
3. Fill in:
   - **Service ID**: `com.tmwy.app.signin` (create this in Apple Developer Portal if you haven't)
   - **Secret Key**: Generate JWT token using the script (see APPLE_SIGNIN_SETUP.md)
   - **Client ID**: Same as Service ID (`com.tmwy.app.signin`)
4. Click **Save**

---

## PART 2: Google Sign In Setup

### Step 1: Add GoogleService-Info.plist to Xcode Project
**THIS IS CRITICAL - DO NOT SKIP THIS!**

1. In Xcode, right-click on the **Runner** folder in the left sidebar
2. Select **"Add Files to Runner..."**
3. Navigate to your Downloads folder and select:
   - `client_362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa.apps.googleusercontent.com.plist`
4. **IMPORTANT**: Check these boxes:
   - ✅ **"Copy items if needed"** (so it copies into your project)
   - ✅ **"Add to targets: Runner"** (must be checked!)
5. Click **Add**

### Step 2: Rename the File (Optional but Recommended)
1. In Xcode, right-click the plist file you just added
2. Select **Rename**
3. Rename it to: **`GoogleService-Info.plist`**
   - This is the standard name Xcode expects

### Step 3: Verify File is in Project
1. The file should appear in your Xcode project navigator under **Runner**
2. Click on it to verify it opens and shows your Google Client ID
3. Make sure it's checked under **Target Membership** → **Runner** (in the right sidebar)

### Step 4: Configure in Supabase Dashboard
1. Go to your Supabase Dashboard → **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Fill in:
   - **Client ID (for OAuth)**: `362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: Get from Google Cloud Console (starts with `GOCSPX-...`)
4. Click **Save**

### Step 5: Configure Redirect URI in Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://uggogtzpobrpkzelbbkn.supabase.co/auth/v1/callback
   ```
   (Replace with your actual Supabase project URL if different)
5. Click **Save**

---

## PART 3: Verify Everything is Set Up

### Checklist:
- [ ] Apple Sign In capability added in Xcode
- [ ] Apple Sign In enabled in Apple Developer Portal for `com.tmwy.app`
- [ ] Apple configured in Supabase Dashboard
- [ ] GoogleService-Info.plist added to Xcode project
- [ ] GoogleService-Info.plist has "Copy items if needed" checked
- [ ] GoogleService-Info.plist is in Target Membership for Runner
- [ ] Google configured in Supabase Dashboard
- [ ] Redirect URI added in Google Cloud Console

### Test the Setup:
1. Build and run your app: `flutter run`
2. Try clicking "Sign in with Google" - it should open browser
3. Try clicking "Sign in with Apple" - it should open browser
4. After authentication, you should be redirected back to the app

---

## Troubleshooting

### Google Sign In Not Working?
- ✅ Verify GoogleService-Info.plist is in the project
- ✅ Verify it's added to Target Membership
- ✅ Check Supabase Dashboard has correct Client ID and Secret
- ✅ Verify redirect URI matches in Google Cloud Console

### Apple Sign In Not Working?
- ✅ Verify capability is enabled in Xcode
- ✅ Verify it's enabled in Apple Developer Portal
- ✅ Check Supabase Dashboard has correct Service ID and Secret Key
- ✅ Make sure your provisioning profile includes the capability

### Deep Link Not Working?
- ✅ Verify `com.tmwy.app://login-callback` is in Supabase redirect URLs
- ✅ Check Info.plist has CFBundleURLTypes configured (already done)
- ✅ Check AndroidManifest.xml has intent filter (already done)

---

## Important Notes

1. **GoogleService-Info.plist MUST be in the Xcode project** - This is NOT optional!
2. **The plist file MUST be added to the Runner target** - Check Target Membership!
3. **Apple capability MUST be enabled in both Xcode AND Apple Developer Portal**
4. **All Supabase configurations MUST match exactly** - No typos allowed!
