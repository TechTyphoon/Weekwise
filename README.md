# Weekwise

Modern recurring schedule management system.

## 🌐 Live Demo

**[https://weekwise-five.vercel.app](https://weekwise-five.vercel.app)**

## 📸 Screenshots

### Home Page
![Home Page](./image.png)

### Scheduler Interface
![Scheduler](./Image2.png)

## Stack

- React 19 + TypeScript
- Hono + tRPC
- Prisma + PostgreSQL
- Better Auth
- Firebase (Auth + Firestore) for real-time data

## Setup

1. Clone and install:
```bash
git clone <repo-url>
cd assignment
bun install
```

2. Configure environment:

**Server** (`apps/server/.env`):
```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
CORS_ORIGIN="http://localhost:3001"
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

**Web** (`apps/web/.env`):
```env
VITE_SERVER_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

See `apps/web/FIREBASE.md` for detailed Firebase setup instructions.

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
- Authentication (Better Auth + Firebase)
- Real-time data dashboard with Firestore
- Live alerts and events feed
- Anonymous and email/password auth support

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
