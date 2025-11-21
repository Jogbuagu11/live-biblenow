# Google Sign In Setup Guide

## Your Current Configuration

- **Client ID**: `362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa.apps.googleusercontent.com`
- **Bundle ID**: `com.tmwy.app`

## Step 1: Get Your Google Client Secret

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one with Client ID: `362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa`)
5. Click on it to open details
6. Copy the **Client Secret** (it looks like: `GOCSPX-...`)

## Step 2: Configure Authorized Redirect URIs

1. In the same OAuth 2.0 Client ID settings page
2. Scroll to **Authorized redirect URIs**
3. Click **+ ADD URI**
4. Add your Supabase callback URL:
   ```
   https://uggogtzpobrpkzelbbkn.supabase.co/auth/v1/callback
   ```
   (Replace with your actual Supabase project reference ID if different)
5. Click **SAVE**

## Step 3: Configure in Supabase

1. Go to your **Supabase Dashboard** → **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Fill in:
   - **Client ID (for OAuth)**: `362697488766-6gka2foiucedngnd4b0p96rmbe8kniaa.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: (paste your Client Secret from Step 1)
4. Click **Save**

## Step 4: Verify OAuth Consent Screen (if needed)

1. In Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Make sure:
   - User Type is set (Internal or External)
   - App name, support email, and developer contact are filled
   - Scopes include: `email`, `profile`, `openid`
3. If you're using External users, you may need to verify your app

## Important Notes

- ✅ **Client ID**: Public, safe to use in frontend code
- 🔒 **Client Secret**: Keep private, only use in Supabase backend
- 🌐 **Redirect URI**: Must match exactly in both Google Console and Supabase
- 📱 **For Mobile Apps**: You may need separate OAuth clients for iOS and Android

## Troubleshooting

- **"redirect_uri_mismatch"**: Check that the redirect URI in Google Console matches Supabase callback URL exactly
- **"invalid_client"**: Verify Client ID and Secret are correct
- **"access_denied"**: Check OAuth consent screen is properly configured

