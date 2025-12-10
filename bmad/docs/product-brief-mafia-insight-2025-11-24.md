# Product Brief: mafia-insight

**Date:** 2025-11-24
**Author:** k05m0navt
**Context:** brownfield

---

## Executive Summary

**Mafia Insight** is a web-based Progressive Web App (PWA) that serves as a comprehensive analytics platform for the Mafia card game community. Built to address the lack of deep analytics and progress tracking for players, clubs, and judges, the platform transforms raw game data into actionable insights that help users understand performance, track progress, and make data-driven decisions.

The platform integrates with gomafia.pro to provide role-based analytics, tournament tracking, and specialized judge analytics—features that don't exist in current solutions. With a mobile-first PWA approach, Mafia Insight delivers a native app-like experience accessible anywhere, anytime.

---

## Core Vision

### Problem Statement

As both a player and judge in the Mafia card game community, the founder experienced firsthand the frustration of not being able to:

1. **Access Deep Analytics**: Existing platforms (like gomafia.pro) provide basic statistics but lack comprehensive analytics that reveal performance patterns, trends, and insights
2. **Track Progress as a Judge**: Judges have no way to track their tournament history, earnings, games judged, or performance metrics over time
3. **Understand Role-Based Performance**: Players can't easily analyze their performance across different roles (Don, Mafia, Sheriff, Citizen) to identify strengths and weaknesses
4. **Visualize Historical Data**: There's no way to see complete game history in an interactive, visual format that makes patterns obvious

The core problem is that the Mafia game community has rich data available but lacks the tools to transform that data into meaningful insights that help players improve, judges track their professional activity, and clubs understand team dynamics.

### Problem Impact

- **Players** miss opportunities to improve because they can't see performance patterns or historical trends
- **Judges** can't track their professional activity, earnings, or tournament history—critical for those who judge regularly
- **Clubs** lack team-level analytics to understand member performance and club dynamics
- **Community** loses engagement potential because analytics could drive competition, improvement, and deeper involvement

### Why Existing Solutions Fall Short

- **gomafia.pro**: Provides basic statistics but no deep analytics, no judge-specific features, limited historical data access, and no interactive visualizations
- **General Analytics Platforms**: Not specialized for Mafia game mechanics, don't understand role-based performance, and lack community-specific features
- **Manual Tracking**: Players and judges resort to spreadsheets or mental tracking, which is time-consuming and error-prone

### Proposed Solution

**Mafia Insight** is a web-based Progressive Web App that provides:

1. **Comprehensive Player Analytics**:
   - Role-based performance metrics (Don, Mafia, Sheriff, Citizen)
   - ELO rating system with historical trends
   - Win rate analysis across different scenarios
   - Interactive timeline graphs showing complete game history

2. **Specialized Judge Analytics** (Killer Feature):
   - Complete tournament history tracking
   - Games judged per month statistics
   - Earnings tracking and trends
   - Judge performance metrics and impact analysis

3. **Club Analytics**:
   - Member statistics and performance tracking
   - Team performance comparisons
   - Club rankings and engagement metrics

4. **Mobile-First PWA Experience**:
   - Native app-like experience on mobile devices
   - Offline access to previously loaded data
   - Fast, responsive interface optimized for mobile usage

5. **Data Integration**:
   - Automatic data import from gomafia.pro
   - Real-time updates and synchronization
   - Complete historical data access

### Key Differentiators

1. **Judge Analytics**: Unique feature not available anywhere else—judges can track their professional activity, earnings, and tournament history
2. **Role-Based Deep Analytics**: Specialized understanding of Mafia game mechanics with role-specific performance insights
3. **Complete Historical Data**: Full game history with interactive timeline visualizations, not just recent games
4. **Mobile-First PWA**: Native app experience without app store distribution, accessible instantly
5. **Community-Focused**: Built specifically for the Mafia game community, not a generic analytics tool

---

## Target Users

### Primary Users

**1. Players (Individual Mafia Game Players)**

- **Size**: Largest user segment (majority of user base)
- **Needs**:
  - Track performance across different roles
  - Understand win rates and ELO trends
  - See complete game history
  - Identify improvement opportunities
