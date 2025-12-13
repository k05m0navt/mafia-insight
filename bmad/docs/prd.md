# mafia-insight - Product Requirements Document

**Author:** k05m0navt
**Date:** 2025-01-27
**Version:** 1.0

---

## Executive Summary

**Mafia Insight** is a web-based Progressive Web App (PWA) that serves as a comprehensive analytics platform for the Mafia card game community. The platform transforms raw game data from gomafia.pro into actionable insights that help players understand performance patterns, judges track their professional activity, and clubs analyze team dynamics.

Built as a brownfield project, Mafia Insight extends existing analytics capabilities with specialized features including unique judge analytics, role-based performance insights, and complete historical data visualization. The platform delivers a mobile-first experience accessible anywhere, anytime.

### What Makes This Special

**Mafia Insight** stands apart through three key differentiators:

1. **Judge Analytics - The Killer Feature**: Unique capability not available anywhere else. Judges can track tournament history, earnings, games judged per month, and professional performance metrics—critical for those who judge regularly and represents the highest-value user segment.

2. **Role-Based Deep Analytics**: Specialized understanding of Mafia game mechanics with performance insights across Don, Mafia, Sheriff, and Citizen roles. Players can identify strengths and weaknesses in each role, enabling targeted improvement.

3. **Complete Historical Data Access**: Full game history with interactive timeline visualizations, not just recent games. Users can explore patterns, trends, and performance evolution over time.

---

## Project Classification

**Technical Type:** web_app
**Domain:** general
**Complexity:** low

**Classification Details:**

This is a web application (SPA/PWA) built with Next.js 14, TypeScript, and modern web technologies. While the platform serves the gaming community, it is analytics software rather than game development software, placing it in the general domain with low complexity. The platform focuses on data visualization, analytics, and user experience rather than complex domain-specific regulations or compliance requirements.

**Key Technical Characteristics:**

- Progressive Web App (PWA) with offline capabilities
- Single Page Application (SPA) architecture
- Mobile-first responsive design
- Real-time data synchronization from gomafia.pro
- Browser-based with no native app requirements

---

## Success Criteria

Success for **Mafia Insight** means users experience the platform's unique value proposition and achieve meaningful outcomes:

**For Players:**

- Users can see their complete game history in an interactive timeline within 30 seconds of first use (WOW moment)
- Players can analyze performance across all four roles (Don, Mafia, Sheriff, Citizen) and identify improvement opportunities
- Users express amazement and share the platform with others within 30 seconds of first use

**For Judges:**

- Judges can track their complete tournament history, earnings, and games judged statistics
- Judges rely on the platform for professional activity tracking (highest-value segment)
- Judge segment demonstrates highest willingness to pay for premium features

**For Clubs:**

- Clubs can access team-level analytics to understand member performance and club dynamics
- Club administrators can make data-driven decisions about team composition and strategy

**Platform Success:**

- Mobile PWA works smoothly on mobile devices with native app-like experience
- Data import from gomafia.pro works reliably with ≥98% data quality
- Platform is stable and reliable for daily use
- Users achieve "Time to First Insight" of < 30 seconds from landing to seeing analytics

**Business Metrics:**

- Freemium conversion rate: 2-5% for players, 10-15% for judges
- Daily Active Users (DAU) and Monthly Active Users (MAU) demonstrate engagement
- Judge segment shows highest conversion to paid tier

---

## Product Scope

### MVP - Minimum Viable Product

**Core Features (Must-Have for Launch):**

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
- Data validation and quality checks (≥98% threshold)

**MVP Success Criteria:**

- Users can see their complete game history in an interactive timeline
- Players can analyze performance across all four roles
- Judges can track tournament history, earnings, and games judged
- Data import works reliably
- WOW moment achieved: Users express amazement within 30 seconds
- Mobile PWA works smoothly on mobile devices
- Platform is stable and reliable for daily use

### Growth Features (Post-MVP)

**Club Analytics:**

- Member statistics and performance tracking
- Team performance comparisons
- Club rankings and engagement metrics

**Advanced Analytics:**

- Prediction models and performance forecasting
- AI-powered insights and recommendations
- Advanced filtering and comparison tools

**Enhanced User Experience:**

- Custom dashboards
- Export capabilities (PDF/image)
- Social sharing features (VK, Telegram)

**Gamification:**

- Achievements system
- Leaderboards
- Seasons and competitions

### Vision (Future)

**Long-term Vision Features:**

- Advanced prediction models with machine learning
- Real-time tournament streaming integration
- Community features: follow players, compare with friends
- Advanced club management with team strategies
- Integration with additional data sources beyond gomafia.pro
- Mobile native apps (iOS/Android) if PWA limitations emerge
- API for third-party integrations

