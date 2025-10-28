# Troubleshooting Guide

This guide helps diagnose and resolve common issues with the Mafia Insight application.

## Quick Diagnostics

### Health Check Commands

```bash
# Check application status
curl http://localhost:3000/api/health

# Check database connection
curl http://localhost:3000/api/health/db

# Check authentication service
curl http://localhost:3000/api/auth/me

# Check performance metrics
curl http://localhost:3000/api/performance
```

### Log Locations

- **Application logs**: `logs/app.log`
- **Error logs**: `logs/error.log`
- **Performance logs**: `logs/performance.log`
- **Access logs**: `logs/access.log`

## Common Issues

### Authentication Issues

#### Problem: Login fails with "Invalid credentials"

**Symptoms:**

- Login form shows error message
- User cannot authenticate
- Console shows 401 errors

**Solutions:**

1. **Check user exists in database:**

```sql
SELECT * FROM users WHERE email = 'user@example.com';
```

2. **Verify password hashing:**

```bash
# Check if password is properly hashed
yarn db:studio
# Navigate to users table and check password field
```

3. **Check Supabase configuration:**

```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

4. **Test with known good credentials:**

```bash
# Use test user
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

#### Problem: "Email not confirmed" error

**Solutions:**

1. **Check email confirmation status:**

```sql
SELECT email_confirmed_at FROM users WHERE email = 'user@example.com';
```

2. **Resend confirmation email:**

```bash
curl -X POST http://localhost:3000/api/auth/resend-confirmation \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

3. **Manually confirm email (development only):**

```sql
UPDATE users SET email_confirmed_at = NOW() WHERE email = 'user@example.com';
```

#### Problem: JWT token invalid or expired

**Solutions:**

1. **Check token expiration:**

```javascript
// Decode JWT token
const token = 'your-jwt-token';
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Expires:', new Date(payload.exp * 1000));
```

2. **Refresh token:**

```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <token>"
```

3. **Clear browser storage:**

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
```

### Navigation Issues

#### Problem: Navigation items not showing

**Symptoms:**

- Navigation bar is empty
- User cannot see menu items
- Console shows permission errors

**Solutions:**

1. **Check user permissions:**

```bash
curl -X GET http://localhost:3000/api/auth/permissions \
  -H "Authorization: Bearer <token>"
```

2. **Verify navigation configuration:**

```typescript
// Check src/lib/navigation-optimized.ts
const NAVIGATION_ITEMS = [
  // Verify items are properly configured
];
```

3. **Check permission mapping:**

```sql
SELECT * FROM permissions WHERE resource = 'players';
```

4. **Clear navigation cache:**

```javascript
// In browser console
localStorage.removeItem('navigation-cache');
```

#### Problem: Active page not highlighting

**Solutions:**

1. **Check current page detection:**

```javascript
// In browser console
console.log('Current path:', window.location.pathname);
console.log('Active page:', document.querySelector('[aria-current="page"]'));
```

2. **Verify navigation state:**

```bash
curl -X GET http://localhost:3000/api/navigation/state \
  -H "Authorization: Bearer <token>"
```

3. **Update navigation state:**

```bash
curl -X PUT http://localhost:3000/api/navigation/state \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"activePage":"/players"}'
```

### Theme Issues

#### Problem: Theme not switching

**Symptoms:**

- Theme toggle doesn't work
- Theme doesn't persist
- Console shows theme errors

**Solutions:**

1. **Check theme state:**

```javascript
// In browser console
console.log('Current theme:', document.documentElement.className);
console.log('Theme preference:', localStorage.getItem('mafia-insight-theme'));
```

2. **Verify theme configuration:**

```typescript
// Check src/lib/theme-optimized.ts
const themeManager = new OptimizedThemeManager({
  storageKey: 'mafia-insight-theme',
  enableSystemDetection: true,
});
```

3. **Clear theme cache:**

```javascript
// In browser console
localStorage.removeItem('mafia-insight-theme');
location.reload();
```

4. **Check CSS custom properties:**

```javascript
// In browser console
const root = document.documentElement;
console.log(
  'CSS variables:',
  getComputedStyle(root).getPropertyValue('--background')
);
```

#### Problem: Theme not persisting across sessions

**Solutions:**

1. **Check localStorage availability:**

```javascript
// In browser console
console.log('localStorage available:', typeof Storage !== 'undefined');
console.log('localStorage theme:', localStorage.getItem('mafia-insight-theme'));
```

2. **Verify theme saving:**

```typescript
// Check if theme is being saved
themeManager.setTheme('dark');
console.log('Theme saved:', localStorage.getItem('mafia-insight-theme'));
```

3. **Check browser storage settings:**

- Ensure cookies and local storage are enabled
- Check if browser is in private/incognito mode

### Performance Issues

#### Problem: Theme switching is slow (>500ms)

**Solutions:**

1. **Check performance metrics:**

```bash
curl http://localhost:3000/api/performance
```

2. **Profile theme switching:**

```javascript
// In browser console
console.time('theme-switch');
themeManager.setTheme('dark');
console.timeEnd('theme-switch');
```

3. **Check CSS custom properties:**

```css
/* Ensure smooth transitions */
* {
  transition:
    color 200ms ease,
    background-color 200ms ease;
}
```

4. **Optimize theme application:**

```typescript
// Use CSS custom properties for instant switching
const root = document.documentElement;
root.classList.remove('light', 'dark');
root.classList.add(newTheme);
```

#### Problem: Navigation updates are slow (>1s)

**Solutions:**

1. **Check navigation performance:**

```bash
curl http://localhost:3000/api/performance/navigation
```

2. **Profile navigation updates:**

