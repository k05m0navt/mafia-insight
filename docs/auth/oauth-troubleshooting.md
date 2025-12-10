# OAuth Troubleshooting Guide

## Error: 401 invalid_client

This error typically means one of the following:

### 1. Redirect URI Mismatch

**Most Common Cause**: The redirect URI in your Google Cloud Console doesn't exactly match what NextAuth.js is using.

**NextAuth.js uses this callback URL:**

```
http://localhost:3000/api/auth/callback/google
```

**Check in Google Cloud Console:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check **Authorized redirect URIs** section
5. Ensure this exact URL is listed (no trailing slash):
   ```
   http://localhost:3000/api/auth/callback/google
   ```

**Common mistakes:**

- ❌ `http://localhost:3000/api/auth/callback/google/` (trailing slash)
- ❌ `https://localhost:3000/api/auth/callback/google` (https instead of http)
- ❌ `http://127.0.0.1:3000/api/auth/callback/google` (127.0.0.1 instead of localhost)
- ✅ `http://localhost:3000/api/auth/callback/google` (correct)

### 2. Incorrect Client ID or Secret

**Verify your credentials:**

1. Check that `GOOGLE_CLIENT_ID` in `.env` matches the Client ID in Google Cloud Console
2. Check that `GOOGLE_CLIENT_SECRET` matches the Client Secret
3. Make sure there are no extra spaces or quotes in `.env` file

**Test your credentials:**

```bash
# Check if environment variables are loaded
node -e "console.log('Client ID:', process.env.GOOGLE_CLIENT_ID)"
```

### 3. OAuth Consent Screen Not Configured

**Required steps:**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Ensure the consent screen is configured (even for testing)
3. Add your email as a test user if the app is in "Testing" mode
4. Publish the app or add test users

### 4. NEXTAUTH_URL Mismatch

**Check your `.env` file:**

```env
NEXTAUTH_URL=http://localhost:3000
```

**Important:**

- Must match exactly (no trailing slash)
- Must use `http://` for localhost (not `https://`)
- Must match the redirect URI in Google Cloud Console

### 5. Environment Variables Not Loaded

**Restart your dev server** after changing `.env`:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

**Verify variables are loaded:**

- Check server logs for any environment variable warnings
- NextAuth.js will log errors if credentials are missing

## Quick Fix Checklist

- [ ] Redirect URI in Google Cloud Console: `http://localhost:3000/api/auth/callback/google`
- [ ] `NEXTAUTH_URL=http://localhost:3000` in `.env` (no trailing slash)
- [ ] `GOOGLE_CLIENT_ID` matches Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` matches Google Cloud Console
- [ ] OAuth consent screen is configured
- [ ] Dev server restarted after `.env` changes
- [ ] No extra spaces/quotes in `.env` values

## Testing the Configuration

1. **Verify environment variables:**

   ```bash
   node -e "console.log({
     NEXTAUTH_URL: process.env.NEXTAUTH_URL,
     GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
     HAS_SECRET: !!process.env.GOOGLE_CLIENT_SECRET
   })"
   ```

2. **Check NextAuth route:**
   - Visit: `http://localhost:3000/api/auth/providers`
   - Should show Google provider if configured correctly

3. **Test OAuth flow:**
   - Go to `/login`
   - Click "Sign in with Google"
   - Should redirect to Google, not show 401 error

## Production Setup

For production, you'll need:

1. **Production redirect URI:**

   ```
   https://your-domain.com/api/auth/callback/google
   ```

2. **Update `.env` or hosting platform:**

   ```env
   NEXTAUTH_URL=https://your-domain.com
   GOOGLE_CLIENT_ID=your-production-client-id
   GOOGLE_CLIENT_SECRET=your-production-client-secret
   ```

3. **Add to Google Cloud Console:**
   - Add production redirect URI
   - Update authorized JavaScript origins

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check server logs** for NextAuth.js errors
3. **Verify Google Cloud Console** settings match exactly
4. **Try creating a new OAuth client** if credentials seem corrupted
