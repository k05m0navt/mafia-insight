# mafia-insight - Epic Breakdown

**Author:** k05m0navt
**Date:** 2025-01-27
**Project Level:** MVP
**Target Scale:** Growth

---

## Overview

This document provides the complete epic and story breakdown for mafia-insight, decomposing the requirements from the [PRD](./prd.md) into implementable stories.

**Living Document Notice:** This is the initial version. It will be updated after UX Design and Architecture workflows add interaction and technical details to stories.

---

## Functional Requirements Inventory

This inventory lists all functional requirements from the PRD to ensure complete coverage in the epic breakdown.

### User Account & Access

- **FR1**: Users can create accounts with email or social authentication
- **FR2**: Users can log in securely and maintain sessions across devices
- **FR3**: Users can reset passwords via email verification
- **FR4**: Users can update profile information and preferences
- **FR5**: Administrators can manage user roles and permissions
- **FR6**: Users can access the platform as guests with limited functionality

### Data Import & Synchronization

- **FR7**: System can import historical game data from gomafia.pro
- **FR8**: System can synchronize data automatically on a scheduled basis
- **FR9**: Users can manually trigger data import/synchronization
- **FR10**: System validates imported data quality with ≥98% accuracy threshold
- **FR11**: System handles import errors gracefully with retry mechanisms
- **FR12**: Users can view import progress in real-time
- **FR13**: System can resume interrupted imports from last checkpoint
- **FR14**: System prevents concurrent imports across multiple instances
- **FR15**: System verifies referential integrity of imported relationships

### Player Analytics

- **FR16**: Players can view role-based performance metrics (Don, Mafia, Sheriff, Citizen)
- **FR17**: Players can view ELO rating with historical trends and progression
- **FR18**: Players can analyze win rates across different roles and scenarios
- **FR19**: Players can view basic performance statistics and summaries
- **FR20**: Players can filter analytics by date range
- **FR21**: Players can filter analytics by role (Don, Mafia, Sheriff, Citizen)
- **FR22**: Players can view performance trends over time
- **FR23**: Players can compare performance across different roles

### Judge Analytics (Killer Feature)

- **FR24**: Judges can view complete tournament history
- **FR25**: Judges can view games judged per month statistics
- **FR26**: Judges can track earnings and trends over time
- **FR27**: Judges can view judge performance metrics
- **FR28**: Judges can filter judge analytics by date range
- **FR29**: Judges can view judge analytics trends and patterns

### Timeline Visualization

- **FR30**: Users can view complete game history in an interactive timeline
- **FR31**: Users can filter timeline by date range
- **FR32**: Users can filter timeline by role
- **FR33**: Users can filter timeline by game outcome (win/loss)
- **FR34**: Timeline displays visual representation of performance over time
- **FR35**: Timeline is responsive and works on mobile devices
- **FR36**: Users can interact with timeline elements to view game details

### Club Analytics (Post-MVP)

- **FR37**: Clubs can view member statistics and performance tracking
- **FR38**: Clubs can compare team performance
- **FR39**: Clubs can view club rankings
- **FR40**: Clubs can view engagement metrics
- **FR41**: Club administrators can manage club members
- **FR42**: Clubs can view club-level analytics dashboards

### Data Display & Navigation

- **FR43**: Users can navigate between different analytics sections with smooth animations and impressive layouts
- **FR44**: Users can access analytics from mobile devices via PWA with beautiful, modern interface
- **FR45**: Users can access previously loaded data offline (PWA)
- **FR46**: System displays data in responsive tables and charts with rich visualizations, high-quality images, and engaging animations
- **FR47**: Users can search for specific players or games with visual feedback and smooth interactions
- **FR48**: Users can view detailed information for individual games with impressive layouts and visual storytelling

### Visual Design & User Experience

- **FR59**: Interface uses modern, enticing, beautiful design (not minimalistic) with rich visual elements
- **FR60**: System displays high-quality images and visual assets that enhance the analytics experience
- **FR61**: Interface includes smooth, polished animations and transitions throughout user interactions
- **FR62**: System uses carefully curated color palettes that create visual interest while maintaining readability
- **FR63**: Interface includes comprehensive, beautiful iconography that enhances understanding and navigation
- **FR64**: Layouts are impressive and thoughtfully designed to showcase data in visually compelling ways
- **FR65**: Navigation system is visually appealing and intuitive with engaging visual feedback
- **FR66**: Interactive elements include delightful micro-interactions and animations that guide user attention

### Advanced Features (Post-MVP)

- **FR49**: Users can create custom dashboards (Post-MVP)
- **FR50**: Users can export analytics data in PDF format (Post-MVP)
- **FR51**: Users can export analytics data as images (Post-MVP)
- **FR52**: Users can share analytics via social media (VK, Telegram) (Post-MVP)
- **FR53**: Users can compare performance with other players (Post-MVP)
- **FR54**: System can provide AI-powered insights and recommendations (Post-MVP)
- **FR55**: System can predict future performance trends (Post-MVP)

### Gamification (Post-MVP)

- **FR56**: Users can earn achievements based on performance milestones (Post-MVP)
- **FR57**: Users can view leaderboards (Post-MVP)
- **FR58**: System can organize competitions and seasons (Post-MVP)

**Total Functional Requirements: 66**

---

## Epic Structure Summary

The epic breakdown is organized around delivering incremental user value, ensuring each epic results in something users can actually use or benefit from.

### Epic 1: User Access & Platform Foundation

**Goal:** Users can register, log in, and access the platform with a modern, beautiful interface foundation.

**User Value:** Foundation for all subsequent features. Users can authenticate and access the platform with impressive visual design.

**Scope:**

- User authentication (email, social login)
- User profiles and preferences
- Guest access capabilities
- Admin role management
- Visual design system foundation (modern, enticing, beautiful design with animations)

**FRs Covered:** FR1-FR6, FR59-FR66

### Epic 2: Data Import & Synchronization

**Goal:** System can reliably import and synchronize game data from gomafia.pro with quality validation.

**User Value:** Users' game data is available in the platform. Essential foundation for all analytics features.

**Scope:**

- Historical data import from gomafia.pro
- Automatic and manual synchronization
- Data quality validation (≥98% threshold)
- Error handling and retry mechanisms
- Real-time import progress tracking
- Checkpoint/resume capability
- Concurrent import prevention
- Referential integrity verification

**FRs Covered:** FR7-FR15

### Epic 3: Player Analytics Dashboard

**Goal:** Players can view comprehensive role-based performance analytics and insights.

**User Value:** Players understand their performance patterns, identify strengths and weaknesses across roles, and track improvement over time.

**Scope:**

- Role-based performance metrics (Don, Mafia, Sheriff, Citizen)
- ELO rating with historical trends
- Win rate analysis across roles and scenarios
- Performance statistics and summaries
- Date range and role filtering
- Performance trends over time
- Role comparison capabilities
- Navigation and data display components
- Responsive, mobile-optimized layouts

**FRs Covered:** FR16-FR23, FR43-FR48

### Epic 4: Timeline Visualization

**Goal:** Users can view their complete game history in an interactive, visual timeline.

**User Value:** Users can explore their complete game history visually, identify patterns, and understand performance evolution over time. Creates the WOW moment.

**Scope:**

- Interactive timeline showing complete game history
- Visual representation of performance over time
- Filtering by date range, role, and game outcome
- Mobile-responsive timeline design
- Interactive timeline elements with game details
- Smooth animations and transitions

**FRs Covered:** FR30-FR36

### Epic 5: Judge Analytics Dashboard

**Goal:** Judges can track their professional activity, tournament history, earnings, and performance metrics.

**User Value:** Judges can track their professional activity—unique capability not available elsewhere. This is the killer feature serving the highest-value user segment.

**Scope:**

- Complete tournament history tracking
- Games judged per month statistics
- Earnings tracking and trends over time
- Judge performance metrics
- Date range filtering for judge analytics
- Trends and patterns visualization

**FRs Covered:** FR24-FR29

---

## FR Coverage Map

This map ensures every functional requirement from the PRD is covered by at least one epic.

### Epic 1: User Access & Platform Foundation

