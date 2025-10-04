# Scheduler

Weekly time slot management system with recurring schedules.

## Stack

- React 19 + TypeScript
- Hono + tRPC
- Prisma + PostgreSQL
- Better Auth

## Setup

1. Clone and install:
```bash
git clone <repo-url>
cd assignment
bun install
```

2. Configure environment (`apps/server/.env`):
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
CORS_ORIGIN="http://localhost:3001"
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

3. Setup database:
```bash
bun run db:push
```

4. Start dev servers:
```bash
bun run dev
```

Frontend: http://localhost:3001  
Backend: http://localhost:3000

## Features

- Recurring weekly schedules
- Exception handling (edit/delete specific dates)
- Up to 2 slots per day
- Infinite scroll week navigation
- Authentication

## Project Structure

```
apps/
├── server/    # Hono API + tRPC
└── web/       # React frontend
```

## Scripts

```bash
bun run dev          # Start all
bun run dev:server   # Backend only
bun run dev:web      # Frontend only
bun run db:push      # Update database
bun run db:studio    # Prisma studio
```
