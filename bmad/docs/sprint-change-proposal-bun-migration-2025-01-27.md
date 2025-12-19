# Sprint Change Proposal: Node.js to Bun Migration + Tailwind Variants Setup

**Date**: 2025-01-27  
**Project**: mafia-insight  
**Change Trigger**: User request to migrate from Node.js to Bun runtime and ensure tailwind-variants is properly configured  
**Workflow**: correct-course  
**Status**: Draft

---

## 1. Issue Summary

### Problem Statement

The project currently uses Node.js (>=25.1.0) as the runtime environment, but the user wants to migrate to Bun for improved performance, faster package installation, and a more modern development experience. Additionally, while `tailwind-variants` is already installed (v3.2.2), we need to ensure it's properly configured and utilized throughout the project.

### Context

This change was identified during a technology stack review where the user requested:

1. **Runtime Migration**: Migrate from Node.js to Bun runtime
   - Faster package installation and execution
   - Better TypeScript support out of the box
   - Improved performance for development workflows
   - Native bundler, test runner, and package manager integration

2. **Tailwind Variants Setup**: Ensure tailwind-variants is properly configured
   - Already installed (v3.2.2) - verify configuration
   - Ensure proper integration with existing components
   - Update documentation and examples

### Evidence

- `package.json` specifies `"engines": { "node": ">=25.1.0" }`
- Scripts use `NODE_OPTIONS` environment variables
- README.md references Node.js 18+ and Yarn as prerequisites
- `tailwind-variants` is already in dependencies (v3.2.2)
- Previous sprint change proposal (2025-01-27) shows components were migrated to tailwind-variants

---

## 2. Impact Analysis

### Epic Impact

**All Epics** (Status: Various - backlog, contexted, in-progress)

- **Impact**: Low-Medium
- **Rationale**: Runtime migration affects development environment and build processes, not application functionality
- **Stories Affected**: None directly - this is an infrastructure change
- **Note**: All epics will benefit from faster development cycles with Bun

### Story Impact

**No current stories in progress** - This is a development environment change that doesn't affect story functionality.

**Future Stories**: All future development will use Bun runtime, providing:

- Faster package installation
- Improved development server startup times
- Better TypeScript performance
- Native test runner capabilities

### Artifact Conflicts

**README.md** (`README.md`)

- **Status**: ⚠️ Needs Update
- **Action Required**: Update prerequisites and installation instructions
- **Changes Needed**:
  - Replace "Node.js 18+" with "Bun latest"
  - Replace "Yarn package manager" with "Bun (includes package manager)"
  - Update installation commands from `yarn install` to `bun install`
  - Update script references from `yarn` to `bun`

**Technology Stack Documentation** (`bmad/docs/technology-stack.md`)

- **Status**: ⚠️ Needs Update
- **Action Required**: Update runtime environment section
- **Changes Needed**:
  - Update "Runtime Environment" section
  - Change "Node.js: >=25.1.0" to "Bun: latest"
  - Change "Package Manager: Yarn" to "Package Manager: Bun (built-in)"
  - Update technology stack table

**package.json**

- **Status**: ⚠️ Needs Update
- **Action Required**: Multiple changes required
- **Changes Needed**:
  - Update `engines` field from Node.js to Bun
  - Update all scripts to use `bun --bun` prefix for Next.js commands
  - Remove `NODE_OPTIONS` environment variables (not needed with Bun)
  - Update script commands from `npm run` to `bun run` where applicable

**CI/CD Configuration** (if present)

- **Status**: ⚠️ Needs Review
- **Action Required**: Update GitHub Actions or other CI/CD workflows
- **Changes Needed**:
  - Replace Node.js setup actions with Bun setup
  - Update cache keys for Bun
  - Update test commands

**Documentation Files**

- **Status**: ⚠️ Needs Review
- **Action Required**: Scan and update all documentation referencing Node.js/Yarn
- **Files to Review**:
  - `docs/deployment/*.md`
  - `docs/technical/*.md`
  - `specs/**/*.md`
  - Any setup or installation guides

### Technical Impact

**Dependencies**

- ✅ `tailwind-variants` already installed (v3.2.2)
- ✅ All existing dependencies are compatible with Bun
- ✅ Next.js 16.0.0 fully supports Bun runtime
- ✅ Prisma works with Bun
- ✅ Vitest works with Bun
- ✅ Playwright works with Bun