- **FR1**: Users can create accounts with email or social authentication
- **FR2**: Users can log in securely and maintain sessions across devices
- **FR3**: Users can reset passwords via email verification
- **FR4**: Users can update profile information and preferences
- **FR5**: Administrators can manage user roles and permissions
- **FR6**: Users can access the platform as guests with limited functionality
- **FR59**: Interface uses modern, enticing, beautiful design (not minimalistic) with rich visual elements
- **FR60**: System displays high-quality images and visual assets that enhance the analytics experience
- **FR61**: Interface includes smooth, polished animations and transitions throughout user interactions
- **FR62**: System uses carefully curated color palettes that create visual interest while maintaining readability
- **FR63**: Interface includes comprehensive, beautiful iconography that enhances understanding and navigation
- **FR64**: Layouts are impressive and thoughtfully designed to showcase data in visually compelling ways
- **FR65**: Navigation system is visually appealing and intuitive with engaging visual feedback
- **FR66**: Interactive elements include delightful micro-interactions and animations that guide user attention

**Coverage:** 14 FRs

### Epic 2: Data Import & Synchronization

- **FR7**: System can import historical game data from gomafia.pro
- **FR8**: System can synchronize data automatically on a scheduled basis
- **FR9**: Users can manually trigger data import/synchronization
- **FR10**: System validates imported data quality with ≥98% accuracy threshold
- **FR11**: System handles import errors gracefully with retry mechanisms
- **FR12**: Users can view import progress in real-time
- **FR13**: System can resume interrupted imports from last checkpoint
- **FR14**: System prevents concurrent imports across multiple instances
- **FR15**: System verifies referential integrity of imported relationships

**Coverage:** 9 FRs

### Epic 3: Player Analytics Dashboard

- **FR16**: Players can view role-based performance metrics (Don, Mafia, Sheriff, Citizen)
- **FR17**: Players can view ELO rating with historical trends and progression
- **FR18**: Players can analyze win rates across different roles and scenarios
- **FR19**: Players can view basic performance statistics and summaries
- **FR20**: Players can filter analytics by date range
- **FR21**: Players can filter analytics by role (Don, Mafia, Sheriff, Citizen)
- **FR22**: Players can view performance trends over time
- **FR23**: Players can compare performance across different roles
- **FR43**: Users can navigate between different analytics sections with smooth animations and impressive layouts
- **FR44**: Users can access analytics from mobile devices via PWA with beautiful, modern interface
- **FR45**: Users can access previously loaded data offline (PWA)
- **FR46**: System displays data in responsive tables and charts with rich visualizations, high-quality images, and engaging animations
- **FR47**: Users can search for specific players or games with visual feedback and smooth interactions
- **FR48**: Users can view detailed information for individual games with impressive layouts and visual storytelling

**Coverage:** 14 FRs

### Epic 4: Timeline Visualization

- **FR30**: Users can view complete game history in an interactive timeline
- **FR31**: Users can filter timeline by date range
- **FR32**: Users can filter timeline by role
- **FR33**: Users can filter timeline by game outcome (win/loss)
- **FR34**: Timeline displays visual representation of performance over time
- **FR35**: Timeline is responsive and works on mobile devices
- **FR36**: Users can interact with timeline elements to view game details

**Coverage:** 7 FRs

### Epic 5: Judge Analytics Dashboard

- **FR24**: Judges can view complete tournament history
- **FR25**: Judges can view games judged per month statistics
- **FR26**: Judges can track earnings and trends over time
- **FR27**: Judges can view judge performance metrics
- **FR28**: Judges can filter judge analytics by date range
- **FR29**: Judges can view judge analytics trends and patterns

**Coverage:** 6 FRs

### Post-MVP Features (Not in MVP Scope)

The following FRs are deferred to post-MVP phases:

- **Club Analytics (FR37-FR42)**: 6 FRs
- **Advanced Features (FR49-FR55)**: 7 FRs
- **Gamification (FR56-FR58)**: 3 FRs

**Total MVP Coverage:** 50 FRs out of 66 total FRs

---

<!-- Epic and Story Breakdown Section -->

## Epic 1: User Access & Platform Foundation

**Goal:** Users can register, log in, and access the platform with a modern, beautiful interface foundation.

**User Value:** Foundation for all subsequent features. Users can authenticate and access the platform with impressive visual design.

**FRs Covered:** FR1-FR6, FR59-FR66

---

### Story 1.1: Visual Design System Foundation

As a **user**,  
I want **the platform to have a modern, enticing, beautiful visual design system**,  
So that **the interface is visually appealing and creates an impressive first impression**.

**Acceptance Criteria:**

**Given** the platform is accessed for the first time  
**When** a user views any page  
**Then** the interface displays with:

