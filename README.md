# Mafia Insight - Game Analytics Platform

A comprehensive analytics platform for Sport Mafia game players, teams, and tournaments. Built with Next.js 14, TypeScript, and modern web technologies.

## 🎯 Features

### Player Analytics

- **Role-based Performance**: Track performance across Don, Mafia, Sheriff, and Citizen roles
- **ELO Rating System**: Monitor skill progression with detailed rating history
- **Win Rate Analysis**: Analyze success rates across different game scenarios
- **Historical Trends**: View performance trends over time with interactive charts

### Team Analytics

- **Club Management**: Create and manage gaming clubs
- **Member Statistics**: Track individual and team performance
- **Collaborative Insights**: Share analytics with team members
- **Team Rankings**: Compare club performance across the platform

### Tournament Analytics

- **Live Updates**: Real-time tournament progress tracking
- **Bracket Visualization**: Interactive tournament brackets
- **Participant Tracking**: Monitor player performance in tournaments
- **Prize Pool Management**: Track tournament rewards and payouts

### Progressive Web App (PWA)

- **Offline Support**: Access analytics even without internet connection
- **Mobile Optimized**: Native app-like experience on mobile devices
- **Push Notifications**: Get notified about tournament updates and achievements
- **Installable**: Add to home screen for quick access

## 🚀 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **ShadCN/UI** - Component library
- **TanStack Query** - Server state management
- **Zustand** - Client state management

### Backend

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Primary database
- **Prisma ORM** - Database toolkit
- **NextAuth.js** - Authentication
- **Redis** - Caching and sessions

### Development

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Jest** - Unit testing
- **Playwright** - E2E testing

## 📦 Installation

### Prerequisites

- Node.js 18+
- Yarn package manager
- PostgreSQL database
- Redis server

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/mafia-insight.git
   cd mafia-insight
   ```

2. **Install dependencies**

   ```bash
   yarn install
   ```

3. **Environment Configuration**

   ```bash
   cp .env.example .env.local
   ```

   Update the environment variables with your configuration.

4. **Database Setup**

   ```bash
   # Generate Prisma client
   yarn db:generate

   # Run database migrations
   yarn db:migrate

   # Seed the database (optional)
   yarn db:seed
   ```

5. **Start Development Server**
   ```bash
   yarn dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Analytics dashboard routes
│   ├── api/               # API routes
│   └── globals.css        # Global styles
├── components/            # Reusable UI components
│   ├── ui/               # ShadCN/UI components
│   ├── analytics/        # Analytics-specific components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database connection
│   ├── validations.ts   # Zod schemas
│   └── utils.ts         # General utilities
├── hooks/               # Custom React hooks
├── store/               # Zustand state management
├── types/               # TypeScript type definitions
└── styles/              # Tailwind CSS styles
```

## 🔧 Development

### Available Scripts

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server

# Code Quality
yarn lint             # Run ESLint
yarn lint:fix         # Fix ESLint issues
yarn format           # Format code with Prettier
yarn type-check       # Run TypeScript checks

# Testing
yarn test             # Run unit tests
yarn test:watch       # Run tests in watch mode
yarn test:coverage    # Run tests with coverage
yarn test:e2e         # Run E2E tests

# Database
yarn db:generate      # Generate Prisma client
yarn db:migrate       # Run database migrations
yarn db:deploy        # Deploy migrations to production
yarn db:seed          # Seed database with sample data
yarn db:reset         # Reset database
yarn db:studio        # Open Prisma Studio
```

### Code Quality

The project enforces high code quality standards:

- **ESLint** configuration for consistent code style
- **Prettier** for automatic code formatting
- **Husky** git hooks for pre-commit checks
- **TypeScript** for type safety
- **Testing** with Jest and Playwright

### Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users** - Platform users with authentication
- **Players** - Individual game players
- **Clubs** - Gaming teams and organizations
- **Games** - Individual game instances
- **Tournaments** - Competitive events
- **Analytics** - Pre-computed metrics and statistics

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   - Link your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard

2. **Database Setup**
   - Set up Supabase project
   - Configure database connection string

3. **Deploy**
   - Automatic deployments on push to main branch
   - Preview deployments for pull requests

### Environment Variables

Required environment variables for production:

```bash
# Database
DATABASE_URL="postgresql://..."

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Authentication
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="..."

# OAuth Providers
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

## 📱 PWA Features

The application is a Progressive Web App with the following features:

- **Offline Support** - Access analytics without internet
- **Mobile Optimized** - Responsive design for all devices
- **Installable** - Add to home screen on mobile devices
- **Push Notifications** - Real-time updates for tournaments
- **Background Sync** - Sync data when connection is restored

## 🔒 Security

- **Authentication** - Secure user authentication with NextAuth.js
- **Authorization** - Role-based access control
- **Data Validation** - Input validation with Zod schemas
- **Rate Limiting** - API rate limiting to prevent abuse
- **HTTPS** - Secure connections in production

## 📊 Analytics & Monitoring

- **Error Tracking** - Sentry integration for error monitoring
- **Performance Monitoring** - Core Web Vitals tracking
- **User Analytics** - Google Analytics integration
- **Database Monitoring** - Query performance tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [ShadCN/UI](https://ui.shadcn.com/) - Component library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Prisma](https://prisma.io/) - Database toolkit

## 📞 Support

For support, email support@mafia-insight.com or join our Discord community.

---

**Built with ❤️ for the Mafia gaming community**