**Code Changes**

**package.json Scripts**:

- **OLD**:

  ```json
  {
    "engines": {
      "node": ">=25.1.0"
    },
    "scripts": {
      "dev": "NODE_OPTIONS='--no-deprecation' next dev",
      "build": "NODE_OPTIONS='--no-deprecation' next build",
      "start": "NODE_OPTIONS='--no-deprecation' next start"
    }
  }
  ```

- **NEW**:
  ```json
  {
    "engines": {
      "bun": ">=1.0.0"
    },
    "scripts": {
      "dev": "bun --bun next dev",
      "build": "bun --bun next build",
      "start": "bun --bun next start"
    }
  }
  ```

**Lock File Migration**:

- Remove `yarn.lock` (if present)
- Generate `bun.lockb` via `bun install`
- Update `.gitignore` if needed

**Environment Variables**:

- Remove `NODE_OPTIONS='--no-deprecation'` from scripts (not needed with Bun)
- Bun handles deprecation warnings differently

**Testing Impact**

- **Unit Tests**: No changes needed - Vitest works with Bun
- **Integration Tests**: No changes needed
- **E2E Tests**: No changes needed - Playwright works with Bun
- **Test Scripts**: May need minor updates to use `bun` instead of `npm run`

**Performance Impact**

- **Package Installation**: Significantly faster with Bun
- **Development Server**: Faster startup times
- **Build Times**: Potentially faster with Bun's native bundler
- **Test Execution**: Faster with Bun's native test runner (if we migrate from Vitest)

**Deployment Impact**

- **Vercel**: Supports Bun runtime (may need configuration update)
- **Docker**: Need to update base image from Node.js to Bun
- **CI/CD**: Need to update build steps

---

## 3. Recommended Approach

### Chosen Path: Direct Adjustment

**Rationale**:

- This is an infrastructure improvement that enhances developer experience
- All affected work is in backlog or completed, so no in-progress work is disrupted
- Changes are largely configuration updates, not code changes
- Low risk - Bun is highly compatible with Node.js ecosystem
- High value - faster development cycles and better tooling

### Implementation Strategy

**Phase 1: Bun Installation & Configuration** ✅ Ready to Start

1. Install Bun (if not already installed)
2. Update `package.json`:
   - Change `engines` field
   - Update scripts to use `bun --bun`
   - Remove `NODE_OPTIONS` environment variables
3. Migrate lock file:
   - Remove `yarn.lock` (if present)
   - Run `bun install` to generate `bun.lockb`
4. Test basic commands:
   - `bun run dev`
   - `bun run build`
   - `bun run test`

**Phase 2: Tailwind Variants Verification** ✅ Ready to Start

1. Verify `tailwind-variants` installation (already v3.2.2)
2. Check component usage:
   - Verify components migrated in previous sprint are using tailwind-variants correctly
   - Ensure `tv` function is imported from `tailwind-variants`
   - Verify `tailwind-merge` integration
3. Update VSCode settings (if needed):
   - Ensure IntelliSense is configured for tailwind-variants
4. Document usage patterns

**Phase 3: Documentation Updates** ✅ Ready to Start

1. Update `README.md`:
   - Prerequisites section
   - Installation instructions
   - Script commands
2. Update `bmad/docs/technology-stack.md`:
   - Runtime environment
   - Package manager
   - Technology stack table
3. Scan and update other documentation files
4. Update any setup scripts or guides

**Phase 4: CI/CD & Deployment** ✅ Ready to Start

1. Update GitHub Actions workflows (if present):
   - Replace Node.js setup with Bun setup
   - Update cache keys
   - Update test commands
2. Update Vercel configuration (if needed):
   - Ensure Bun runtime is selected
3. Update Docker configuration (if present):
   - Change base image to Bun
4. Test deployment pipeline

**Phase 5: Cleanup** ✅ Ready to Start

1. Remove `yarn.lock` (if present)
2. Remove any Node.js-specific configuration files (if any)
3. Update `.gitignore` if needed
4. Remove `NODE_OPTIONS` references

### Effort Estimate

- **Phase 1**: 1-2 hours (Bun installation and package.json updates)
- **Phase 2**: 30 minutes (tailwind-variants verification)
- **Phase 3**: 2-3 hours (documentation updates)
- **Phase 4**: 1-2 hours (CI/CD updates)
- **Phase 5**: 30 minutes (cleanup)
- **Total**: 5-8 hours