- Rich, carefully curated color palette (Competitive Data theme: Deep Indigo #4f46e5 primary, Cyan #06b6d4 secondary, Purple #8b5cf6 accent)
- High-quality images and visual assets that enhance the analytics experience
- Comprehensive, beautiful iconography using Lucide React icons
- Impressive, thoughtfully designed layouts
- Smooth, polished animations and transitions on interactive elements
- WCAG 2.1 Level AA compliant color contrast ratios (4.5:1 minimum for text)
- Responsive design that adapts beautifully across screen sizes (mobile-first: 320px, 768px, 1024px, 1440px breakpoints)

**And** all visual elements use the established design tokens from the UX Design Specification

**Prerequisites:** None (foundational story)

**Technical Notes:**

- Implement ShadCN/UI component system with New York style
- Configure Tailwind CSS with custom theme matching UX Design Specification color tokens
- Set up CSS variables for theming (light/dark mode support)
- Ensure all colors meet WCAG accessibility standards
- Reference: UX Design Specification sections 1.1, 3.1 (Color System), 3.2 (Typography)

---

### Story 1.2: Email Authentication - User Registration

As a **new user**,  
I want **to create an account using my email address**,  
So that **I can access personalized analytics and save my preferences**.

**Acceptance Criteria:**

**Given** I am on the registration page  
**When** I enter a valid email address and password that meets requirements  
**Then** the system:

- Validates email format using RFC 5322 standard
- Validates password meets requirements: minimum 8 characters, at least 1 uppercase letter, 1 number, 1 special character
- Displays password strength meter with visual feedback (weak/medium/strong indicators)
- Shows real-time validation feedback for each field
- Displays loading state during account creation (spinner overlay or button loading state)
- Creates the account successfully and sends email verification
- Redirects to email verification prompt page
- Stores password securely using industry-standard hashing (bcrypt with salt rounds ≥10)

**And** if validation fails:

- Error messages appear below the relevant field (red, 14px font size)
- Error messages are clear and actionable
- Fields remain focused for correction

**Prerequisites:** Story 1.1 (Visual Design System Foundation)

**Technical Notes:**

- Use NextAuth.js for authentication handling
- Implement email validation using Zod schema (RFC 5322 regex pattern)
- Password hashing via Supabase Auth or NextAuth.js with bcrypt
- Email verification flow: generate secure token, send email via SMTP/email service, verify token on confirmation link click
- Form component: ShadCN/UI form components with react-hook-form
- Reference: Architecture document (Authentication section), UX Design Specification (Form patterns)

---

### Story 1.3: Email Authentication - User Login

As a **registered user**,  
I want **to log in securely using my email and password**,  
So that **I can access my personalized analytics dashboard**.

**Acceptance Criteria:**

**Given** I am on the login page  
**When** I enter valid credentials and submit  
**Then** the system:

- Authenticates credentials against stored user data
- Creates secure session with JWT token (expires 7 days) and refresh token (expires 30 days)
- Maintains session across browser tabs and devices
- Redirects to dashboard with smooth fade transition animation
- Displays success feedback (brief toast notification or visual confirmation)

**And** if credentials are invalid:

- Displays error message below the form: "Invalid email or password" (red, 14px)
- Prevents account enumeration (same error message for invalid email vs invalid password)
- Implements rate limiting: maximum 5 login attempts per hour per IP address
- Logs failed login attempts to security_events table for monitoring

**And** the login form includes:

- Email field with email input type and autocomplete="email"
- Password field with password input type, visibility toggle button, and autocomplete="current-password"
- "Remember me" checkbox (extends session duration)
- "Forgot password?" link to password reset flow
- Loading state during authentication (button disabled, spinner shown)

**Prerequisites:** Story 1.2 (Email Authentication - User Registration)

**Technical Notes:**

- NextAuth.js session management with secure cookie storage
- Session strategy: JWT with refresh token rotation
- Rate limiting via Redis or middleware (5 attempts/hour/IP)
- Security logging for audit trail
- API endpoint: POST /api/auth/login (validates credentials, returns session)
- Reference: Architecture document (Authentication & Authorization section)

---

### Story 1.4: Social Authentication (OAuth)

As a **new or existing user**,  
I want **to sign in using my social media account (Google, GitHub, etc.)**,  
So that **I can access the platform quickly without creating a separate password**.

**Acceptance Criteria:**

**Given** I am on the registration or login page  
**When** I click a social authentication button (e.g., "Sign in with Google")  
**Then** the system:

- Redirects to OAuth provider authorization page
- Requests minimum necessary permissions (email, profile)
- After user authorizes, receives OAuth callback with authorization code
- Exchanges code for access token and user profile information
- Creates account if email doesn't exist, or links to existing account if email matches
- Creates secure session and redirects to dashboard
- Handles OAuth provider errors gracefully with user-friendly error messages

**And** the social authentication buttons:

- Display provider icons (Google logo, GitHub logo, etc.)
- Have consistent styling matching the design system
- Show loading state during OAuth flow
- Are accessible via keyboard navigation

**Prerequisites:** Story 1.1 (Visual Design System Foundation)

**Technical Notes:**

- NextAuth.js OAuth providers configuration
- Supported providers: Google (required), GitHub (optional), others as needed
- OAuth flow: Authorization Code flow with PKCE for security
- Account linking: Match by email address, create if new, link if existing
- Environment variables: OAuth client ID and secret for each provider
- Reference: NextAuth.js OAuth documentation, Architecture document

---

### Story 1.5: Password Reset Flow

As a **user who forgot my password**,  
I want **to reset my password via email verification**,  
So that **I can regain access to my account securely**.

**Acceptance Criteria:**

**Given** I am on the login page  
**When** I click "Forgot password?" and enter my email address  
**Then** the system:

- Validates email format (RFC 5322)
- Sends password reset email with secure token (expires in 1 hour)
- Displays confirmation message: "If an account exists with this email, a password reset link has been sent"
- Prevents account enumeration (same message whether email exists or not)

**And** when I click the reset link in the email:

- System validates token and expiration
- Displays password reset form with new password and confirm password fields
- Validates new password meets requirements (8+ chars, uppercase, number, special)
- Shows password strength meter
- On successful reset:
  - Invalidates all existing sessions for security
  - Updates password with secure hashing
  - Redirects to login page with success message
  - Requires user to log in with new password

**And** error handling:

- Invalid or expired token shows error page with link to request new reset email
- Rate limiting: maximum 3 reset requests per hour per email address

**Prerequisites:** Story 1.2 (Email Authentication - User Registration)

**Technical Notes:**

- Generate secure random token (32+ characters, URL-safe)
- Store token hash in database with expiration timestamp
- Email service integration (SMTP or email service provider)
- Email template: clear instructions, prominent CTA button, security notice
- Token single-use (invalidate after successful reset)
- Reference: NextAuth.js password reset flow, Architecture document

---

### Story 1.6: User Profile Management

As a **logged-in user**,  
I want **to view and update my profile information and preferences**,  
So that **my account reflects my current information and I can customize my experience**.

**Acceptance Criteria:**

**Given** I am logged in and viewing my profile page  
**When** I view my profile  
**Then** the system displays:

- Current email address (editable, requires verification if changed)
- Display name or username (editable)
- Profile picture (upload/change capability)
- Account creation date
- Last login timestamp
- Preferences section (theme preference, notification settings, etc.)

**And** when I update information:

- Form validates all fields in real-time
- Changes save successfully with confirmation feedback
- Email changes require verification (send verification email, confirm before updating)
- Profile picture uploads with image validation (max size 5MB, formats: JPG, PNG, WebP)
- Image compression/optimization before storage
- Updates reflect immediately in the UI

**Prerequisites:** Story 1.3 (Email Authentication - User Login)

**Technical Notes:**

- Profile page route: `/profile` or `/settings/profile`
- Form components: ShadCN/UI form with react-hook-form
- Image upload: multipart/form-data, store in Supabase Storage or cloud storage
- Image optimization: resize to max dimensions, compress, generate thumbnail
- Profile data stored in user table (Prisma schema)
- API endpoint: PATCH /api/user/profile
- Reference: Architecture document (User management), UX Design Specification

---

### Story 1.7: Guest Access Capability

As a **visitor**,  
I want **to access the platform as a guest with limited functionality**,  
So that **I can explore public features before creating an account**.

**Acceptance Criteria:**

**Given** I am not logged in and visit the platform  
**When** I navigate the site  
**Then** the system:

- Allows access to public pages (landing page, public statistics, feature overview)
- Displays "Sign In" and "Sign Up" options prominently in navigation
- Shows limited preview of analytics features (read-only, sample data or aggregated public data)
- Prompts for account creation when trying to access personalized features
- Stores guest preferences in session storage (theme, language) that persist for session duration

**And** guest-accessible features include:

- Public overall statistics view (community-wide aggregated data)
- Feature tour or demo mode
- Marketing/landing page content
- Documentation or help pages

**And** features requiring authentication show:

- Clear "Sign In Required" message
- Call-to-action to create account
- Smooth transition to sign-up flow

**Prerequisites:** Story 1.1 (Visual Design System Foundation)

**Technical Notes:**

- Middleware or route guards to distinguish authenticated vs guest routes
- Guest session management (temporary, no database record)
- Public API endpoints for aggregated/public data
- Reference: PRD FR6, UX Design Specification (Navigation patterns)

---

### Story 1.8: Admin Role Management

As an **administrator**,  
I want **to manage user roles and permissions**,  
So that **I can control access levels and platform administration**.

**Acceptance Criteria:**

**Given** I am logged in as an administrator  
**When** I access the admin user management page  
**Then** the system displays:

- List of all users with pagination (50 users per page)
- User information: email, display name, role, account status, last login
- Search functionality to find users by email or name
- Filter by role (User, Admin, etc.)

**And** when I modify a user's role:

- Dropdown selector shows available roles (User, Admin)
- Changes save immediately with confirmation feedback
- Role changes are logged for audit trail
- System prevents removing the last admin (validation error)
- Users with changed roles see updated permissions on next request

**And** security:

- Only administrators can access admin pages (route protection)
- Role changes require admin confirmation (are you sure dialog)
- All admin actions logged to audit log

**Prerequisites:** Story 1.3 (Email Authentication - User Login), initial admin user must exist

**Technical Notes:**

- Role-based access control (RBAC) implementation
- Admin routes: `/admin/users`, `/admin/settings`, etc.
- Middleware to check admin role on protected routes
- User roles stored in user table (role field: enum User | Admin)
- Audit logging: store admin actions in audit_log table
- API endpoints: GET /api/admin/users, PATCH /api/admin/users/[id]/role
- Reference: Architecture document (Authorization section), PRD FR5

---

## Epic 2: Data Import & Synchronization

**Goal:** System can reliably import and synchronize game data from gomafia.pro with quality validation.

**User Value:** Users' game data is available in the platform. Essential foundation for all analytics features.

**FRs Covered:** FR7-FR15

---

### Story 2.1: Historical Data Import from gomafia.pro

As a **user**,  
I want **to import my complete historical game data from gomafia.pro**,  
So that **I can see my full game history and analytics in the platform**.

**Acceptance Criteria:**

**Given** I am logged in and have a gomafia.pro profile URL  
**When** I trigger the historical import  
**Then** the system:

- Accepts gomafia.pro profile URL or player ID as input
- Validates URL format and verifies profile exists on gomafia.pro
- Initiates background import process for all available historical data
- Scrapes player profile page to discover total games and date range
- Processes games in chronological order (oldest first) or reverse chronological (newest first)
- Imports all entities: Player, Games, Tournaments, Clubs, Judges, Statistics
- Stores imported data in database with proper relationships
- Tracks import progress (percentage complete, current game number, estimated time remaining)
- Displays progress in real-time on import status page

**And** the import handles:

- Large datasets (1000+ games) without timeout or memory issues
- Rate limiting to avoid overwhelming gomafia.pro servers (respectful scraping)
- Incremental progress updates (save checkpoint every N games)
- Error handling for individual game failures (log and continue)

**Prerequisites:** Story 1.3 (Email Authentication - User Login), database schema with all required tables

**Technical Notes:**

- Use Playwright for web scraping (browser automation)
- Import orchestration: phase-based import (Clubs → Players → Games → Statistics)
- Batch processing: import games in batches of 50-100 for efficiency
- Progress tracking: store import status in sync_status table
- Background job processing: use Next.js API route with background processing or queue system
- Reference: Architecture document (gomafia integration section), existing import infrastructure

---

### Story 2.2: Automatic Scheduled Synchronization

As a **user**,  
I want **the system to automatically sync new game data on a schedule**,  
So that **my analytics stay up-to-date without manual intervention**.

**Acceptance Criteria:**

**Given** I have completed an initial import  
**When** new games are played on gomafia.pro  
**Then** the system:

- Automatically detects new games (checks last sync timestamp)
- Runs scheduled sync job (configurable: daily, hourly, or every N hours)
- Imports only new games since last sync (incremental import)
- Updates existing games if data changed on gomafia.pro
- Sends notification (optional) when sync completes
- Logs sync results (games imported, errors encountered)

**And** scheduled sync:

- Runs in background without blocking user requests
- Respects rate limits on gomafia.pro
- Handles scheduled sync failures gracefully (retry on next schedule)
- Can be enabled/disabled per user in preferences

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Cron job or scheduled task (Vercel Cron, or external scheduler)
- Incremental sync logic: compare last_sync_at timestamp with game dates
- Sync job API endpoint: POST /api/gomafia-sync/scheduled
- Configuration: store sync preferences in user preferences table
- Reference: Architecture document, existing sync infrastructure

---

### Story 2.3: Manual Data Synchronization Trigger

As a **user**,  
I want **to manually trigger a data synchronization**,  
So that **I can refresh my data on-demand without waiting for scheduled sync**.

**Acceptance Criteria:**

**Given** I am logged in and viewing my dashboard or sync page  
**When** I click "Sync Now" or "Refresh Data" button  
**Then** the system:

- Immediately starts synchronization process
- Shows loading state on button (disabled, spinner)
- Displays real-time sync progress
- Imports all new games since last sync
- Updates existing games with latest data from gomafia.pro
- Shows completion status with summary (X new games imported, Y games updated)

**And** manual sync:

- Can be triggered even if scheduled sync is configured
- Respects concurrent import prevention (see Story 2.7)
- Shows clear feedback: "Sync started", "Sync in progress", "Sync completed"
- If sync already running, shows message: "Sync already in progress. Please wait."

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- API endpoint: POST /api/gomafia-sync/manual
- Real-time progress via Server-Sent Events (SSE) or polling
- Button component with loading states (ShadCN/UI Button)
- Reference: UX Design Specification (Button patterns, Loading states)

---

### Story 2.4: Data Quality Validation (≥98% Threshold)

As a **system**,  
I want **to validate imported data quality meets the ≥98% accuracy threshold**,  
So that **users receive reliable and accurate analytics**.

**Acceptance Criteria:**

**Given** data is imported from gomafia.pro  
**When** each entity (game, player, tournament) is processed  
**Then** the system:

- Validates required fields are present (non-null, non-empty)
- Validates data types match expected schema (dates, numbers, strings)
- Validates business rules (e.g., game dates are in valid range, scores are positive)
- Validates referential integrity (foreign keys exist)
- Calculates quality score: (valid records / total records) × 100
- Logs validation results for each batch
- Rejects batches with quality score < 98%

**And** validation includes:

- Required field validation (name, date, ID, etc.)
- Data format validation (date format, number ranges, string lengths)
- Business logic validation (game outcome matches scores, role assignments valid)
- Cross-reference validation (players exist, tournaments exist, clubs exist)

**And** if quality threshold not met:

- Import pauses and logs detailed validation errors
- Shows quality report to user: "Data quality below threshold (95%). Please review errors."
- Provides option to continue anyway (user acknowledges risk) or fix errors

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Validation layer in import pipeline (validators directory)
- Zod schemas for data validation
- Quality metrics tracking in sync_log table
- Validation error logging: store errors in import_errors table
- Reference: Architecture document (Validation patterns), PRD FR10

---

### Story 2.5: Import Error Handling & Retry Mechanisms

As a **system**,  
I want **to handle import errors gracefully with automatic retries**,  
So that **transient failures don't block the entire import process**.

**Acceptance Criteria:**

**Given** an import is running  
**When** an error occurs (network timeout, parsing error, etc.)  
**Then** the system:

- Catches the error and categorizes it (transient vs permanent)
- For transient errors (network timeout, rate limit):
  - Implements exponential backoff retry (1s, 2s, 4s, 8s delays)
  - Retries up to 3 times before marking as failed
  - Logs retry attempts with timestamps
- For permanent errors (invalid data format, missing required field):
  - Logs error with full context (entity ID, error message, stack trace)
  - Skips the problematic entity and continues with next
  - Records skipped entity in skipped_entities table
- Continues processing remaining entities after error
- Shows error summary at end: "Import completed with X errors. Y entities skipped."

**And** error reporting:

- Displays user-friendly error messages in UI
- Provides detailed error log for administrators
- Groups errors by type for easier debugging

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Error categorization: transient (retry) vs permanent (skip)
- Retry logic: exponential backoff with jitter
- Error logging: structured logging with context (entity type, ID, error type)
- Error tracking: error_logs table with error details
- Reference: Architecture document (Error handling patterns), PRD FR11

---

### Story 2.6: Real-Time Import Progress Tracking

As a **user**,  
I want **to see real-time progress of my data import**,  
So that **I know how long the import will take and can monitor its status**.

**Acceptance Criteria:**

**Given** an import is running  
**When** I view the import status page  
**Then** the system displays:

- Current phase (Clubs, Players, Games, Statistics, etc.)
- Progress bar showing percentage complete (0-100%)
- Current entity being processed (e.g., "Importing game 1,234 of 5,000")
- Estimated time remaining (calculated from processing rate)
- Games imported count and total games
- Elapsed time since import started
- Processing rate (games per second/minute)

**And** progress updates:

- Updates in real-time (< 1 second latency)
- Uses smooth animations for progress bar updates
- Auto-refreshes status every 2 seconds (or uses Server-Sent Events)
- Shows phase transitions with clear messaging

**And** visual feedback:

- Progress bar with percentage indicator
- Animated spinner or activity indicator
- Color-coded status (blue = in progress, green = complete, red = error)
- Ability to cancel import (see cancellation flow)

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Real-time updates: Server-Sent Events (SSE) or polling via API
- Progress calculation: (processed_count / total_count) × 100
- Time estimation: average processing time per entity × remaining entities
- API endpoint: GET /api/gomafia-sync/status (returns current progress)
- UI component: Progress bar (ShadCN/UI Progress) with custom labels
- Reference: UX Design Specification (Progress indicators), PRD FR12

---

### Story 2.7: Checkpoint & Resume Interrupted Imports

As a **system**,  
I want **to save import checkpoints periodically**,  
So that **interrupted imports can resume from the last checkpoint instead of starting over**.

**Acceptance Criteria:**

**Given** an import is running  
**When** a checkpoint is reached (every N entities processed, e.g., every 100 games)  
**Then** the system:

- Saves current import state to checkpoint table:
  - Current phase (Clubs, Players, Games, Statistics)
  - Last processed entity ID for each phase
  - Import start timestamp
  - Total entities to import
  - Processed count for each phase
- Persists checkpoint data atomically (transaction)
- Logs checkpoint creation timestamp

**And** when import is interrupted (server restart, timeout, user cancellation):

- System detects incomplete import on next run
- Offers to resume from last checkpoint
- User can choose: "Resume from checkpoint" or "Start fresh"
- Resume option loads checkpoint state and continues from saved position
- Progress tracking resumes from checkpoint (not from zero)

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Checkpoint table schema: sync_checkpoint (user_id, phase, last_entity_id, processed_count, timestamp)
- Checkpoint frequency: configurable (default: every 100 entities or every phase completion)
- Atomic checkpoint save: database transaction
- Resume logic: load checkpoint, skip already-processed entities
- Reference: Architecture document (Import orchestration), PRD FR13

---

### Story 2.8: Concurrent Import Prevention

As a **system**,  
I want **to prevent concurrent imports from running simultaneously**,  
So that **data integrity is maintained and system resources are used efficiently**.

**Acceptance Criteria:**

**Given** an import is already running for a user  
**When** another import is attempted (manual trigger, scheduled sync, or from different browser tab)  
**Then** the system:

- Detects active import using advisory lock or status flag
- Rejects new import request with clear message: "Import already in progress. Please wait for current import to complete."
- Shows status of existing import (progress, estimated completion)
- Prevents multiple imports even if triggered from different devices/browsers

**And** lock mechanism:

- Uses database advisory lock (PostgreSQL) or Redis distributed lock
- Lock is released automatically when import completes or fails
- Lock timeout: maximum 12 hours (prevents stale locks from crashed processes)
- Lock includes user_id to allow different users to import simultaneously

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Advisory lock: PostgreSQL pg_advisory_lock(user_id) or Redis distributed lock
- Lock key: "import_lock:{user_id}"
- Lock acquisition: check before starting import, acquire lock, release on completion
- Status check: query sync_status table for active imports
- API validation: check lock before accepting import request
- Reference: Architecture document, PRD FR14

---

### Story 2.9: Referential Integrity Verification

As a **system**,  
I want **to verify referential integrity of imported relationships**,  
So that **all data connections are valid and analytics queries don't fail**.

**Acceptance Criteria:**

**Given** data is imported with relationships (games reference players, players belong to clubs, etc.)  
**When** relationships are established  
**Then** the system:

- Verifies foreign key references exist before creating relationships:
  - Games reference valid Player IDs
  - Players reference valid Club IDs (if applicable)
  - Games reference valid Tournament IDs
  - Tournament judges reference valid Judge/Player IDs
- Validates relationship cardinality (one-to-many, many-to-many as expected)
- Logs referential integrity violations
- Handles missing references:
  - Option 1: Create placeholder entities (with flag indicating incomplete data)
  - Option 2: Skip relationship and log warning
  - Option 3: Fail import with error report

**And** integrity checks run:

- After each phase completes (phase-level verification)
- At end of full import (full integrity audit)
- Before marking import as complete

**Prerequisites:** Story 2.1 (Historical Data Import from gomafia.pro)

**Technical Notes:**

- Database foreign key constraints (Prisma schema)
- Application-level verification: query referenced entities before creating relationships
- Integrity audit: SQL queries to find orphaned records or missing references
- Violation logging: integrity_errors table
- Reference: Architecture document (Data models), PRD FR15

---

## Epic 3: Player Analytics Dashboard

**Goal:** Players can view comprehensive role-based performance analytics and insights.

**User Value:** Players understand their performance patterns, identify strengths and weaknesses across roles, and track improvement over time.

**FRs Covered:** FR16-FR23, FR43-FR48

---

### Story 3.1: Role-Based Performance Metrics Display

As a **player**,  
I want **to view my performance metrics broken down by role (Don, Mafia, Sheriff, Citizen)**,  
So that **I can identify which roles I excel at and which need improvement**.

**Acceptance Criteria:**

**Given** I am logged in and have imported game data  
**When** I view my analytics dashboard  
**Then** the system displays:

- Four role cards/sections (Don, Mafia, Sheriff, Citizen)
- For each role: win rate percentage, games played count, average ELO in that role
- Visual indicators (color-coded, icons) for performance level (excellent/good/needs improvement)
- Role comparison chart/graph showing relative performance across roles
- Smooth animations when metrics load/update

**Prerequisites:** Story 2.1 (Historical Data Import), data must be imported

**Technical Notes:**

- Calculate metrics: GROUP BY role, aggregate win/loss, count games, average ELO
- API endpoint: GET /api/players/[id]/analytics/role-based
- UI components: Role cards using ShadCN/UI Card component
- Reference: PRD FR16, UX Design Specification (Analytics components)

---

### Story 3.2: ELO Rating with Historical Trends

As a **player**,  
I want **to view my ELO rating with historical progression over time**,  
So that **I can track my skill improvement and see rating trends**.

**Acceptance Criteria:**

**Given** I have ELO rating data from imported games  
**When** I view my ELO analytics  
**Then** the system displays:

- Current ELO rating (prominent, large number)
- Line chart/graph showing ELO progression over time (x-axis: date, y-axis: ELO)
- Historical high/low ELO values
- ELO change indicators (up/down arrows, color-coded)
- Time range selector (last month, 3 months, 6 months, all time)
- Hover tooltips showing exact ELO value and date

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- ELO calculation: use existing ELO from games or calculate from game outcomes
- Chart library: Recharts or Chart.js for line chart
- API endpoint: GET /api/players/[id]/analytics/elo-trends?dateRange=...
- Reference: PRD FR17, UX Design Specification (Chart components)

---

### Story 3.3: Win Rate Analysis Across Roles

As a **player**,  
I want **to analyze my win rates across different roles and game scenarios**,  
So that **I understand my strengths and weaknesses in various situations**.

**Acceptance Criteria:**

**Given** I have game data with win/loss records per role  
**When** I view win rate analytics  
**Then** the system displays:

- Overall win rate percentage
- Win rate breakdown by role (Don: X%, Mafia: Y%, Sheriff: Z%, Citizen: W%)
- Win rate by scenario (tournament games vs casual games, if available)
- Comparison to average win rates (if aggregated data available)
- Visual charts: bar chart comparing win rates across roles, pie chart showing win/loss distribution

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Calculate win rates: (wins / total_games) × 100 per role
- API endpoint: GET /api/players/[id]/analytics/win-rates
- Chart components: Bar chart, pie chart using chart library
- Reference: PRD FR18

---

### Story 3.4: Basic Performance Statistics & Summaries

As a **player**,  
I want **to view comprehensive performance statistics and summaries**,  
So that **I get a complete overview of my game performance**.

**Acceptance Criteria:**

**Given** I have imported game data  
**When** I view the performance summary section  
**Then** the system displays:

- Total games played count
- Total wins and losses (with percentages)
- Average game duration (if available)
- Best performance indicators (longest win streak, best ELO achieved)
- Recent activity summary (games played this week/month)
- Key metrics cards with large, readable numbers and icons

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Aggregate statistics: COUNT, SUM, AVG queries on games table
- API endpoint: GET /api/players/[id]/analytics/summary
- UI: Stat cards using ShadCN/UI Card component
- Reference: PRD FR19

---

### Story 3.5: Date Range Filtering for Analytics

As a **player**,  
I want **to filter my analytics by date range**,  
So that **I can analyze performance for specific time periods**.

**Acceptance Criteria:**

**Given** I am viewing analytics  
**When** I select a date range (date picker or predefined ranges: last week, month, 3 months, year, all time)  
**Then** the system:

- Updates all analytics views to show data only for selected date range
- Refreshes charts, metrics, and statistics
- Shows active filter indicator ("Showing: Last 3 months")
- Smooth transition/animation when data updates
- Maintains filter selection across page navigation

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Date range picker: ShadCN/UI DatePicker component
- Filter state management: Zustand store or URL query parameters
- API endpoints accept dateRange parameter: ?startDate=...&endDate=...
- Reference: PRD FR20, UX Design Specification (Filter patterns)

---

### Story 3.6: Role Filtering for Analytics

As a **player**,  
I want **to filter my analytics by specific role (Don, Mafia, Sheriff, Citizen)**,  
So that **I can focus on performance for a single role**.

**Acceptance Criteria:**

**Given** I am viewing analytics  
**When** I select a role filter (toggle buttons or dropdown)  
**Then** the system:

- Updates all analytics to show data only for selected role(s)
- Allows multi-select (view multiple roles simultaneously or single role)
- Shows active filter badges ("Don selected", "Mafia + Sheriff selected")
- Refreshes charts and metrics immediately
- Clear/Reset filter option available

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Filter UI: Toggle group or multi-select dropdown (ShadCN/UI)
- Filter state: managed in Zustand store or URL query params
- API filtering: ?roles=don,mafia query parameter
- Reference: PRD FR21

---

### Story 3.7: Performance Trends Over Time

As a **player**,  
I want **to view performance trends over time**,  
So that **I can see how my skills are improving or declining**.

**Acceptance Criteria:**

**Given** I have historical game data  
**When** I view trends analytics  
**Then** the system displays:

- Time-series charts showing key metrics over time (win rate, ELO, games played per period)
- Trend indicators (upward/downward arrows, trend lines)
- Period grouping options (by week, month, quarter)
- Comparative analysis (this month vs last month)
- Visual trend lines with annotations for significant changes

**Prerequisites:** Story 3.2 (ELO Rating with Historical Trends), Story 3.5 (Date Range Filtering)

**Technical Notes:**

- Time-series aggregation: GROUP BY date period (week/month), aggregate metrics
- Chart: Line chart or area chart showing trends
- API endpoint: GET /api/players/[id]/analytics/trends?period=week|month
- Reference: PRD FR22

---

### Story 3.8: Role Comparison Capability

As a **player**,  
I want **to compare my performance across different roles side-by-side**,  
So that **I can easily identify which role I perform best in**.

**Acceptance Criteria:**

**Given** I have performance data for multiple roles  
**When** I view role comparison  
**Then** the system displays:

- Side-by-side comparison table or cards showing metrics for each role:
  - Win rate, games played, average ELO, win streak
- Comparison charts (bar chart comparing metrics across roles)
- Highlighting of best-performing role (visual emphasis: color, badge)
- Ability to select which metrics to compare
- Export or share comparison (optional, post-MVP)

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Comparison logic: aggregate metrics per role, compare values
- UI: Comparison table or side-by-side cards
- API endpoint: GET /api/players/[id]/analytics/role-comparison
- Reference: PRD FR23

---

### Story 3.9: Analytics Navigation & Data Display Components

As a **user**,  
I want **to navigate between different analytics sections smoothly**,  
So that **I can explore different aspects of my performance easily**.

**Acceptance Criteria:**

**Given** I am on the analytics dashboard  
**When** I navigate between sections (Role Analytics, ELO Trends, Win Rates, etc.)  
**Then** the system:

- Provides clear navigation (tabs, sidebar, or bottom navigation on mobile)
- Smooth animations/transitions between sections (< 300ms transition)
- Maintains scroll position or returns to top appropriately
- Highlights active section in navigation
- Responsive navigation (mobile: bottom nav or hamburger menu, desktop: sidebar or top tabs)

**Prerequisites:** Story 1.1 (Visual Design System Foundation), Story 3.1 (Role-Based Performance Metrics)

**Technical Notes:**

- Navigation: ShadCN/UI Tabs or custom navigation component
- Route structure: /dashboard/analytics/[section] or single page with tabs
- Animations: CSS transitions or Framer Motion
- Reference: PRD FR43, UX Design Specification (Navigation patterns)

---

### Story 3.10: Mobile PWA Access & Responsive Layouts

As a **mobile user**,  
I want **to access analytics from my mobile device via PWA**,  
So that **I can view my performance data on-the-go**.

**Acceptance Criteria:**

**Given** I am on a mobile device  
**When** I access the platform  
**Then** the system:

- Displays beautifully on mobile screens (320px+ width)
- Provides PWA installation prompt (Add to Home Screen)
- Works offline for previously loaded data (service worker caching)
- Uses touch-optimized interactions (44x44px minimum touch targets)
- Responsive layouts adapt to screen size (stacked cards on mobile, side-by-side on desktop)
- Charts and graphs scale appropriately for mobile viewing
- Navigation uses mobile-friendly patterns (bottom nav, hamburger menu)

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display), PWA service worker setup