- **Current Behavior**: Use gomafia.pro for basic stats, no deep analytics available
- **Pain Points**: Can't see patterns, trends, or historical performance in an accessible way

**2. Judges (Tournament Judges)**

- **Size**: Smaller but HIGH-VALUE segment
- **Needs**:
  - Track tournament history
  - Monitor earnings over time
  - See games judged statistics
  - Understand judge performance metrics
- **Current Behavior**: No tools available—must track manually or not at all
- **Pain Points**: Can't track professional activity, earnings, or tournament history—critical for regular judges
- **Willingness to Pay**: Highest among all segments (professional use case)

**3. Clubs (Mafia Game Clubs/Teams)**

- **Size**: Medium segment
- **Needs**:
  - Member performance tracking
  - Team performance comparisons
  - Club rankings
  - Engagement analytics
- **Current Behavior**: Limited analytics available, mostly individual player stats
- **Pain Points**: No club-level insights, can't compare team performance, limited member analytics

---

## Success Metrics

### User Engagement Metrics

- **Daily Active Users (DAU)**: Track daily engagement and platform stickiness
- **Monthly Active Users (MAU)**: Measure overall user base growth and retention
- **Pages per Session**: Understand how deeply users explore the platform
- **Session Duration**: Measure how long users stay engaged with the app
- **WOW Moment**: Users expressing amazement within 30 seconds of first use

### Conversion Metrics

- **Visit to Registration**: Conversion rate from landing page to user registration
- **Trial to Paid**: Conversion rate from free tier to premium subscription
- **Lifetime Value (LTV)**: Average revenue per user over their lifetime

### Business Metrics

- **Freemium Conversion Rate**: Overall percentage of free users converting to paid
- **Average Revenue Per User (ARPU)**: Monthly revenue divided by total users
- **Customer Acquisition Cost (CAC)**: Cost to acquire each new user
- **LTV/CAC Ratio**: Measure of unit economics health

### Product Quality Metrics

- **Time to First Insight**: Target < 30 seconds from landing to seeing analytics
- **Data Freshness**: How up-to-date the analytics data is
- **Feature Discovery Rate**: How many users find and use key features
- **Error Rates**: Platform reliability and stability

---

## MVP Scope

### Core Features (Must-Have for Launch)

**1. Player Analytics Dashboard**

- Role-based performance metrics (Don, Mafia, Sheriff, Citizen)
- ELO rating system with historical trends and progression
- Win rate analysis across different roles and scenarios
- Basic performance statistics and summaries

**2. Judge Analytics Dashboard** (Killer Feature - Cannot Be Removed)

- Complete tournament history tracking
- Games judged per month statistics
- Earnings tracking and trends over time
- Judge performance metrics

**3. Timeline Graph Visualization**

- Interactive timeline showing complete game history
- Visual representation of performance over time
- Filterable by date, role, outcome
- Mobile-responsive design

**4. Data Import from gomafia.pro**

- Automatic data synchronization
- Historical data import capability
- Real-time or near-real-time updates
- Data validation and quality checks

### Out of Scope for MVP

- Advanced prediction models
- AI-powered insights and recommendations
- Club analytics (can be added in Phase 2)
- Social sharing features (VK, Telegram)
- Gamification elements (achievements, leaderboards)
- Custom dashboards
- Export capabilities (PDF/image)
- Advanced filtering and comparison tools

### MVP Success Criteria

- Users can see their complete game history in an interactive timeline
- Players can analyze performance across all four roles (Don, Mafia, Sheriff, Citizen)
- Judges can track tournament history, earnings, and games judged
- Data import from gomafia.pro works reliably
- WOW moment achieved: Users express amazement within 30 seconds
- Mobile PWA works smoothly on mobile devices
- Platform is stable and reliable for daily use

### Future Vision Features

- **Club Analytics**: Member statistics, team performance, club rankings
- **Advanced Analytics**: Prediction models, AI-powered insights, performance forecasting
- **Social Features**: Share analytics, compare with friends, follow players/clubs
- **Gamification**: Achievements system, leaderboards, seasons
- **Export & Sharing**: PDF/image export, social sharing (VK, Telegram)
- **Advanced Filtering**: Multi-player comparisons, complex date/role filters
- **Custom Dashboards**: Personalized dashboard creation