---

## Web App Specific Requirements

### Browser Support

**Primary Targets:**

- Modern browsers: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browsers: iOS Safari, Chrome Mobile, Samsung Internet
- Progressive enhancement for older browsers

**Browser Matrix:**

- Desktop: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Mobile: iOS Safari 14+, Chrome Mobile 90+, Samsung Internet 14+

### Responsive Design

- Mobile-first approach with breakpoints: 320px, 768px, 1024px, 1440px
- Touch-optimized interactions for mobile devices with smooth animations
- Responsive data tables and charts that adapt to screen size while maintaining visual appeal
- Optimized typography and spacing for mobile readability
- Impressive layouts that adapt beautifully across all screen sizes
- High-quality images and icons that scale appropriately across devices

### Performance Targets

- **Time to First Insight**: < 30 seconds from landing to seeing analytics
- **First Contentful Paint (FCP)**: < 1.5 seconds
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **Time to Interactive (TTI)**: < 3.5 seconds
- **Cumulative Layout Shift (CLS)**: < 0.1

### SEO Strategy

- Server-side rendering (SSR) for initial page load
- Meta tags and Open Graph for social sharing
- Semantic HTML structure
- Accessible URLs and navigation
- Sitemap generation for search engines

### Accessibility Level

- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios meet WCAG standards
- Focus indicators for interactive elements
- Alt text for charts and visualizations

---

## User Experience Principles

**Visual Personality:**

- **Modern, Enticing, Beautiful Design**: Rich, visually appealing interface that captivates users
- **Not Minimalistic**: Embrace visual richness with carefully curated colors, high-quality images, and impressive layouts
- **Premium Aesthetic**: Professional yet exciting design that makes users want to engage
- **Visual Storytelling**: Use best-in-class pictures, icons, and visual elements to tell the data story
- **Immersive Experience**: Create an impressive, memorable first impression that drives engagement

**Design Elements:**

- **Rich Color Palette**: Carefully selected color schemes that enhance readability while creating visual interest
- **High-Quality Images**: Best pictures and visual assets that support the analytics narrative
- **Icon System**: Comprehensive, beautiful iconography that enhances understanding and navigation
- **Impressive Layouts**: Thoughtfully designed layouts that showcase data in visually compelling ways
- **Smooth Animations**: Polished animations and transitions that delight users and guide attention
- **Visual Hierarchy**: Clear, impressive visual hierarchy that emphasizes key insights without overwhelming

**Key Interaction Patterns:**

- **Progressive Disclosure**: Show summary first with beautiful visualizations, allow drill-down into details with smooth animations
- **Interactive Visualizations**: Charts and graphs respond to user interaction (hover, click, filter) with engaging animations
- **Immersive Navigation**: Impressive navigation system that's intuitive and visually appealing (bottom navigation on mobile, sidebar on desktop)
- **Quick Actions**: Common tasks accessible within 1-2 taps/clicks with visual feedback and animations
- **Contextual Help**: Beautiful tooltips and inline guidance with icons and visual aids for complex metrics
- **Micro-interactions**: Delightful animations on buttons, cards, and interactive elements

**Critical User Flows:**

1. **First-Time User Flow**: Landing → Import Data → See Analytics (target: < 30 seconds) - Must create WOW moment with impressive visuals
2. **Daily Player Flow**: Open App → View Dashboard → Check Recent Games → Analyze Role Performance - Smooth, animated transitions
3. **Judge Flow**: Open App → View Judge Dashboard → Track Tournament → Review Earnings - Rich visualizations and engaging layouts
4. **Data Import Flow**: Trigger Import → Monitor Progress → Verify Data Quality → Access Analytics - Animated progress indicators

**Design Approach:**
The UI should reinforce the core value proposition (deep analytics and insights) through:

- **Impressive Visualizations**: Prominent display of key metrics with beautiful charts, graphs, and data visualizations
- **Rich Visual Hierarchy**: Clear, impressive visual hierarchy emphasizing most important data with colors, typography, and spacing
- **Smooth Animations**: Polished transitions and animations that feel premium and guide user attention
- **Consistent Design Language**: Cohesive design system using ShadCN/UI components enhanced with custom styling, colors, and animations
- **Visual Storytelling**: Use high-quality images, icons, and visual elements to make data insights more engaging and memorable
- **Enticing Layouts**: Impressive page layouts that showcase analytics in visually compelling, modern arrangements

---

## Functional Requirements

