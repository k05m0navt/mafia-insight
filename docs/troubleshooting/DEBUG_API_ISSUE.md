# 🐛 API Debug Analysis

## Issue

API endpoint `/api/auth/login` returns `role: "user"` when database has `role: "admin"`.

## Test Results

### Direct API Test

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({
    email: 'kmnavt@gmail.com',
    password: '8JovshEbV6DH@FjL&c%n',
  }),
});
```

**Response**:

```json
{
  "success": true,
  "user": {
    "id": "c294aa86-2ee8-4c50-84ae-61b5d85486d9",
    "email": "kmnavt@gmail.com",
    "name": "Daniil Gubaidullin",
    "role": "user"  ← ❌ WRONG!
  }
}
```

### Database Query

```sql
SELECT id, email, name, role FROM users WHERE email = 'kmnavt@gmail.com';
```

**Result**:

```json
{
  "id": "c294aa86-2ee8-4c50-84ae-61b5d85486d9",
  "email": "kmnavt@gmail.com",
  "name": "Daniil Gubaidullin",
  "role": "admin"  ← ✅ CORRECT!
}
```

## Root Cause Hypothesis

The API is:

1. Successfully authenticating with Supabase Auth ✅
2. NOT successfully querying the `users` table ❌
3. Falling back to default `role: 'user'` ❌

### Possible Reasons

1. **Profile query is failing silently**
   - The `userProfile` variable is `null` or `undefined`
   - Code falls back to `|| 'user'` on line 104

2. **Service role key not being used**
   - Even though it's in `.env.local`, Next.js might not have loaded it
   - Need to verify with server logs

3. **Row Level Security (RLS) blocking query**
   - Even with service role, if RLS is enabled it might block
   - Need to check RLS policies

## Next Steps

### Check Server Logs

Look for these logs in your `yarn dev` terminal:

```
[LOGIN API] Profile query result: { profile: {...}, profileError: ..., profileErrorCode: ... }
[LOGIN API] User profile: { id: '...', email: '...', name: '...', role: 'admin', profileRole: 'admin' }
```

**If you don't see these logs:**

- The API file wasn't recompiled
- Need to touch the file or restart dev server again

**If logs show `profile: null` or `profileError:`**

- The query is failing
- Need to fix the query or RLS policies

### Quick Fix Test

Try manually setting the role in the API response to see if that fixes the cookie:

```typescript
// Temporary test - line 104 in route.ts
const userRole = 'admin'; // Force admin for testing
```

This will confirm if the issue is:

- ✅ Just the database query → Fix the query
- ❌ Something else in the flow → Investigate cookie setting

## Evidence Collection

Please provide:

1. **Full server terminal output** during login
2. **Any `[LOGIN API]` logs**
3. **Any errors in the terminal**

This will help identify exactly where the flow breaks.