---

## Financial Considerations

### Business Model: Freemium

**Free Tier:**

- Basic player analytics
- Limited historical data access (e.g., last 50 games)
- Standard visualizations
- Basic role performance metrics

**Premium Tier (Future):**

- Full historical data access
- Advanced analytics and insights
- Judge analytics dashboard (if not in free tier)
- Export capabilities
- Priority data updates
- Advanced filtering and comparison tools

**Revenue Strategy:**

- Start with free tier to build user base
- Introduce premium features based on user demand and engagement
- Focus on judge segment for initial premium adoption (highest willingness to pay)
- Consider club tier for organizational subscriptions

### Infrastructure Costs

- **Current**: Minimal (free tiers of Supabase, Vercel)
- **Scaling**: Infrastructure costs scale with usage
- **Break-Even**: Low infrastructure costs make unit economics favorable

---

## Technical Preferences

### Platform Strategy

- **Web Application**: Primary platform
- **Progressive Web App (PWA)**: Mobile-first approach with native app-like experience
- **Mobile Optimization**: Responsive design optimized for mobile devices
- **Offline Capabilities**: PWA enables offline access to previously loaded data

### Technology Stack

- **Frontend**: Next.js 14+ with TypeScript, React
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **State Management**: TanStack Query (server state), Zustand (client state)
- **UI Framework**: ShadCN/UI components, Tailwind CSS
- **Data Integration**: Web scraping from gomafia.pro (Playwright)
- **Deployment**: Vercel

### Performance Requirements

- **Time to First Insight**: < 30 seconds target
- **Page Load**: Fast, responsive interface
- **Mobile Performance**: Optimized for mobile devices
- **Data Freshness**: Real-time or near-real-time updates

---

## Risks and Assumptions

### Key Risks

1. **Scraper Fragility**: gomafia.pro structure changes could break data import
   - **Mitigation**: Robust error handling, change detection, monitoring

2. **Data Quality**: Imported data may have inconsistencies or errors
   - **Mitigation**: Data validation pipelines, quality checks (≥98% threshold)

3. **Market Adoption**: User adoption may be slower than expected
   - **Mitigation**: Focus on judge segment (highest value), strong free tier value

4. **Competitive Response**: gomafia.pro could add analytics features
   - **Mitigation**: First-mover advantage, unique judge features, community lock-in

### Critical Assumptions

1. **User Demand**: Players, judges, and clubs want deep analytics
   - **Validation**: User research, beta testing, early adopter feedback

2. **Judge Willingness to Pay**: Judges will pay for analytics features
   - **Validation**: Judge interviews, pricing sensitivity testing

3. **Data Access**: gomafia.pro data will remain accessible via scraping
   - **Validation**: Monitor scraping success rates, have backup plans

4. **Technical Feasibility**: Scraping and analytics can be built reliably
   - **Validation**: Prototype testing, technical proof of concept

---

## Supporting Materials

### Research Documents Incorporated

- **Market Research** (2025-01-27): Market trends, pricing analysis, competitive landscape
- **User Research** (2025-01-27): User needs analysis for players, judges, and clubs
- **Research Summary** (2025-01-27): Feature prioritization, business plan, unit economics
- **Brainstorming Session** (2025-11-23): Comprehensive feature ideation and technical decisions

### Key Insights from Research

- **Judge Analytics is the Killer Feature**: Unique value proposition with highest willingness to pay
- **Market Opportunity**: Esports analytics market growing 21.8% CAGR
- **Pricing Sweet Spot**: $5-8/month for players, $8-12/month for judges (future consideration)
- **Conversion Targets**: 2-5% free-to-paid (players), 10-15% (judges)
- **WOW Moment**: Target < 30 seconds to first insight

---

_This Product Brief captures the vision and requirements for mafia-insight._

_It was created through collaborative discovery and reflects the unique needs of this brownfield project._

_Next: Use the PRD workflow to create detailed product requirements from this brief._