**Technical Notes:**

- PWA manifest: public/manifest.json configuration
- Service worker: caching strategy for offline access
- Responsive breakpoints: 320px, 768px, 1024px (Tailwind config)
- Touch targets: min 44x44px for all interactive elements
- Reference: PRD FR44, UX Design Specification (Mobile patterns)

---

### Story 3.11: Responsive Charts & Data Visualization

As a **user**,  
I want **data displayed in responsive tables and charts with rich visualizations**,  
So that **I can understand my performance data at a glance**.

**Acceptance Criteria:**

**Given** I am viewing analytics  
**When** data is displayed  
**Then** the system shows:

- Charts and graphs that resize responsively (mobile: stacked, desktop: side-by-side)
- High-quality visualizations with smooth animations
- Data tables that scroll horizontally on mobile or use card layout
- Rich visual elements: icons, color-coding, gradients, shadows
- Loading states with skeleton screens or spinners
- Empty states with helpful messaging when no data available

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Chart library: Recharts or Chart.js (responsive configuration)
- Table component: ShadCN/UI Table with responsive wrapper
- Skeleton loaders: ShadCN/UI Skeleton component
- Reference: PRD FR46, UX Design Specification (Data visualization)

---

### Story 3.12: Search for Players or Games

As a **user**,  
I want **to search for specific players or games**,  
So that **I can quickly find and view specific game details**.