Functional Requirements define WHAT capabilities the product must have. They are the complete inventory of user-facing and system capabilities that deliver the product vision. Every capability discussed in vision, scope, and domain requirements MUST be represented as an FR.

**User Account & Access:**

- FR1: Users can create accounts with email or social authentication
- FR2: Users can log in securely and maintain sessions across devices
- FR3: Users can reset passwords via email verification
- FR4: Users can update profile information and preferences
- FR5: Administrators can manage user roles and permissions
- FR6: Users can access the platform as guests with limited functionality

**Data Import & Synchronization:**

- FR7: System can import historical game data from gomafia.pro
- FR8: System can synchronize data automatically on a scheduled basis
- FR9: Users can manually trigger data import/synchronization
- FR10: System validates imported data quality with ≥98% accuracy threshold
- FR11: System handles import errors gracefully with retry mechanisms
- FR12: Users can view import progress in real-time
- FR13: System can resume interrupted imports from last checkpoint
- FR14: System prevents concurrent imports across multiple instances
- FR15: System verifies referential integrity of imported relationships

**Player Analytics:**

- FR16: Players can view role-based performance metrics (Don, Mafia, Sheriff, Citizen)
- FR17: Players can view ELO rating with historical trends and progression
- FR18: Players can analyze win rates across different roles and scenarios
- FR19: Players can view basic performance statistics and summaries
- FR20: Players can filter analytics by date range
- FR21: Players can filter analytics by role (Don, Mafia, Sheriff, Citizen)
- FR22: Players can view performance trends over time
- FR23: Players can compare performance across different roles

**Judge Analytics (Killer Feature):**

- FR24: Judges can view complete tournament history
- FR25: Judges can view games judged per month statistics
- FR26: Judges can track earnings and trends over time
- FR27: Judges can view judge performance metrics
- FR28: Judges can filter judge analytics by date range
- FR29: Judges can view judge analytics trends and patterns

**Timeline Visualization:**

- FR30: Users can view complete game history in an interactive timeline
- FR31: Users can filter timeline by date range
- FR32: Users can filter timeline by role
- FR33: Users can filter timeline by game outcome (win/loss)
- FR34: Timeline displays visual representation of performance over time
- FR35: Timeline is responsive and works on mobile devices
- FR36: Users can interact with timeline elements to view game details

**Club Analytics (Post-MVP):**

- FR37: Clubs can view member statistics and performance tracking
- FR38: Clubs can compare team performance
- FR39: Clubs can view club rankings
- FR40: Clubs can view engagement metrics
- FR41: Club administrators can manage club members
- FR42: Clubs can view club-level analytics dashboards

**Data Display & Navigation:**

- FR43: Users can navigate between different analytics sections with smooth animations and impressive layouts
- FR44: Users can access analytics from mobile devices via PWA with beautiful, modern interface
- FR45: Users can access previously loaded data offline (PWA)
- FR46: System displays data in responsive tables and charts with rich visualizations, high-quality images, and engaging animations
- FR47: Users can search for specific players or games with visual feedback and smooth interactions
- FR48: Users can view detailed information for individual games with impressive layouts and visual storytelling

**Visual Design & User Experience:**

- FR59: Interface uses modern, enticing, beautiful design (not minimalistic) with rich visual elements
- FR60: System displays high-quality images and visual assets that enhance the analytics experience
- FR61: Interface includes smooth, polished animations and transitions throughout user interactions
- FR62: System uses carefully curated color palettes that create visual interest while maintaining readability
- FR63: Interface includes comprehensive, beautiful iconography that enhances understanding and navigation
- FR64: Layouts are impressive and thoughtfully designed to showcase data in visually compelling ways
- FR65: Navigation system is visually appealing and intuitive with engaging visual feedback
- FR66: Interactive elements include delightful micro-interactions and animations that guide user attention

**Advanced Features (Post-MVP):**

- FR49: Users can create custom dashboards (Post-MVP)
- FR50: Users can export analytics data in PDF format (Post-MVP)
- FR51: Users can export analytics data as images (Post-MVP)
- FR52: Users can share analytics via social media (VK, Telegram) (Post-MVP)
- FR53: Users can compare performance with other players (Post-MVP)
- FR54: System can provide AI-powered insights and recommendations (Post-MVP)
- FR55: System can predict future performance trends (Post-MVP)

**Gamification (Post-MVP):**

- FR56: Users can earn achievements based on performance milestones (Post-MVP)
- FR57: Users can view leaderboards (Post-MVP)
- FR58: System can organize competitions and seasons (Post-MVP)

---

## Non-Functional Requirements

### Performance

**User-Facing Performance:**