### Risk Assessment

**Low Risk** ✅

- Bun is highly compatible with Node.js ecosystem
- Next.js officially supports Bun
- All dependencies are compatible
- Easy to rollback if needed (can keep both runtimes temporarily)
- No breaking changes to application code

**Potential Issues**:

- Some npm packages might have Node.js-specific code (rare)
- CI/CD pipelines need updates
- Team needs to install Bun locally
- Documentation needs comprehensive updates

### Timeline Impact

**No Sprint Impact**: This is an infrastructure change that doesn't affect current sprint work. All stories can continue as normal.

**Future Benefits**:

- Faster package installation
- Faster development server startup
- Better TypeScript performance
- Improved developer experience

---

## 4. Detailed Change Proposals

### package.json Updates

**File**: `package.json`

**OLD**:

```json
{
  "engines": {
    "node": ">=25.1.0"
  },
  "scripts": {
    "dev": "NODE_OPTIONS='--no-deprecation' next dev",
    "build": "NODE_OPTIONS='--no-deprecation' next build",
    "start": "NODE_OPTIONS='--no-deprecation' next start",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:component && npm run test:e2e"
  }
}
```

**NEW**:

```json
{
  "engines": {
    "bun": ">=1.0.0"
  },
  "scripts": {
    "dev": "bun --bun next dev",
    "build": "bun --bun next build",
    "start": "bun --bun next start",
    "test:all": "bun run test:unit && bun run test:integration && bun run test:component && bun run test:e2e"
  }
}
```

**Rationale**:

- Bun runtime provides better performance and native TypeScript support
- `--bun` flag ensures Next.js runs within Bun runtime
- Remove `NODE_OPTIONS` as Bun handles this differently
- Update script references to use `bun run` for consistency

### README.md Updates

**File**: `README.md`

**Section: Prerequisites**

**OLD**:

```markdown
### Prerequisites

- Node.js 18+
- Yarn package manager
- PostgreSQL database
- Redis server
```

**NEW**:

```markdown
### Prerequisites

- Bun (latest version) - [Installation Guide](https://bun.sh/docs/installation)
- PostgreSQL database
- Redis server
```

**Section: Installation**

**OLD**:

````markdown
2. **Install dependencies**

   ```bash
   yarn install
   ```
````

````

**NEW**:
```markdown
2. **Install dependencies**

   ```bash
   bun install
````

````

**Section: Database Setup**

**OLD**:
```markdown
   ```bash
   # Generate Prisma client
   yarn db:generate

   # Run database migrations
   yarn db:migrate

   # Seed the database (optional)
   yarn db:seed
````

````

**NEW**:
```markdown
   ```bash
   # Generate Prisma client
   bun run db:generate

   # Run database migrations
   bun run db:migrate

   # Seed the database (optional)
   bun run db:seed
````

````

**Rationale**: Update all references to use Bun instead of Node.js/Yarn

### Technology Stack Documentation

**File**: `bmad/docs/technology-stack.md`

**Section: Runtime Environment**

**OLD**:
```markdown
## Runtime Environment

- **Node.js**: >=25.1.0
- **Package Manager**: Yarn
- **Module System**: ES Modules (type: "module")
````

**NEW**:

```markdown
## Runtime Environment

