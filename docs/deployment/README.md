# Deployment Guide

This guide covers deploying the Mafia Insight application to various platforms and environments.

## Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- Supabase account
- Domain name (for production)
- SSL certificate (for production)

## Environment Setup

### Environment Variables

Create `.env.local` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mafia_insight"
DIRECT_URL="postgresql://username:password@localhost:5432/mafia_insight"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"

# Application
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://mafiainsight.com"
```

### Database Setup

1. **Create PostgreSQL database:**

```sql
CREATE DATABASE mafia_insight;
CREATE USER mafia_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE mafia_insight TO mafia_user;
```

2. **Run migrations:**

```bash
yarn db:migrate
```

3. **Seed initial data:**

```bash
yarn db:seed
```

## Local Development

### Quick Start

```bash
# Install dependencies
yarn install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start development server
yarn dev
```

### Development Database

```bash
# Reset database
yarn db:reset

# View database in Prisma Studio
yarn db:studio
```

## Production Deployment

### Vercel (Recommended)

1. **Connect repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings

2. **Set environment variables in Vercel:**
   - Go to Project Settings > Environment Variables
   - Add all required environment variables
   - Set `NODE_ENV=production`

3. **Configure build settings:**

   ```json
   {
     "buildCommand": "yarn build",
     "outputDirectory": ".next",
     "installCommand": "yarn install"
   }
   ```

4. **Deploy:**
   - Push to main branch
   - Vercel automatically deploys

### Docker Deployment

1. **Create Dockerfile:**

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Create docker-compose.yml:**

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=mafia_insight
      - POSTGRES_USER=mafia_user
      - POSTGRES_PASSWORD=secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

3. **Deploy:**

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### AWS Deployment

1. **Set up AWS infrastructure:**
   - RDS PostgreSQL instance
   - ECS or EC2 for application
   - Application Load Balancer
   - Route 53 for DNS

2. **Deploy with ECS:**

```bash
# Build and push Docker image
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker build -t mafia-insight .
docker tag mafia-insight:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/mafia-insight:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/mafia-insight:latest
```

3. **Update ECS service:**
   - Create new task definition
   - Update service with new task definition

### Google Cloud Platform

1. **Set up GCP resources:**
   - Cloud SQL PostgreSQL
   - Cloud Run or GKE
   - Cloud Load Balancing

2. **Deploy to Cloud Run:**

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT-ID/mafia-insight
gcloud run deploy --image gcr.io/PROJECT-ID/mafia-insight --platform managed
```

## Database Management

### Migrations

```bash
# Create new migration
yarn prisma migrate dev --name migration_name

# Apply migrations to production
yarn prisma migrate deploy

# Reset database (development only)
yarn prisma migrate reset
```

### Backups

```bash
# Create backup
pg_dump -h localhost -U mafia_user -d mafia_insight > backup.sql

# Restore backup
psql -h localhost -U mafia_user -d mafia_insight < backup.sql
```

## Monitoring and Logging

### Application Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Sentry**: Error tracking and performance monitoring
- **Uptime Robot**: Uptime monitoring

### Logging

```bash
# View application logs
yarn logs

# View specific service logs
yarn logs --service=api
```

### Performance Monitoring

- Access performance dashboard at `/admin/performance`
- Monitor theme switching performance (< 500ms)
- Monitor navigation updates (< 1s)
- Monitor authentication completion (< 30s)

## Security

### SSL/TLS

- Use Let's Encrypt for free SSL certificates
- Configure HTTPS redirects
- Set secure headers

### Environment Security

- Never commit `.env` files
- Use secrets management for production
- Rotate API keys regularly
- Enable database encryption

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
];
```

## Testing in Production

### Health Checks

```bash
# Check application health
curl https://mafiainsight.com/api/health

# Check database connection
curl https://mafiainsight.com/api/health/db
```

### Load Testing

```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

### Performance Testing

```bash
# Run performance tests
yarn test:e2e --project=performance

# Generate performance report
yarn test:coverage:dashboard
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Check DATABASE_URL format
   - Verify database is running
   - Check network connectivity

2. **Build Failures:**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Check environment variables

3. **Performance Issues:**
   - Check database query performance
   - Monitor memory usage
   - Review error logs

### Debug Mode

```bash
# Enable debug logging
DEBUG=* yarn dev

# Enable specific debug namespaces
DEBUG=mafia-insight:* yarn dev
```

### Log Analysis

```bash
# View error logs
grep "ERROR" logs/app.log

# View performance logs
grep "PERFORMANCE" logs/app.log

# View access logs
tail -f logs/access.log
```

## Rollback Procedures

### Application Rollback

```bash
# Vercel rollback
vercel rollback [deployment-url]

# Docker rollback
docker-compose down
docker-compose up -d --scale app=0
# Deploy previous version
docker-compose up -d
```

### Database Rollback

```bash
# Rollback last migration
yarn prisma migrate resolve --rolled-back [migration-name]

# Restore from backup
psql -h localhost -U mafia_user -d mafia_insight < backup.sql
```

## Maintenance

### Regular Tasks

- **Daily**: Monitor error logs and performance metrics
- **Weekly**: Review security updates and dependencies
- **Monthly**: Database maintenance and cleanup
- **Quarterly**: Security audit and penetration testing

### Updates

```bash
# Update dependencies
yarn upgrade

# Update Next.js
yarn add next@latest

# Update Prisma
yarn add prisma@latest @prisma/client@latest
```

## Support

For deployment issues:

- **Documentation**: [docs.mafiainsight.com/deployment](https://docs.mafiainsight.com/deployment)
- **Issues**: [GitHub Issues](https://github.com/mafia-insight/deployment/issues)
- **Email**: devops@mafiainsight.com
