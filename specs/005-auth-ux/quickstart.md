# Quickstart: Enhanced Authentication UX and User Management

**Feature**: Enhanced Authentication UX and User Management  
**Date**: 2025-01-26  
**Purpose**: Get up and running with the authentication and user management features

## Overview

This feature enhances the authentication experience with clear error messaging and provides comprehensive user management capabilities for administrators. Users get better feedback when authentication fails, and admins can create and manage users with proper role-based access control.

## Key Features

- **Clear Error Messages**: User-friendly authentication error messages with actionable next steps
- **User Management**: Admin interface for creating and managing users
- **Role-Based Access**: Hierarchical permissions (Guest < User < Admin)
- **Form Data Preservation**: User data preserved during authentication recovery
- **Invitation System**: Secure user invitations with 7-day expiration

## Prerequisites

- Node.js 18+ and Yarn
- Supabase project with Auth enabled
- Next.js 14+ application
- TypeScript 5+

## Installation

### 1. Install Dependencies

```bash
yarn add @supabase/supabase-js next-auth @next-auth/supabase-adapter
yarn add -D @types/node
```

### 2. Environment Variables

Create `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Email Configuration (if using custom SMTP)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## Quick Setup

### 1. Configure Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createClientComponentClient();
```

### 2. Set Up Error Mapping

Create `src/lib/auth/error-mapping.ts`:

```typescript
export const ERROR_MESSAGES = {
  invalid_credentials: {
    message:
      'Invalid email or password. Please check your credentials and try again.',
    action: 'Check your email and password, then try logging in again.',
  },
  email_not_confirmed: {
    message:
      'Please check your email and click the confirmation link before signing in.',
    action: 'Check your email inbox and click the confirmation link.',
  },
  too_many_requests: {
    message:
      'Too many login attempts. Please wait a few minutes before trying again.',
    action: 'Wait 5 minutes, then try logging in again.',
  },
  // Add more error mappings as needed
};

export function getUserFriendlyError(errorCode: string, action: string) {
  const error = ERROR_MESSAGES[errorCode];
  if (!error) {
    return {
      message: 'An authentication error occurred. Please try again.',
      action: 'Please try again or contact support if the problem persists.',
    };
  }
  return error;
}
```

### 3. Create Authentication Hook

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
```

### 4. Create Error Display Component

Create `src/components/auth/AuthError.tsx`:

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { getUserFriendlyError } from '@/lib/auth/error-mapping'

interface AuthErrorProps {
  errorCode: string
  action: string
  onRetry?: () => void
}

export function AuthError({ errorCode, action, onRetry }: AuthErrorProps) {
  const error = getUserFriendlyError(errorCode, action)

  return (
    <Alert variant="destructive">
      <AlertTitle>Authentication Error</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{error.message}</p>
        <p className="text-sm text-muted-foreground">{error.action}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
```

### 5. Create User Management API

Create `src/app/api/users/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get users
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { email, name, role } = await request.json();

    // Create user invitation
    const { data: invitation, error } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { name, role },
      });

    if (error) throw error;

    return NextResponse.json({
      message: 'User created and invitation sent',
      invitation,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
```

## Usage Examples

### 1. Display Authentication Status

```typescript
import { useAuth } from '@/hooks/useAuth'

function Navigation() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <nav>
      {user ? (
        <div>
          <span>Welcome, {user.email}</span>
          <button onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      ) : (
        <button onClick={() => router.push('/login')}>
          Sign In
        </button>
      )}
    </nav>
  )
}
```

### 2. Handle Authentication Errors

```typescript
import { AuthError } from '@/components/auth/AuthError'

function LoginForm() {
  const [error, setError] = useState(null)

  const handleLogin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError({
          code: error.message,
          action: 'login'
        })
      }
    } catch (err) {
      setError({
        code: 'unknown_error',
        action: 'login'
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && (
        <AuthError
          errorCode={error.code}
          action={error.action}
          onRetry={() => setError(null)}
        />
      )}
    </form>
  )
}
```

### 3. User Management Interface

```typescript
import { useState, useEffect } from 'react'

function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      if (response.ok) {
        fetchUsers() // Refresh list
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }

  if (loading) return <div>Loading users...</div>

  return (
    <div>
      <h2>User Management</h2>
      <button onClick={() => setShowCreateForm(true)}>
        Create New User
      </button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

## Testing

### 1. Unit Tests

```typescript
// tests/components/AuthError.test.tsx
import { render, screen } from '@testing-library/react'
import { AuthError } from '@/components/auth/AuthError'

describe('AuthError', () => {
  it('displays user-friendly error message', () => {
    render(
      <AuthError
        errorCode="invalid_credentials"
        action="login"
        onRetry={jest.fn()}
      />
    )

    expect(screen.getByText(/Invalid email or password/)).toBeInTheDocument()
    expect(screen.getByText(/Check your email and password/)).toBeInTheDocument()
  })
})
```

### 2. Integration Tests

```typescript
// tests/integration/auth.test.ts
import { test, expect } from '@playwright/test';

test('user can login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});
```

## Deployment

### 1. Environment Setup

Ensure all environment variables are configured in your deployment platform:

- Vercel: Add to Environment Variables in project settings
- Netlify: Add to Site Settings > Environment Variables
- Railway: Add to Variables tab

### 2. Database Migration

Run the database migration to create the required tables:

```sql
-- Create users table with role support
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  avatar TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_invitations table
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Supabase Configuration

1. Enable email authentication in Supabase Auth settings
2. Configure email templates for user invitations
3. Set up Row Level Security (RLS) policies
4. Configure redirect URLs for authentication flows

## Troubleshooting

### Common Issues

1. **Authentication errors not displaying properly**
   - Check error mapping configuration
   - Verify error codes match Supabase responses
   - Test error handling in development

2. **User management not working**
   - Verify admin role assignment
   - Check API endpoint permissions
   - Ensure Supabase service role key is configured

3. **Form data not preserved**
   - Check localStorage implementation
   - Verify encryption/decryption logic
   - Test across different browsers

### Support

For additional help:

- Check the [API documentation](./contracts/auth-api.yaml)
- Review the [data model](./data-model.md)
- Contact the development team

## Next Steps

1. **Customize Error Messages**: Add more specific error messages for your use case
2. **Enhance User Management**: Add bulk operations, user search, and filtering
3. **Add Audit Logging**: Track user actions and system changes
4. **Implement Notifications**: Add real-time notifications for user management actions
5. **Add User Onboarding**: Create guided onboarding flow for new users
