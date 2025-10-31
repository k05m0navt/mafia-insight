# Authentication Documentation

## Overview

Mafia Insight uses **Supabase Auth** for authentication, providing email/password authentication, session management, and role-based access control.

## Authentication Flow

### User Registration (Signup)

1. **User visits `/signup`**
2. **Enters email, name, and password**
3. **Supabase Auth creates account**
4. **Profile created in Prisma database** (via `/api/auth/signup`)
5. **Auto-login and redirect to dashboard**

**API Endpoint**: `POST /api/auth/signup`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response**:

```json
{
  "message": "Signup successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### User Login

1. **User visits `/login`**
2. **Enters email and password**
3. **Supabase Auth validates credentials**
4. **Session established**
5. **`lastLogin` timestamp updated in database**
6. **Redirect to `/players` dashboard**

**API Endpoint**: `POST /api/auth/login`

**Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:

```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "lastLogin": "2025-10-30T12:00:00Z"
  }
}
```

### User Logout

1. **User clicks "Log out" in profile dropdown**
2. **`useAuth` hook calls `logout()`**
3. **Supabase session cleared**
4. **Redirect to `/login`**

**API Endpoint**: `POST /api/auth/logout`

### Session Management

- **Session Duration**: 1 hour (with refresh token)
- **Session Storage**: HTTP-only cookies (secure)
- **Session Validation**: Automatic via Supabase middleware
- **Token Refresh**: Handled automatically by Supabase client

## Role-Based Access Control (RBAC)

### User Roles

1. **`user`** (default)
   - View players, games, tournaments
   - Manage own profile
   - No administrative access

2. **`admin`**
   - All user permissions
   - Access to admin dashboard (`/admin`)
   - User management
   - Sync monitoring and manual triggers
   - Data verification

### Permission Checks

**Client-Side** (using `usePermissions` hook):

```typescript
import { usePermissions } from '@/hooks/usePermissions';

const { canAccessPage, hasPermission } = usePermissions();

if (!canAccessPage('admin')) {
  return <UnauthorizedPage />;
}
```

**Server-Side** (in API routes):

```typescript
import { createRouteHandlerClient } from '@/lib/supabase/server';

const supabase = await createRouteHandlerClient();
const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const userProfile = await prisma.user.findUnique({
  where: { id: user.id },
  select: { role: true },
});

if (userProfile?.role !== 'admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

## Admin Bootstrap

The **Admin Bootstrap** system provides a secure way to create the first administrator account.

### Access Requirements

- **Only accessible when NO admin users exist**
- **Disabled after first admin is created**
- **Security check via `/api/admin/bootstrap/check`**

### Bootstrap Flow

1. **Visit `/admin/bootstrap`**
2. **System checks if admins exist**
3. **If no admins exist, form is displayed**
4. **Enter admin details (name, email, password)**
5. **Password confirmation required**
6. **Account created with `role: admin`**
7. **Redirect to login**

**API Endpoint**: `POST /api/admin/bootstrap`

**Request Body**:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "secureadminpassword123",
  "confirmPassword": "secureadminpassword123"
}
```

### Security Measures

- ✅ Password minimum 8 characters
- ✅ Password confirmation required
- ✅ Email validation
- ✅ One-time use (disabled after first admin)
- ✅ HTTPS required in production
- ✅ CSRF protection

## Profile Management

### Update Profile

**Page**: `/profile`

**Editable Fields**:

- Name
- Avatar (image upload)
- Theme preference (light/dark/system)

**Non-Editable Fields**:

- Email (read-only)
- Role (admin-only modification)

**API Endpoint**: `PATCH /api/user/profile`

**Request Body**:

```json
{
  "name": "Updated Name",
  "themePreference": "dark"
}
```

### Avatar Upload

**Storage**: Supabase Storage (`avatars` bucket)

**Requirements**:

- Max size: 2 MB
- Allowed types: JPEG, PNG, WebP, GIF
- Auto-resizing: Recommended

**Upload Flow**:

1. User selects image file
2. Client validates file size and type
3. Upload to Supabase Storage via `/api/user/avatar`
4. Public URL generated
5. User profile updated with avatar URL
6. Old avatar deleted (if exists)

**API Endpoint**: `POST /api/user/avatar`

**Request**: `multipart/form-data` with `avatar` file

**Response**:

```json
{
  "success": true,
  "avatarUrl": "https://storage.supabase.co/avatars/user-id-timestamp.jpg"
}
```

## Authentication Utilities

### Client-Side

**`useAuth` Hook**:

```typescript
import { useAuth } from '@/hooks/useAuth';

const { user, isAuthenticated, isLoading, logout } = useAuth();
```

**AuthProvider**:

```typescript
import { AuthProvider } from '@/components/auth/AuthProvider';

<AuthProvider>
  <App />
</AuthProvider>
```

### Server-Side

**Route Handlers**:

```typescript
import { createRouteHandlerClient } from '@/lib/supabase/server';

const supabase = await createRouteHandlerClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

**Server Components**:

```typescript
import { createServerComponentClient } from '@/lib/supabase/server';

const supabase = await createServerComponentClient();
const {
  data: { session },
} = await supabase.auth.getSession();
```

## Troubleshooting

### "Invalid credentials" on login

- Verify email and password are correct
- Check if account was created via Supabase Auth
- Ensure database profile exists

### "Session expired" error

- Token may have expired (1-hour duration)
- Refresh page to trigger token refresh
- If persists, log out and log back in

### Can't access admin pages

- Verify user role is `admin` in database
- Check `/api/admin/users` endpoint
- Ensure you're logged in

### Avatar upload fails

- Check file size (< 2 MB)
- Verify file type (JPEG, PNG, WebP, GIF)
- Ensure Supabase Storage bucket `avatars` is public
- Check `SUPABASE_SERVICE_ROLE_KEY` environment variable

## Environment Variables

Required for authentication:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## Security Best Practices

1. ✅ **HTTPS in production** (enforced by Vercel)
2. ✅ **HTTP-only cookies** for session storage
3. ✅ **Password hashing** (handled by Supabase)
4. ✅ **CSRF protection** (via Next.js)
5. ✅ **Rate limiting** (recommended: add to API routes)
6. ✅ **Email verification** (optional: enable in Supabase)

## Next Steps

- Enable email verification in Supabase dashboard
- Add OAuth providers (Google, GitHub, etc.)
- Implement password reset flow
- Add 2FA (Two-Factor Authentication)
- Implement session timeout notifications