- **Bun**: >=1.0.0 (JavaScript/TypeScript runtime, bundler, test runner, and package manager)
- **Package Manager**: Bun (built-in)
- **Module System**: ES Modules (type: "module")
```

**Technology Stack Table**

**OLD**:
| Category | Technology | Version | Purpose |
| ------------ | -------------------- | ------- | -------------------------- |
| Runtime | Node.js | >=25.1.0| JavaScript runtime |

**NEW**:
| Category | Technology | Version | Purpose |
| ------------ | -------------------- | ------- | -------------------------- |
| Runtime | Bun | >=1.0.0 | JavaScript/TypeScript runtime, bundler, test runner, package manager |

**Rationale**: Accurately reflect the technology stack using Bun

### Tailwind Variants Verification

**File**: `src/components/ui/*.tsx` (components using tailwind-variants)

**Verification Checklist**:

1. ✅ Verify `tailwind-variants` is imported correctly:

   ```typescript
   import { tv, type VariantProps } from 'tailwind-variants';
   ```

2. ✅ Verify `tailwind-merge` integration:

   ```typescript
   import { cn } from '@/lib/utils'; // Should use tailwind-merge
   ```

3. ✅ Verify components use `tv()` function:

   ```typescript
   const buttonVariants = tv({
     base: '...',
     variants: { ... }
   });
   ```

4. ✅ Check VSCode settings for IntelliSense:
   ```json
   {
     "tailwindCSS.classFunctions": ["tv"]
   }
   ```

**Rationale**: Ensure tailwind-variants is properly configured and utilized

### Lock File Migration

**Action**: Remove `yarn.lock` and generate `bun.lockb`

**Commands**:

```bash
# Remove yarn lock file
rm yarn.lock

# Install dependencies with Bun (generates bun.lockb)
bun install
```

**Rationale**: Bun uses its own lock file format (`bun.lockb`)

### .gitignore Updates

**File**: `.gitignore`

**Verification**: Ensure `bun.lockb` is NOT ignored (it should be committed)

**Rationale**: Bun lock files should be committed to ensure consistent installs

---

## 5. Implementation Handoff

### Change Scope Classification

**Minor** ✅

This change can be implemented directly by the development team. It's an infrastructure improvement that:

- Doesn't require backlog reorganization
- Doesn't affect in-progress stories
- Is backward compatible (can run both runtimes during transition)
- Has low risk

### Handoff Recipients

**Development Team**

- **Responsibility**: Execute all 5 phases of implementation
- **Deliverables**:
  1. Updated `package.json` with Bun configuration
  2. Migrated lock file (`bun.lockb`)
  3. Updated documentation (README.md, technology-stack.md, etc.)
  4. Updated CI/CD workflows (if applicable)
  5. Verified tailwind-variants configuration
  6. Removed Node.js-specific files and references

### Sprint Status Update

**Status**: ⏳ To be updated in `sprint-status.yaml` after implementation

- Add entry: `bun-migration: in-progress` → `done`
- Add entry: `tailwind-variants-verification: done`

### Success Criteria

1. ✅ Bun installed and working locally
2. ✅ `package.json` updated with Bun engine and scripts
3. ✅ `bun.lockb` generated and committed
4. ✅ All scripts work with `bun run` command
5. ✅ Development server starts with `bun run dev`
6. ✅ Build succeeds with `bun run build`
7. ✅ All tests pass with Bun runtime
8. ✅ README.md updated with Bun instructions
9. ✅ Technology stack documentation updated
10. ✅ Tailwind-variants verified and properly configured
11. ✅ CI/CD pipelines updated (if applicable)
12. ✅ No breaking changes to application functionality

### Next Steps

1. **Install Bun** (if not already installed)

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Update package.json**
   - Change engines field
   - Update scripts to use `bun --bun`
   - Remove `NODE_OPTIONS` environment variables

3. **Migrate Lock File**

   ```bash
   rm yarn.lock  # if present
   bun install   # generates bun.lockb
   ```

4. **Test Basic Functionality**

   ```bash
   bun run dev      # Start dev server
   bun run build    # Test build
   bun run test     # Run tests
   ```

5. **Update Documentation**
   - README.md
   - bmad/docs/technology-stack.md
   - Any other relevant docs

6. **Verify Tailwind Variants**
   - Check component imports
   - Verify VSCode IntelliSense
   - Test component rendering

7. **Update CI/CD** (if applicable)
   - GitHub Actions workflows
   - Vercel configuration
   - Docker files

8. **Cleanup**
   - Remove yarn.lock
   - Remove Node.js-specific configs
   - Update .gitignore if needed

---

## 6. Approval

**Status**: Pending Approval

**Change Impact Summary**:

- ✅ Runtime migration from Node.js to Bun
- ✅ Package manager migration from Yarn to Bun
- ✅ Script updates for Bun runtime
- ✅ Documentation updates across multiple files
- ✅ Tailwind-variants verification (already installed)
- **Risk**: Low
- **Effort**: 5-8 hours
- **Timeline Impact**: None (infrastructure change, no story impact)

**Recommendation**: ✅ **APPROVE** - This is a low-risk, high-value infrastructure improvement that enhances developer experience without affecting current sprint work or application functionality. Bun provides significant performance improvements and better tooling integration.

---

**Generated by**: BMAD correct-course workflow  
**Workflow Version**: 4-implementation/correct-course  
**Date**: 2025-01-27  
**Agent**: PM (Product Manager)
