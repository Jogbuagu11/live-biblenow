# OAuth End-to-End Complete Checklist

## ✅ CODE IMPLEMENTATION (DONE)

### Flutter Code
- [x] OAuth methods in `SupabaseService` (Google & Apple)
- [x] OAuth methods in `AuthProvider` 
- [x] OAuth buttons in `AuthPage` UI
- [x] Loading states for OAuth buttons
- [x] Error handling
- [x] `url_launcher` dependency added

### Deep Links
- [x] iOS: `CFBundleURLTypes` configured in `Info.plist` (`com.tmwy.app`)
- [x] Android: Intent filter configured in `AndroidManifest.xml` (`com.tmwy.app`)
- [x] Redirect URL: `com.tmwy.app://login-callback` in code

### Supabase Configuration
- [x] PKCE auth flow enabled in `main.dart`
- [x] OAuth state change listener in `main.dart`

---

## ⚠️ XCODE CONFIGURATION (YOU MUST DO THIS)

### Apple Sign In
- [ ] **Open Xcode**: `open mobile/ios/TMWY.xcodeproj`
- [ ] **Select Runner target** → **Signing & Capabilities** tab
- [ ] **Click + Capability** → Add **"Sign in with Apple"**
- [ ] Verify `Runner.entitlements` file is linked (should auto-link)

### Google Sign In
- [ ] **In Xcode**: Right-click **Runner** folder → **"Add Files to Runner..."**
- [ ] Navigate to `mobile/ios/Runner/GoogleService-Info.plist`
- [ ] **CRITICAL**: Check ✅ **"Copy items if needed"**
- [ ] **CRITICAL**: Check ✅ **"Add to targets: Runner"**
- [ ] Click **Add**
- [ ] Verify file appears in project navigator
- [ ] Verify **Target Membership** → **Runner** is checked (right sidebar)

---

## ⚠️ APPLE DEVELOPER PORTAL (YOU MUST DO THIS)

### Apple Sign In Setup
- [ ] Go to [Apple Developer Portal](https://developer.apple.com/account)
- [ ] **Certificates, Identifiers & Profiles** → **Identifiers**
- [ ] Select App ID: **`com.tmwy.app`**
- [ ] Enable **"Sign in with Apple"** checkbox
- [ ] Click **Save**

### Create Service ID (if not done)
- [ ] **Identifiers** → Click **+** → **Services IDs**
- [ ] Description: `TMWY Sign In`
- [ ] Identifier: `com.tmwy.app.signin`
- [ ] Enable **"Sign in with Apple"** → **Configure**
- [ ] Primary App ID: Select `com.tmwy.app`
- [ ] Return URLs: `https://uggogtzpobrpkzelbbkn.supabase.co/auth/v1/callback`
- [ ] Click **Save** → **Continue** → **Save**

### Generate Apple Client Secret
- [ ] Get your **Team ID** from Apple Developer Portal → **Membership**
- [ ] Run: `node scripts/generate-apple-secret-now.cjs YOUR_TEAM_ID com.tmwy.app.signin`
- [ ] Copy the generated JWT token

---

## ⚠️ GOOGLE CLOUD CONSOLE (YOU MUST DO THIS)

### Configure Redirect URI
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] **APIs & Services** → **Credentials**
- [ ] Click on OAuth 2.0 Client ID: `362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa`
- [ ] Under **Authorized redirect URIs**, add:
  ```
  https://uggogtzpobrpkzelbbkn.supabase.co/auth/v1/callback
  ```
- [ ] Click **Save**

### Get Client Secret
- [ ] In the same OAuth Client ID page
- [ ] Copy the **Client Secret** (starts with `GOCSPX-...`)

---

## ⚠️ SUPABASE DASHBOARD (YOU MUST DO THIS)

### Google Provider
1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** → Toggle **ON**
3. Fill in:
   - **Client ID (for OAuth)**: `362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: `GOCSPX-...` (from Google Cloud Console)
4. Click **Save**

### Apple Provider
1. Find **Apple** → Toggle **ON**
2. Fill in:
   - **Service ID**: `com.tmwy.app.signin`
   - **Secret Key**: (JWT token from script - paste the entire long token)
   - **Client ID**: `com.tmwy.app.signin` (same as Service ID)
3. Click **Save**

### Redirect URLs
1. Go to **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   com.tmwy.app://login-callback
   ```
3. Click **Save**

---

## ✅ VERIFICATION CHECKLIST

### Code Verification
- [x] OAuth buttons visible on auth page
- [x] Deep links configured for iOS and Android
- [x] Redirect URL matches in code: `com.tmwy.app://login-callback`
- [x] PKCE flow enabled
- [x] OAuth state listener configured

### Xcode Verification
- [ ] GoogleService-Info.plist added to project
- [ ] GoogleService-Info.plist in Target Membership
- [ ] Apple Sign In capability enabled
- [ ] Entitlements file linked

### Portal Verification
- [ ] Apple Sign In enabled in Apple Developer Portal
- [ ] Service ID created and configured
- [ ] Google redirect URI added
- [ ] Apple client secret generated

### Supabase Verification
- [ ] Google provider configured with Client ID and Secret
- [ ] Apple provider configured with Service ID and Secret Key
- [ ] Redirect URL `com.tmwy.app://login-callback` added

---

## 🧪 TESTING

### Test Google Sign In
1. Run app: `flutter run`
2. Click "Sign in with Google"
3. Should open browser
4. Complete Google sign-in
5. Should redirect back to app
6. Should be signed in

### Test Apple Sign In
1. Run app: `flutter run`
2. Click "Sign in with Apple"
3. Should open browser
4. Complete Apple sign-in
5. Should redirect back to app
6. Should be signed in

---

## ❌ COMMON ISSUES

### "redirect_uri_mismatch" (Google)
- ✅ Check redirect URI in Google Cloud Console matches Supabase callback URL exactly
- ✅ Check redirect URL in Supabase Dashboard includes `com.tmwy.app://login-callback`

### "Invalid client" (Apple)
- ✅ Verify Service ID matches exactly in Supabase and Apple Developer Portal
- ✅ Verify client secret (JWT) is not expired (regenerate if needed)

### Deep link not working
- ✅ Verify `CFBundleURLTypes` in Info.plist
- ✅ Verify intent filter in AndroidManifest.xml
- ✅ Verify redirect URL in Supabase Dashboard

### GoogleService-Info.plist not found
- ✅ Verify file is added to Xcode project (not just in folder)
- ✅ Verify Target Membership includes Runner

---

## 📝 SUMMARY

**What's Already Done:**
- ✅ All Flutter code implementation
- ✅ Deep link configuration
- ✅ UI buttons and handlers
- ✅ GoogleService-Info.plist file created
- ✅ Runner.entitlements file created

**What You Must Do:**
1. ⚠️ Add GoogleService-Info.plist to Xcode project
2. ⚠️ Enable Apple Sign In capability in Xcode
3. ⚠️ Enable Apple Sign In in Apple Developer Portal
4. ⚠️ Generate Apple client secret (JWT)
5. ⚠️ Configure Google redirect URI in Google Cloud Console
6. ⚠️ Configure both providers in Supabase Dashboard
7. ⚠️ Add redirect URL in Supabase Dashboard

**Once all checkboxes are done, OAuth will work!**

