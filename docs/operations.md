# Operations Guide

This document provides operational guidance for maintaining, troubleshooting, and monitoring the Weekwise scheduler application.

## Table of Contents

- [Development Workflow](#development-workflow)
- [Database Operations](#database-operations)
- [Deployment Operations](#deployment-operations)
- [Monitoring & Logging](#monitoring--logging)
- [Backup & Recovery](#backup--recovery)
- [Common Issues](#common-issues)
- [Maintenance Tasks](#maintenance-tasks)
- [Performance Tuning](#performance-tuning)

## Development Workflow

### Starting Development

```bash
# Full stack (recommended for development)
bun run dev

# Or start services individually
bun run dev:server    # Backend on port 3000
bun run dev:web       # Frontend on port 3001
```

### Making Changes

1. **Backend Changes**:
   - Edit files in `apps/server/src/`
   - Bun hot reload may not always work - restart if needed
   - Check terminal for errors

2. **Frontend Changes**:
   - Edit files in `apps/web/src/`
   - Vite HMR usually works instantly
   - Check browser console for errors

3. **Database Schema Changes**:
   ```bash
   # 1. Edit Prisma schema files in apps/server/prisma/schema/
   
   # 2. For development (overwrites database):
   bun run db:push
   
   # 3. For production (creates migration):
   bun run db:migrate
   ```

### Type Checking

```bash
# Check all projects
bun run check-types

# Check individual projects
cd apps/server && bun run check-types
cd apps/web && bun run check-types
```

### Building for Production

```bash
# Build all apps
bun run build

# Build individually
cd apps/server && bun run build
cd apps/web && bun run build
```

## Database Operations

### Prisma Commands

#### Development

```bash
# Push schema changes without migrations (destructive)
bun run db:push

# Open Prisma Studio (database GUI)
bun run db:studio

# Generate Prisma Client after schema changes
bun run db:generate
```

#### Production

```bash
# Create a new migration
bun run db:migrate

# Apply pending migrations
cd apps/server
bunx prisma migrate deploy

# Reset database (WARNING: destroys all data)
bunx prisma migrate reset
```

### Manual Database Access

Using `psql`:

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:5432/scheduler

# Common queries
\dt                                    # List tables
SELECT * FROM user;                    # View users
SELECT * FROM schedule WHERE "userId" = 'user-id';  # User schedules
SELECT * FROM schedule_exception;      # View exceptions
```

Using Docker:

```bash
# Access PostgreSQL in Docker container
docker exec -it weekwise-postgres psql -U postgres -d scheduler
```

### Database Backup

#### Local Development

```bash
# Backup
docker exec weekwise-postgres pg_dump -U postgres scheduler > backup.sql

# Restore
docker exec -i weekwise-postgres psql -U postgres scheduler < backup.sql
```

#### Production (Render/Managed DB)

Most managed PostgreSQL services provide automatic backups. For manual backups:

```bash
# Get connection string from environment
DATABASE_URL="postgresql://user:pass@host:port/db"

# Backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore
psql $DATABASE_URL < backup-20241016.sql
```

### Data Integrity Checks

```sql
-- Check for orphaned schedules (users deleted but schedules remain)
SELECT s.id, s."userId" FROM schedule s
LEFT JOIN "user" u ON s."userId" = u.id
WHERE u.id IS NULL;

-- Check for orphaned exceptions
SELECT e.id, e."scheduleId" FROM schedule_exception e
LEFT JOIN schedule s ON e."scheduleId" = s.id
WHERE s.id IS NULL;

-- Check for invalid time ranges
SELECT * FROM schedule 
WHERE "startTime" >= "endTime";

-- Check for users with > 2 slots per day
SELECT "userId", "dayOfWeek", COUNT(*) as count
FROM schedule
WHERE "isActive" = true
GROUP BY "userId", "dayOfWeek"
HAVING COUNT(*) > 2;
```

## Deployment Operations

### Frontend (Vercel)

#### Initial Setup

1. Connect GitHub repository to Vercel
2. Configure build settings:
   - Framework: Vite
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && bun install && bun run build --filter=web`
   - Output Directory: `dist`
3. Set environment variables:
   - `VITE_API_URL`: Backend URL

#### Deployments

- **Automatic**: Push to `main` branch triggers deployment
- **Manual**: Use Vercel CLI or dashboard "Deploy" button
- **Preview**: Pull requests get preview deployments

#### Rollback

```bash
# Using Vercel CLI
vercel rollback [deployment-url]

# Or use Vercel dashboard > Deployments > Promote to Production
```

### Backend (Render)

#### Initial Setup

1. Create Web Service in Render
2. Connect GitHub repository
3. Configure:
   - Environment: Node
   - Build Command: `bun install && bun run build && bun run db:generate`
   - Start Command: `bun run start`
   - Root Directory: `apps/server`
4. Add PostgreSQL database
5. Set environment variables (see below)
6. Run initial migration:
   ```bash
   # SSH into Render instance or use dashboard shell
   cd apps/server
   bunx prisma migrate deploy
   ```

#### Environment Variables

Required in production:

```bash
DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
CORS_ORIGIN="https://your-frontend.vercel.app"
BETTER_AUTH_SECRET="secure-random-string-32-chars"
BETTER_AUTH_URL="https://your-backend.onrender.com"
NODE_ENV="production"
```

#### Deployments

- **Automatic**: Push to `main` branch triggers deployment
- **Manual**: Dashboard > Manual Deploy

#### Logs

```bash
# View logs in Render dashboard
# Or use Render API
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  https://api.render.com/v1/services/{service-id}/logs
```

### Docker Deployment

#### Build & Run

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Run migrations
docker-compose exec server bun run db:push

# View logs
docker-compose logs -f server
docker-compose logs -f web
```

#### Update Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Run migrations
docker-compose exec server bunx prisma migrate deploy
```

#### Health Check

```bash
# Check container status
docker-compose ps

# Test API health
curl http://localhost:3000/health

# Test frontend
curl http://localhost:3001
```

## Monitoring & Logging

### Application Logs

#### Development

- **Backend**: Terminal running `bun run dev:server`
- **Frontend**: Browser console and terminal running `bun run dev:web`

#### Production

- **Vercel**: Dashboard > Deployments > [Deployment] > Build Logs & Function Logs
- **Render**: Dashboard > Logs tab
- **Docker**: `docker-compose logs -f [service-name]`

### Health Checks

#### Backend Health Endpoint

```bash
# Health check
curl http://localhost:3000/health

# Expected response
{"status":"healthy","timestamp":"2024-10-16T..."}

# Root endpoint
curl http://localhost:3000/

# Expected response
OK
```

#### Database Connection Check

```bash
# From server directory
cd apps/server
bunx prisma db pull

# Success = database is reachable
# Failure = connection issues
```

### Monitoring Checklist

Daily:
- [ ] Check application is accessible
- [ ] Verify health endpoints return 200
- [ ] Check error logs for critical issues

Weekly:
- [ ] Review database backup status
- [ ] Check disk space usage
- [ ] Review response times
- [ ] Check for dependency updates

Monthly:
- [ ] Review security advisories
- [ ] Analyze usage patterns
- [ ] Clean up old logs
- [ ] Test backup restoration

## Backup & Recovery

### Automated Backups

#### Managed Database (Recommended)

Render, Heroku, AWS RDS, etc. provide automatic backups:
- Configure daily backups
- Set retention period (7-30 days recommended)
- Test restoration quarterly

#### Manual Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
DATABASE_URL="your-connection-string"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/weekwise_$DATE.sql

# Compress
gzip $BACKUP_DIR/weekwise_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: weekwise_$DATE.sql.gz"
```

Schedule with cron:
```cron
0 2 * * * /path/to/backup.sh >> /var/log/weekwise-backup.log 2>&1
```

### Disaster Recovery

#### Scenario: Database Corruption

1. Stop the application
2. Restore from latest backup:
   ```bash
   psql $DATABASE_URL < backup-latest.sql
   ```
3. Run migrations to ensure schema is current:
   ```bash
   bunx prisma migrate deploy
   ```
4. Restart application
5. Verify data integrity

#### Scenario: Accidental Data Deletion

If user accidentally deletes schedules:

1. Check if soft-deleted (query `isActive = false`)
2. If soft-deleted, restore:
   ```sql
   UPDATE schedule 
   SET "isActive" = true 
   WHERE id = X AND "userId" = 'Y';
   ```
3. If hard-deleted, restore from backup:
   - Restore backup to temporary database
   - Export affected records
   - Import to production database

#### Scenario: Complete Infrastructure Failure

1. Provision new infrastructure (servers, database)
2. Restore database from backup
3. Deploy latest application code
4. Update DNS/environment variables
5. Verify all services operational

## Common Issues

### Issue: Port Already in Use

**Symptoms**: `Error: listen EADDRINUSE :::3000`

**Solution**:
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Issue: Database Connection Refused

**Symptoms**: `Error: Can't reach database server`

**Solutions**:

1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   # Or
   sudo systemctl status postgresql
   ```

2. Verify DATABASE_URL:
   ```bash
   # Test connection
   psql $DATABASE_URL
   ```

3. Check firewall rules:
   ```bash
   sudo ufw status
   ```

### Issue: CORS Errors

**Symptoms**: `Access-Control-Allow-Origin header` errors in browser

**Solutions**:

1. Verify `CORS_ORIGIN` in backend `.env` matches frontend URL exactly
2. For multiple origins:
   ```env
   CORS_ORIGIN="http://localhost:3001,https://app.vercel.app"
   ```
3. Check for trailing slashes (should NOT have them)
4. Clear browser cache and restart dev servers

### Issue: Prisma Client Out of Sync

**Symptoms**: Type errors or `Unknown field` errors

**Solution**:
```bash
cd apps/server
bun run db:generate
cd ../..
bun run check-types
```

### Issue: Authentication Not Persisting

**Symptoms**: User logged out on page refresh

**Solutions**:

1. Check `BETTER_AUTH_SECRET` is consistent
2. Verify cookie settings in browser DevTools
3. Ensure `BETTER_AUTH_URL` matches actual backend URL
4. For cross-origin:
   - Set `sameSite: "none"` and `secure: true`
   - Use HTTPS for both frontend and backend

### Issue: Slow Query Performance

**Symptoms**: API responses taking > 1 second

**Solutions**:

1. Add database indexes:
   ```sql
   CREATE INDEX idx_schedule_user_day ON schedule("userId", "dayOfWeek");
   CREATE INDEX idx_exception_schedule_date ON schedule_exception("scheduleId", date);
   ```

2. Analyze query plans:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM schedule WHERE "userId" = 'X';
   ```

3. Check connection pool:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
     connectionLimit = 10
   }
   ```

## Maintenance Tasks

### Dependency Updates

```bash
# Check for outdated packages
bun outdated

# Update dependencies
bun update

# Update specific package
bun add package-name@latest

# After updating, test thoroughly
bun run check-types
bun run build
bun run dev
```

### Database Maintenance

#### Vacuum (PostgreSQL)

Reclaim storage and update statistics:

```sql
-- Vacuum all tables
VACUUM ANALYZE;

-- Vacuum specific table
VACUUM ANALYZE schedule;
```

#### Reindex

```sql
REINDEX DATABASE scheduler;
```

### Log Rotation

If using custom logging:

```bash
# /etc/logrotate.d/weekwise
/var/log/weekwise/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

### Security Updates

1. Check for security advisories:
   ```bash
   bun audit
   ```

2. Update vulnerable packages:
   ```bash
   bun audit fix
   ```

3. Review Dependabot PRs on GitHub

## Performance Tuning

### Database Optimization

1. **Add Indexes** (if not already present):
   ```sql
   CREATE INDEX IF NOT EXISTS idx_schedule_user_day 
   ON schedule("userId", "dayOfWeek") WHERE "isActive" = true;
   
   CREATE INDEX IF NOT EXISTS idx_exception_schedule_date 
   ON schedule_exception("scheduleId", date);
   
   CREATE INDEX IF NOT EXISTS idx_session_token 
   ON session(token);
   ```

2. **Connection Pooling**:
   ```env
   # In DATABASE_URL
   DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=30"
   ```

3. **Query Optimization**:
   - Use `select` to fetch only needed fields
   - Use `include` to avoid N+1 queries
   - Add date range filters to limit result sets

### Frontend Optimization

1. **Code Splitting**: Already implemented via TanStack Router

2. **Image Optimization**: Use WebP format, lazy loading

3. **Caching Strategy**:
   ```typescript
   // Increase cache time for stable data
   staleTime: 5 * 60 * 1000, // 5 minutes
   cacheTime: 10 * 60 * 1000, // 10 minutes
   ```

4. **Bundle Analysis**:
   ```bash
   cd apps/web
   bunx vite-bundle-visualizer
   ```

### Backend Optimization

1. **Response Compression**: Already enabled in Hono

2. **Rate Limiting** (add if needed):
   ```typescript
   import { rateLimiter } from 'hono/rate-limiter'
   
   app.use(rateLimiter({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100, // limit each IP to 100 requests per windowMs
   }))
   ```

3. **Caching Layer** (Redis for sessions):
   ```typescript
   // Future enhancement - use Redis for session storage
   import { RedisStore } from 'better-auth/adapters/redis'
   ```

---

## Emergency Contacts

**Critical Issues**:
- Check GitHub Issues: [repo-url]/issues
- Review logs first before escalating
- Document all steps taken

**Response Times**:
- P0 (Production Down): Immediate
- P1 (Major Feature Broken): Within 2 hours
- P2 (Minor Issues): Within 1 day
- P3 (Enhancement): Next sprint

---

**Note**: This operations guide is specific to the Weekwise scheduler application. It does not cover Firebase operations, blockchain monitoring, or AI service management, as those are not part of this codebase.