- Time to First Insight: < 30 seconds from landing to seeing analytics
- Page load time: First Contentful Paint < 1.5 seconds
- Interactive elements respond to user input within 100ms
- Charts and visualizations render within 2 seconds
- Data import progress updates in real-time (< 1 second latency)

**Data Processing:**

- Import operations process data in batches for efficiency
- Analytics calculations complete within acceptable timeframes
- Database queries optimized for fast response times

### Security

**Authentication & Authorization:**

- Secure password storage using industry-standard hashing
- Session management with secure tokens
- Role-based access control (Guest, User, Admin)
- Protection against common web vulnerabilities (XSS, CSRF, SQL injection)

**Data Protection:**

- User data encrypted in transit (HTTPS)
- Sensitive data encrypted at rest
- Secure API endpoints with authentication
- Input validation and sanitization

**Privacy:**

- User data not shared with third parties without consent
- Compliance with data protection regulations
- Users can export and delete their data

### Scalability

**User Growth:**

- Platform supports increasing user base without degradation
- Database can handle growing data volumes
- Import operations scale with data volume
- Analytics calculations remain performant as data grows

**Infrastructure:**

- Horizontal scaling capability for increased load
- Efficient data storage and retrieval patterns
- Caching strategies for frequently accessed data

### Accessibility

- WCAG 2.1 Level AA compliance
- Keyboard navigation support for all interactive elements
- Screen reader compatibility with proper ARIA labels
- Color contrast ratios meet WCAG standards (4.5:1 for text)
- Focus indicators visible and clear
- Alternative text for charts and visualizations
- Responsive design works across device sizes

### Integration

**gomafia.pro Integration:**

- Robust web scraping with error handling
- Retry mechanisms with exponential backoff
- Change detection for gomafia.pro structure updates
- Data validation and quality checks
- Monitoring and alerting for integration failures

**Future Integrations:**

- API design allows for future third-party integrations
- Modular architecture supports additional data sources

---

## PRD Summary

This PRD defines **66 functional requirements** organized across 10 capability areas:

1. **User Account & Access** (FR1-FR6): Authentication, profiles, and role management
2. **Data Import & Synchronization** (FR7-FR15): gomafia.pro integration with quality validation
3. **Player Analytics** (FR16-FR23): Role-based performance metrics and trends
4. **Judge Analytics** (FR24-FR29): Unique judge-specific tracking and metrics
5. **Timeline Visualization** (FR30-FR36): Interactive historical data visualization
6. **Club Analytics** (FR37-FR42): Team-level insights (Post-MVP)
7. **Data Display & Navigation** (FR43-FR48): User interface and navigation capabilities
8. **Advanced Features** (FR49-FR55): Custom dashboards, exports, AI insights (Post-MVP)
9. **Gamification** (FR56-FR58): Achievements, leaderboards, competitions (Post-MVP)
10. **Visual Design & User Experience** (FR59-FR66): Modern, enticing design with animations, high-quality visuals, and impressive layouts

**Non-Functional Requirements** cover:

- Performance: < 30 seconds to first insight
- Security: Authentication, data protection, privacy
- Scalability: Support for growing user base and data volume
- Accessibility: WCAG 2.1 Level AA compliance
- Integration: Robust gomafia.pro data synchronization

**MVP Scope** focuses on:

- Player Analytics Dashboard
- Judge Analytics Dashboard (Killer Feature)
- Timeline Graph Visualization
- Data Import from gomafia.pro

**Success Criteria** emphasize:

- WOW moment: Users express amazement within 30 seconds (enhanced by beautiful, modern design)
- Judge segment engagement (highest-value users)
- Platform stability and reliability
- Mobile PWA experience quality with impressive visual design and smooth animations
- Visual design creates memorable, enticing first impression that drives engagement

## Product Value Summary

**Mafia Insight** transforms raw Mafia game data into actionable insights that help:

- **Players** understand performance patterns, identify strengths and weaknesses across roles, and track improvement over time
- **Judges** track professional activity, tournament history, earnings, and games judged—unique capability not available elsewhere
- **Clubs** analyze team dynamics, member performance, and club rankings

The platform's unique value comes from:

1. **Judge Analytics** - The killer feature that serves the highest-value user segment
2. **Role-Based Deep Analytics** - Specialized insights for Mafia game mechanics
3. **Complete Historical Data** - Full game history with interactive visualizations

Built as a mobile-first PWA, Mafia Insight delivers a native app-like experience accessible anywhere, anytime, without app store distribution.

---

_This PRD captures the essence of mafia-insight - a comprehensive analytics platform that transforms game data into meaningful insights for players, judges, and clubs._

_Created through collaborative discovery between k05m0navt and AI facilitator._