**Acceptance Criteria:**

**Given** I am on the platform  
**When** I use the search functionality  
**Then** the system:

- Provides search input with autocomplete suggestions
- Searches across player names and game IDs/dates
- Shows search results in real-time as I type (debounced, 300ms delay)
- Highlights matching text in results
- Provides visual feedback (loading indicator during search)
- Navigates to game/player detail page on selection
- Smooth search animation/transition

**Prerequisites:** Story 3.1 (Role-Based Performance Metrics Display)

**Technical Notes:**

- Search input: ShadCN/UI Input with autocomplete
- Search API: GET /api/search?q=... (full-text search or filtered queries)
- Debouncing: use React hook (useDebounce) or lodash debounce
- Reference: PRD FR47

---

### Story 3.13: Individual Game Detail View

As a **user**,  
I want **to view detailed information for individual games**,  
So that **I can analyze specific game outcomes and details**.

**Acceptance Criteria:**

**Given** I am viewing a game in a list or timeline  
**When** I click on a game  
**Then** the system displays:

- Game detail modal or page with impressive layout:
  - Game date and time
  - All players and their roles
  - Game outcome (who won: Mafia or Citizens)
  - Individual player actions/performance (if available)
  - Tournament information (if tournament game)
  - Visual storytelling elements (role icons, outcome indicators, player avatars)
