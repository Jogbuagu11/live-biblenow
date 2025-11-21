# Apple Sign In Setup Guide

## Step 1: Apple Developer Account Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with your Apple ID

## Step 2: Create a Service ID

1. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
2. Click the **+** button
3. Select **Services IDs** → **Continue**
4. Fill in:
   - **Description**: TMWY Sign In
   - **Identifier**: `com.tmwy.app.signin` (or your preferred identifier)
5. Click **Continue** → **Register**
6. Click on your newly created Service ID
7. Check **Sign in with Apple** → **Configure**
8. Add your domain and return URLs:
   - **Primary App ID**: Select your app's bundle ID
   - **Return URLs**: 
     ```
     https://your-project-id.supabase.co/auth/v1/callback
     ```
   - Replace `your-project-id` with your actual Supabase project ID
9. Click **Save** → **Continue** → **Save**

## Step 3: Create a Key

1. Go to **Keys** section
2. Click the **+** button
3. Enter a **Key Name**: "TMWY Sign In Key"
4. Check **Sign in with Apple**
5. Click **Configure** → Select your Primary App ID → **Save**
6. Click **Continue** → **Register**
7. **IMPORTANT**: Download the `.p8` key file (you can only download it once!)
8. Note the **Key ID** (10-character string, e.g., `W25N69WZ76`)

## Step 4: Get Your Team ID

1. Go to **Membership** tab in Apple Developer
2. Copy your **Team ID** (10-character string)

## Step 5: Generate Client Secret

You have two options:

### Option A: Using the Script (Recommended)

1. Install dependencies:
   ```bash
   npm install jsonwebtoken
   ```

2. Run the script:
   ```bash
   node scripts/generate-apple-secret.js
   ```

3. Enter the required information when prompted:
   - Team ID
   - Key ID
   - Service ID
   - Path to your .p8 file

4. Copy the generated JWT token

### Option B: Using Online Tool

You can use online JWT generators or tools like:
- [JWT.io](https://jwt.io) (manual setup)
- [Apple Client Secret Generator](https://appleid.apple.com) (official)

**JWT Payload:**
```json
{
  "iss": "YOUR_TEAM_ID",
  "iat": CURRENT_TIMESTAMP,
  "exp": CURRENT_TIMESTAMP + 15777000,
  "aud": "https://appleid.apple.com",
  "sub": "YOUR_SERVICE_ID"
}
```

**JWT Header:**
```json
{
  "alg": "ES256",
  "kid": "YOUR_KEY_ID"
}
```

## Step 6: Configure in Supabase

1. Go to your Supabase Dashboard → **Authentication** → **Providers**
2. Find **Apple** and toggle it **ON**
3. Fill in:
   - **Service ID**: Your Service ID (e.g., `com.tmwy.app.signin`)
   - **Secret Key**: The JWT token you generated
   - **Client ID**: Your Service ID (same as above)
4. Click **Save**

## Important Notes

- ⚠️ **Client Secret expires**: The JWT token expires in 6 months. You'll need to regenerate it.
- 🔒 **Keep your .p8 file secure**: Never commit it to version control
- 📝 **Service ID vs App ID**: 
  - **App ID**: Your app's bundle identifier (e.g., `com.tmwy.app`)
  - **Service ID**: The identifier for Sign in with Apple (e.g., `com.tmwy.app.signin`)

## Troubleshooting

- **"Invalid client"**: Check that your Service ID matches exactly
- **"Invalid redirect URI"**: Ensure the return URL in Apple matches Supabase callback URL
- **"Token expired"**: Regenerate the client secret (it expires every 6 months)

