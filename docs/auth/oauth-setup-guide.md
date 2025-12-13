# OAuth Setup Guide

This guide explains how to obtain OAuth credentials for Google and GitHub authentication.

## Required Environment Variables

Add these to your `.env` or `.env.local` file:

```env
# Google OAuth (Required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth (Optional)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OAuth Token Encryption Key (Required for production)
OAUTH_TOKEN_ENCRYPTION_KEY=your_32_byte_hex_encryption_key
```

## Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter a project name (e.g., "Mafia Insight")
4. Click "Create"

### Step 2: Enable Google+ API

1. In the Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google+ API" or "Google Identity"
3. Click on it and click **Enable**

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in required fields:
     - App name: "Mafia Insight"
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid`
   - Click **Save and Continue**
   - Add test users (optional for development)
   - Click **Save and Continue**
   - Review and click **Back to Dashboard**

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Mafia Insight Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-production-domain.com/api/auth/callback/google` (for production)
   - Click **Create**

5. Copy the **Client ID** and **Client Secret** to your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
   ```

## GitHub OAuth Setup

### Step 1: Create a GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:
   - **Application name**: "Mafia Insight"
   - **Homepage URL**:
     - Development: `http://localhost:3000`
     - Production: `https://your-production-domain.com`
   - **Authorization callback URL**:
     - Development: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://your-production-domain.com/api/auth/callback/github`
4. Click **Register application**

### Step 2: Get Client ID and Secret

1. After creating the app, you'll see the **Client ID**
2. Click **Generate a new client secret** to get the **Client Secret**
3. Copy both to your `.env` file:
   ```env
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

**Note**: GitHub client secrets expire. You'll need to regenerate them periodically.

## OAuth Token Encryption Key

For production, you should encrypt OAuth tokens before storing them in the database.

### Generate Encryption Key

Run this command to generate a secure 32-byte hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Or using OpenSSL:

```bash
openssl rand -hex 32
```

Add the generated key to your `.env`:

```env
OAUTH_TOKEN_ENCRYPTION_KEY=your_generated_64_character_hex_string
```

**Important**:

- Keep this key secure and never commit it to version control
- Use different keys for development and production
- If you lose this key, you won't be able to decrypt existing tokens

## Development vs Production

### Development

- Use `http://localhost:3000` for all callback URLs
- You can use a simple encryption key or skip encryption (tokens stored in plain text - NOT recommended for production)

### Production

- Use your production domain for callback URLs
- **MUST** use a secure encryption key
- Ensure all environment variables are set in your hosting platform (Vercel, etc.)

## Testing OAuth

1. Start your development server: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Click "Sign in with Google" or "Sign in with GitHub"
4. You should be redirected to the OAuth provider
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### "Redirect URI mismatch" error

- Ensure the callback URL in your OAuth app settings exactly matches: `http://localhost:3000/api/auth/callback/google`
- Check for trailing slashes or protocol mismatches (http vs https)

### "Invalid client" error

- Verify your Client ID and Client Secret are correct
- Check that you copied the entire secret (they can be long)

### OAuth not working in production

- Verify all environment variables are set in your hosting platform
- Check that callback URLs use `https://` in production
- Ensure your production domain is added to authorized origins

## Security Best Practices

1. **Never commit** `.env` files to version control
2. Use different OAuth apps for development and production
3. Rotate secrets periodically
4. Use strong encryption keys (32 bytes minimum)
5. Monitor OAuth usage in provider dashboards
6. Set up rate limiting for OAuth endpoints