- Smooth modal/page transition animation
- Close/back navigation
- Share game link option (optional, post-MVP)

**Prerequisites:** Story 3.12 (Search for Players or Games)

**Technical Notes:**

- Game detail route: /games/[id] or modal component
- API endpoint: GET /api/games/[id]
- Modal component: ShadCN/UI Dialog
- Reference: PRD FR48, UX Design Specification (Detail views)

---

## Epic 4: Timeline Visualization

**Goal:** Users can view their complete game history in an interactive, visual timeline.

**User Value:** Users can explore their complete game history visually, identify patterns, and understand performance evolution over time. Creates the WOW moment.

**FRs Covered:** FR30-FR36

---

### Story 4.1: Interactive Timeline Display

As a **user**,  
I want **to view my complete game history in an interactive timeline**,  
So that **I can see all my games chronologically in a visual format**.

**Acceptance Criteria:**

**Given** I have imported game data  
**When** I view the timeline page  
**Then** the system displays:

- Interactive timeline showing all games chronologically
- Timeline axis with date markers (days, weeks, or months depending on zoom level)
- Game markers/points on timeline (color-coded by outcome: win=green, loss=red)
- Zoom controls (zoom in/out to see different time granularities)
- Pan/scroll capability (horizontal scroll or drag to navigate time)
- Smooth animations when navigating timeline
- Loading state with skeleton while data loads

**Prerequisites:** Story 2.1 (Historical Data Import), Story 3.1 (Role-Based Performance Metrics)

**Technical Notes:**

- Timeline library: vis.js Timeline, D3.js timeline, or custom React component
- Timeline data: fetch games ordered by date
- API endpoint: GET /api/games/timeline?userId=...
- Reference: PRD FR30, UX Design Specification (Timeline patterns)

