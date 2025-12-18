# Handling Node.js Deprecation Warnings and Package Warnings

## DEP0169: `url.parse()` Deprecation Warning

### What is this warning?

The `DEP0169` deprecation warning indicates that `url.parse()` is deprecated in Node.js due to:

- Non-standardized behavior
- Security vulnerabilities
- Potential for errors

### Why is it appearing?

Since your codebase doesn't use `url.parse()` directly, this warning is coming from one of your dependencies (likely Next.js, Playwright, or another npm package).

### Solution Options

#### Option 1: Suppress the Warning (✅ Already Implemented)

The warning is already suppressed in `package.json` scripts:

```json
{
  "scripts": {
    "dev": "NODE_OPTIONS='--no-deprecation' next dev",
    "build": "NODE_OPTIONS='--no-deprecation' next build",
    "start": "NODE_OPTIONS='--no-deprecation' next start"
  }
}
```

#### Option 2: Update Dependencies

Check for updates to dependencies that might have fixed this:

```bash
yarn outdated
yarn upgrade
```

#### Option 3: Use WHATWG URL API (For your own code)

If you ever need to parse URLs in your code, use the WHATWG URL API instead:

```javascript
// ❌ Deprecated
const url = require('url');
const parsed = url.parse('https://example.com/path?query=string');

// ✅ Recommended
const parsed = new URL('https://example.com/path?query=string');
console.log(parsed.href); // Full URL
console.log(parsed.pathname); // /path
console.log(parsed.search); // ?query=string
console.log(parsed.searchParams.get('query')); // string
```

### Current Status

Your codebase already uses the WHATWG URL API correctly:

- ✅ `new URL()` constructor
- ✅ `URLSearchParams` for query parameters
- ✅ No direct usage of `url.parse()`

The warning is from a dependency and will be resolved when that dependency updates to use the WHATWG URL API.

## Package Warnings

### Unmet Peer Dependencies

#### ✅ Fixed: `react-is` (Required by `recharts`)

**Status:** Added to dependencies

```json
"react-is": "^19.2.0"
```

#### ✅ Fixed: `playwright-core` (Required by `@axe-core/playwright`)

**Status:** Added to devDependencies

```json
"playwright-core": "^1.56.1"
```

#### ⚠️ `webpack` (Required by `@sentry/webpack-plugin`)

**Status:** Not critical - Next.js uses Turbopack, not webpack

- This warning can be safely ignored as Next.js 16+ uses Turbopack by default
- The Sentry webpack plugin is only used if you explicitly configure webpack
- No action needed unless you're using custom webpack configuration

#### ⚠️ `hono` (Required by `@hono/node-server` in shadcn dependencies)

**Status:** Transitive dependency - not directly used

- This is a dependency of `shadcn` CLI tool, not your application code
- The warning can be safely ignored as it doesn't affect runtime
- If you need to suppress, you can add it to devDependencies, but it's not necessary

### Deprecated Package Warnings

These warnings come from transitive dependencies and cannot be directly fixed:

#### `@types/bcryptjs`

**Status:** ✅ Fixed - Removed from dependencies

- `bcryptjs` provides its own TypeScript definitions
- The `@types/bcryptjs` package is a stub and not needed

#### `glob@7.x` (Multiple packages)

**Status:** ⚠️ From transitive dependencies

- Affected packages: `next-swagger-doc`, `@vitest/coverage-v8`, `jest`
- These packages will need to update to `glob@9+` in future releases
- No action needed - monitor for updates

#### `inflight@1.0.6`

**Status:** ⚠️ From transitive dependencies (via old `glob` versions)

- Known memory leak issue
- Will be resolved when parent packages update `glob`
- No action needed

#### `lodash.get` and `lodash.isequal`

**Status:** ⚠️ From transitive dependencies

- Use native JavaScript alternatives:
  - `lodash.get` → Optional chaining (`?.`)
  - `lodash.isequal` → `require('node:util').isDeepStrictEqual`
- Will be resolved when parent packages update
- No action needed

#### `domexception` and `abab`

**Status:** ⚠️ From `jest-environment-jsdom` and `jsdom`

- Use platform-native alternatives:
  - `domexception` → Native `DOMException`
  - `abab` → Native `atob()` and `btoa()`
- Will be resolved when `jsdom` updates
- No action needed

### Engine Warnings

#### Invalid Engine Warnings

**Status:** ⚠️ Informational only

- Warnings about `pnpm`, `bun`, `deno`, `bare` engines are informational
- These packages support multiple runtimes
- No action needed - you're using Yarn, which is supported

### Workspace Warnings

#### "Workspaces can only be enabled in private projects"

**Status:** ⚠️ Informational

- Your `package.json` already has `"private": true`
- This warning may appear if Yarn detects workspace-like patterns
- No action needed - your project is correctly configured

## Summary of Actions Taken

1. ✅ Suppressed DEP0169 warnings in all npm scripts
2. ✅ Removed `@types/bcryptjs` (redundant)
3. ✅ Added `react-is` peer dependency
4. ✅ Added `playwright-core` peer dependency
5. ✅ Documented all warnings and their status

## References

- [Node.js Deprecations Documentation](https://nodejs.org/api/deprecations.html#DEP0169)
- [WHATWG URL API Documentation](https://nodejs.org/api/url.html#the-whatwg-url-api)
- [Next.js URL Deprecation Guide](https://nextjs.org/docs/messages/url-deprecated)
- [Yarn Peer Dependencies](https://classic.yarnpkg.com/en/docs/dependency-types/#toc-peerdependencies)