```javascript
// In browser console
console.time('navigation-update');
navigationManager.updateVisibleItems(permissions, isAuthenticated);
console.timeEnd('navigation-update');
```

3. **Check permission caching:**

```typescript
// Verify permission cache is working
const cacheKey = navigationManager.getCacheKey(permissions, isAuthenticated);
console.log('Cache key:', cacheKey);
console.log('Cached items:', navigationManager.getCachedItems(cacheKey));
```

4. **Optimize permission filtering:**

```typescript
// Use efficient filtering algorithms
const visibleItems = items
  .filter((item) => !item.requiresAuth || isAuthenticated)
  .filter((item) =>
    item.requiredPermissions.every((permission) =>
      permissions.includes(permission)
    )
  );
```

### Database Issues

#### Problem: Database connection failed

**Solutions:**

1. **Check database status:**

```bash
# PostgreSQL
pg_isready -h localhost -p 5432

# Check connection string
echo $DATABASE_URL
```

2. **Test database connection:**

```bash
# Using psql
psql $DATABASE_URL -c "SELECT 1;"

# Using Prisma
yarn prisma db pull
```

3. **Check database permissions:**

```sql
-- Check user permissions
SELECT * FROM pg_user WHERE usename = 'mafia_user';

-- Check database access
SELECT * FROM pg_database WHERE datname = 'mafia_insight';
```

4. **Restart database service:**

```bash
# PostgreSQL
sudo systemctl restart postgresql

# Docker
docker-compose restart postgres
```

#### Problem: Migration failed

**Solutions:**

1. **Check migration status:**

```bash
yarn prisma migrate status
```

2. **Reset migrations (development only):**

```bash
yarn prisma migrate reset
```

3. **Apply specific migration:**

```bash
yarn prisma migrate resolve --applied migration_name
```

4. **Check migration files:**

```bash
ls -la prisma/migrations/
```

### Build Issues

#### Problem: Build fails with TypeScript errors

**Solutions:**

1. **Check TypeScript configuration:**

```bash
yarn type-check
```

2. **Fix type errors:**

```typescript
// Add proper type annotations
interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
}
```

3. **Update type definitions:**

```bash
yarn add -D @types/node @types/react @types/react-dom
```

4. **Clear TypeScript cache:**

```bash
rm -rf .next
rm -rf node_modules/.cache
yarn build
```

#### Problem: Build fails with dependency errors

**Solutions:**

1. **Check dependency versions:**

```bash
yarn list --depth=0
```

2. **Update dependencies:**

```bash
yarn upgrade
```

3. **Clear node_modules:**

```bash
rm -rf node_modules
rm yarn.lock
yarn install
```

4. **Check peer dependencies:**

```bash
yarn install --check-files
```

### Test Issues

#### Problem: Tests failing

**Solutions:**

1. **Run specific test:**

```bash
yarn test --grep "should login user"
```

2. **Check test environment:**

```bash
yarn test --reporter=verbose
```

3. **Update test data:**

```bash
yarn db:seed
```

4. **Check test coverage:**

```bash
yarn test:coverage
```

#### Problem: E2E tests failing

**Solutions:**

1. **Check Playwright installation:**

```bash
yarn playwright install
```

2. **Run tests in headed mode:**

```bash
yarn test:e2e --headed
```

3. **Check test environment:**

```bash
yarn test:e2e --config=playwright.quick.config.ts
```

4. **Update test fixtures:**

```typescript
// Check tests/e2e/fixtures/auth.ts
export const testUsers = {
  admin: { email: 'admin@test.com', password: 'password123' },
  user: { email: 'user@test.com', password: 'password123' },
};
```

## Debug Tools

### Browser DevTools

```javascript
// Enable debug mode
localStorage.setItem('debug', 'mafia-insight:*');

// Check performance metrics
performance.getEntriesByType('measure');

// Check memory usage
performance.memory;

// Check network requests
performance.getEntriesByType('navigation');
```

### Server Debug Mode

```bash
# Enable debug logging
DEBUG=mafia-insight:* yarn dev

# Enable specific debug namespaces
DEBUG=mafia-insight:auth,mafia-insight:navigation yarn dev
```

### Database Debug

```bash
# Enable query logging
DATABASE_DEBUG=true yarn dev

# Check slow queries
yarn prisma studio
```

## Performance Monitoring

### Real-time Monitoring

```bash
# Monitor performance metrics
curl -s http://localhost:3000/api/performance | jq

# Monitor theme switching
curl -s http://localhost:3000/api/performance/theme | jq

# Monitor navigation updates
curl -s http://localhost:3000/api/performance/navigation | jq
```

### Performance Dashboard

Access the performance dashboard at `/admin/performance` to view:

- Theme switching performance
- Navigation update performance
- Authentication completion time
- Component rendering time

## Getting Help

### Log Collection

When reporting issues, include:

1. **Error logs**: `logs/error.log`
2. **Performance logs**: `logs/performance.log`
3. **Browser console logs**
4. **Network requests** (from DevTools)
5. **Environment variables** (sanitized)

### Support Channels

- **GitHub Issues**: [github.com/mafia-insight/issues](https://github.com/mafia-insight/issues)
- **Email**: support@mafiainsight.com
- **Discord**: [discord.gg/mafia-insight](https://discord.gg/mafia-insight)

### Documentation

- **API Docs**: [docs.mafiainsight.com/api](https://docs.mafiainsight.com/api)
- **Component Docs**: [docs.mafiainsight.com/components](https://docs.mafiainsight.com/components)
- **Deployment Guide**: [docs.mafiainsight.com/deployment](https://docs.mafiainsight.com/deployment)