---

### Story 4.2: Timeline Date Range Filtering

As a **user**,  
I want **to filter the timeline by date range**,  
So that **I can focus on specific time periods**.

**Acceptance Criteria:**

**Given** I am viewing the timeline  
**When** I select a date range (date picker or predefined: last week, month, 3 months, year)  
**Then** the system:

- Updates timeline to show only games within selected date range
- Adjusts timeline axis to fit selected range
- Smoothly animates timeline update
- Shows active filter indicator
- Maintains filter when zooming or panning

**Prerequisites:** Story 4.1 (Interactive Timeline Display)

**Technical Notes:**

- Date range picker: ShadCN/UI DatePicker
- Filter state: managed in Zustand or URL query params
- Timeline library API: update visible range
- Reference: PRD FR31

---

### Story 4.3: Timeline Role Filtering

As a **user**,  
I want **to filter the timeline by role**,  
So that **I can see games where I played specific roles**.

**Acceptance Criteria:**

**Given** I am viewing the timeline  
**When** I select role filter(s) (Don, Mafia, Sheriff, Citizen)  
**Then** the system:

- Shows only games where I played selected role(s)
- Updates timeline markers to reflect filtered games
- Allows multi-select (view multiple roles)
- Shows active filter badges
- Smooth animation when filter applies

**Prerequisites:** Story 4.1 (Interactive Timeline Display)

**Technical Notes:**

- Role filter UI: Toggle buttons or multi-select (ShadCN/UI)
- Filter logic: WHERE role IN (selected_roles)
- API filtering: ?roles=don,mafia query parameter
- Reference: PRD FR32

---

### Story 4.4: Timeline Game Outcome Filtering

As a **user**,  
I want **to filter the timeline by game outcome (win/loss)**,  
So that **I can focus on winning or losing streaks**.

**Acceptance Criteria:**

**Given** I am viewing the timeline  
**When** I select outcome filter (All, Wins Only, Losses Only)  
**Then** the system:

- Shows only games matching selected outcome
- Updates timeline markers accordingly
- Color-coding remains consistent (green=win, red=loss)
- Smooth filter transition animation

**Prerequisites:** Story 4.1 (Interactive Timeline Display)

**Technical Notes:**

- Outcome filter: Toggle buttons or radio group (ShadCN/UI)
- Filter logic: WHERE outcome = 'win' OR 'loss'
- Reference: PRD FR33

---

### Story 4.5: Timeline Visual Performance Representation

As a **user**,  
I want **the timeline to display visual representation of performance over time**,  
So that **I can identify trends and patterns at a glance**.

**Acceptance Criteria:**

**Given** I am viewing the timeline  
**When** games are displayed  
**Then** the system shows:

- Color-coded game markers (green for wins, red for losses, with intensity indicating performance)
- Performance trend line overlay (showing ELO or win rate trend)
- Density visualization (more games = thicker marker clusters)
- Performance heatmap (color gradient showing performance periods)
- Legend explaining visual indicators

**Prerequisites:** Story 4.1 (Interactive Timeline Display)

**Technical Notes:**

- Visual encoding: color, size, opacity for performance indicators
- Trend line: overlay line chart on timeline
- Timeline library customization: custom markers, colors
- Reference: PRD FR34

---

### Story 4.6: Mobile-Responsive Timeline

As a **mobile user**,  
I want **the timeline to work on mobile devices**,  
So that **I can view my game history on my phone**.

**Acceptance Criteria:**

**Given** I am on a mobile device  
**When** I view the timeline  
**Then** the system:

- Displays timeline in mobile-optimized layout
- Supports touch gestures (pinch to zoom, swipe to pan)
- Timeline adapts to screen width (vertical timeline option on mobile)
- Touch targets are appropriately sized (44x44px minimum)
- Performance is smooth (60fps scrolling/animations)
- Timeline remains interactive and responsive

**Prerequisites:** Story 4.1 (Interactive Timeline Display)

**Technical Notes:**

- Mobile layout: vertical timeline or horizontal with touch gestures
- Touch event handling: pinch zoom, swipe pan
- Performance: virtual scrolling for large datasets
- Reference: PRD FR35, UX Design Specification (Mobile patterns)

---

### Story 4.7: Interactive Timeline Elements & Game Details

As a **user**,  
I want **to interact with timeline elements to view game details**,  
So that **I can drill down into specific games**.

**Acceptance Criteria:**

**Given** I am viewing the timeline  
**When** I click or hover over a game marker  
**Then** the system:

- Shows tooltip with game summary (date, role, outcome, ELO change)
- On click, opens game detail modal or navigates to game detail page
- Highlights selected game marker
- Smooth transition to detail view
- Easy return to timeline view

**Prerequisites:** Story 4.1 (Interactive Timeline Display), Story 3.13 (Individual Game Detail View)

**Technical Notes:**

- Tooltip: ShadCN/UI Tooltip component
- Game detail: reuse Story 3.13 game detail component
- Interaction: click handler on timeline markers
- Reference: PRD FR36

---

## Epic 5: Judge Analytics Dashboard

**Goal:** Judges can track their professional activity, tournament history, earnings, and performance metrics.

**User Value:** Judges can track their professional activity—unique capability not available elsewhere. This is the killer feature serving the highest-value user segment.

**FRs Covered:** FR24-FR29

---

### Story 5.1: Complete Tournament History Tracking

As a **judge**,  
I want **to view my complete tournament history**,  
So that **I can track all tournaments I've judged and my involvement**.

**Acceptance Criteria:**

**Given** I am logged in as a judge and have tournament data  
**When** I view my judge dashboard  
**Then** the system displays:

- List of all tournaments I've judged (chronological, newest first)
- For each tournament: name, date, location, number of games judged, total earnings
- Tournament detail view showing all games judged in that tournament
- Search and filter capabilities (by date, tournament name)
- Statistics: total tournaments judged, average games per tournament

**Prerequisites:** Story 2.1 (Historical Data Import), judge role must be identified in data

**Technical Notes:**

- Tournament data: from imported games where user is judge
- API endpoint: GET /api/judges/[id]/tournaments
- UI: Tournament list/cards using ShadCN/UI Card
- Reference: PRD FR24

---

### Story 5.2: Games Judged Per Month Statistics

As a **judge**,  
I want **to view games judged per month statistics**,  
So that **I can track my judging activity and identify busy periods**.

**Acceptance Criteria:**

**Given** I have judging history  
**When** I view monthly statistics  
**Then** the system displays:

- Bar chart showing games judged per month (x-axis: months, y-axis: game count)
- Total games judged across all time
- Average games per month
- Monthly comparison (this month vs last month, vs average)
- Hover tooltips showing exact count for each month
- Date range selector to view specific periods

**Prerequisites:** Story 5.1 (Complete Tournament History Tracking)

**Technical Notes:**

- Monthly aggregation: GROUP BY year, month, COUNT games
- Chart: Bar chart using Recharts or Chart.js
- API endpoint: GET /api/judges/[id]/statistics/monthly-games
- Reference: PRD FR25

---

### Story 5.3: Earnings Tracking & Trends

As a **judge**,  
I want **to track my earnings and view trends over time**,  
So that **I can monitor my professional income from judging**.

**Acceptance Criteria:**

**Given** I have tournament earnings data  
**When** I view earnings analytics  
**Then** the system displays:

- Total earnings (prominent display, large number)
- Earnings over time chart (line chart showing earnings by month/period)
- Earnings per tournament breakdown
- Average earnings per game/tournament
- Earnings trends (increasing, decreasing, stable indicators)
- Time period selector (last month, 3 months, year, all time)

**Prerequisites:** Story 5.1 (Complete Tournament History Tracking), earnings data must be available

**Technical Notes:**

- Earnings calculation: SUM earnings per period, GROUP BY month/tournament
- Chart: Line chart or area chart for trends
- API endpoint: GET /api/judges/[id]/earnings?period=...
- Reference: PRD FR26

---

### Story 5.4: Judge Performance Metrics

As a **judge**,  
I want **to view my judge performance metrics**,  
So that **I can assess my judging activity and professionalism**.

**Acceptance Criteria:**

**Given** I have judging history  
**When** I view performance metrics  
**Then** the system displays:

- Total games judged
- Total tournaments judged
- Average games per tournament
- Longest judging streak (consecutive months with judging activity)
- Performance rating or score (if available from tournament feedback)
- Year-over-year comparison (this year vs last year)
- Key performance indicators (KPIs) cards

**Prerequisites:** Story 5.1 (Complete Tournament History Tracking)

**Technical Notes:**

- Metrics calculation: aggregations on games/tournaments tables
- UI: Stat cards with large numbers and icons
- API endpoint: GET /api/judges/[id]/performance-metrics
- Reference: PRD FR27

---

### Story 5.5: Judge Analytics Date Range Filtering

As a **judge**,  
I want **to filter judge analytics by date range**,  
So that **I can analyze my activity for specific time periods**.

**Acceptance Criteria:**

**Given** I am viewing judge analytics  
**When** I select a date range  
**Then** the system:

- Updates all analytics (tournaments, games, earnings) to show data for selected range
- Refreshes charts and statistics
- Shows active filter indicator
- Maintains filter across different analytics views

**Prerequisites:** Story 5.1 (Complete Tournament History Tracking)

**Technical Notes:**

- Date range picker: ShadCN/UI DatePicker (reuse from Story 3.5)
- Filter state: Zustand store or URL query params
- API endpoints accept dateRange parameter
- Reference: PRD FR28

---

### Story 5.6: Judge Analytics Trends & Patterns

As a **judge**,  
I want **to view trends and patterns in my judging activity**,  
So that **I can identify busy seasons and plan ahead**.

**Acceptance Criteria:**

**Given** I have historical judging data  
**When** I view trends analytics  
**Then** the system displays:

- Trend charts showing:
  - Games judged per month over time
  - Earnings trends over time
  - Tournament participation trends
- Pattern identification (e.g., "You typically judge more games in Q4")
- Seasonal comparisons (this quarter vs same quarter last year)
- Forecast/prediction based on historical patterns (optional, simple trend extrapolation)

**Prerequisites:** Story 5.2 (Games Judged Per Month), Story 5.3 (Earnings Tracking)

**Technical Notes:**

- Time-series analysis: GROUP BY periods, calculate trends
- Chart: Multiple line charts or area charts
- API endpoint: GET /api/judges/[id]/trends
- Reference: PRD FR29

---

## FR Coverage Matrix

This matrix maps each functional requirement to its corresponding epic and story.

| FR        | Description                                                         | Epic   | Story                                                |
| --------- | ------------------------------------------------------------------- | ------ | ---------------------------------------------------- |
| FR1       | Users can create accounts with email or social authentication       | Epic 1 | Story 1.2, 1.4                                       |
| FR2       | Users can log in securely and maintain sessions across devices      | Epic 1 | Story 1.3                                            |
| FR3       | Users can reset passwords via email verification                    | Epic 1 | Story 1.5                                            |
| FR4       | Users can update profile information and preferences                | Epic 1 | Story 1.6                                            |
| FR5       | Administrators can manage user roles and permissions                | Epic 1 | Story 1.8                                            |
| FR6       | Users can access the platform as guests with limited functionality  | Epic 1 | Story 1.7                                            |
| FR7       | System can import historical game data from gomafia.pro             | Epic 2 | Story 2.1                                            |
| FR8       | System can synchronize data automatically on a scheduled basis      | Epic 2 | Story 2.2                                            |
| FR9       | Users can manually trigger data import/synchronization              | Epic 2 | Story 2.3                                            |
| FR10      | System validates imported data quality with ≥98% accuracy threshold | Epic 2 | Story 2.4                                            |
| FR11      | System handles import errors gracefully with retry mechanisms       | Epic 2 | Story 2.5                                            |
| FR12      | Users can view import progress in real-time                         | Epic 2 | Story 2.6                                            |
| FR13      | System can resume interrupted imports from last checkpoint          | Epic 2 | Story 2.7                                            |
| FR14      | System prevents concurrent imports across multiple instances        | Epic 2 | Story 2.8                                            |
| FR15      | System verifies referential integrity of imported relationships     | Epic 2 | Story 2.9                                            |
| FR16      | Players can view role-based performance metrics                     | Epic 3 | Story 3.1                                            |
| FR17      | Players can view ELO rating with historical trends                  | Epic 3 | Story 3.2                                            |
| FR18      | Players can analyze win rates across different roles                | Epic 3 | Story 3.3                                            |
| FR19      | Players can view basic performance statistics and summaries         | Epic 3 | Story 3.4                                            |
| FR20      | Players can filter analytics by date range                          | Epic 3 | Story 3.5                                            |
| FR21      | Players can filter analytics by role                                | Epic 3 | Story 3.6                                            |
| FR22      | Players can view performance trends over time                       | Epic 3 | Story 3.7                                            |
| FR23      | Players can compare performance across different roles              | Epic 3 | Story 3.8                                            |
| FR24      | Judges can view complete tournament history                         | Epic 5 | Story 5.1                                            |
| FR25      | Judges can view games judged per month statistics                   | Epic 5 | Story 5.2                                            |
| FR26      | Judges can track earnings and trends over time                      | Epic 5 | Story 5.3                                            |
| FR27      | Judges can view judge performance metrics                           | Epic 5 | Story 5.4                                            |
| FR28      | Judges can filter judge analytics by date range                     | Epic 5 | Story 5.5                                            |
| FR29      | Judges can view judge analytics trends and patterns                 | Epic 5 | Story 5.6                                            |
| FR30      | Users can view complete game history in an interactive timeline     | Epic 4 | Story 4.1                                            |
| FR31      | Users can filter timeline by date range                             | Epic 4 | Story 4.2                                            |
| FR32      | Users can filter timeline by role                                   | Epic 4 | Story 4.3                                            |
| FR33      | Users can filter timeline by game outcome                           | Epic 4 | Story 4.4                                            |
| FR34      | Timeline displays visual representation of performance over time    | Epic 4 | Story 4.5                                            |
| FR35      | Timeline is responsive and works on mobile devices                  | Epic 4 | Story 4.6                                            |
| FR36      | Users can interact with timeline elements to view game details      | Epic 4 | Story 4.7                                            |
| FR43      | Users can navigate between different analytics sections             | Epic 3 | Story 3.9                                            |
| FR44      | Users can access analytics from mobile devices via PWA              | Epic 3 | Story 3.10                                           |
| FR45      | Users can access previously loaded data offline (PWA)               | Epic 3 | Story 3.10                                           |
| FR46      | System displays data in responsive tables and charts                | Epic 3 | Story 3.11                                           |
| FR47      | Users can search for specific players or games                      | Epic 3 | Story 3.12                                           |
| FR48      | Users can view detailed information for individual games            | Epic 3 | Story 3.13                                           |
| FR59-FR66 | Visual Design & User Experience requirements                        | Epic 1 | Story 1.1 (foundation), applied throughout all epics |

---

## Summary

This epic breakdown decomposes all 50 MVP functional requirements into 5 epics and 46 implementable stories. Each story is sized for single dev agent completion in one focused session, with detailed acceptance criteria, clear prerequisites, and technical implementation notes.

**Epic Sequencing:**

1. **Epic 1** (8 stories): Foundation - Users can access the platform
2. **Epic 2** (9 stories): Data foundation - User data is available
3. **Epic 3** (14 stories): Core analytics - Players can view their analytics
4. **Epic 4** (7 stories): WOW moment - Interactive timeline visualization
5. **Epic 5** (6 stories): Killer feature - Judge analytics dashboard

**Key Principles:**

- Each epic delivers user value incrementally
- Stories are vertically sliced (complete functionality, not just one layer)
- No forward dependencies (only backward references)
- All stories include detailed BDD acceptance criteria
- Technical notes reference Architecture and UX Design documents

**Next Steps:**

- Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown
- Stories can be enhanced with additional UX and Architecture context as those workflows complete
- This document will be updated after UX Design and Architecture workflows to incorporate interaction details and technical decisions

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._

_This document will be updated after UX Design and Architecture workflows to incorporate interaction details and technical decisions._
