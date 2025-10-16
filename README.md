# Weekwise

Modern recurring schedule management system with exception handling and authentication.

## 🌐 Live Demo

**[https://weekwise-five.vercel.app](https://weekwise-five.vercel.app)**

## 📸 Screenshots

### Home Page
![Home Page](./image.png)

### Scheduler Interface
![Scheduler](./Image2.png)

## 📋 Overview

Weekwise is a full-stack TypeScript application for managing recurring weekly schedules with exception handling. Users can:

- Create up to 2 recurring time slots per day of the week
- Edit specific dates without affecting the recurring pattern (exceptions)
- Delete slots for specific dates
- View schedules with infinite week scrolling
- Manage schedules with optimistic UI updates and real-time feedback

## 🏗️ Stack

### Backend
- **Runtime**: Bun (with Node.js fallback)
- **Framework**: [Hono](https://hono.dev/) - Lightweight web framework
- **API**: [tRPC](https://trpc.io/) - End-to-end typesafe APIs
- **Database**: PostgreSQL with [Prisma](https://www.prisma.io/) ORM
- **Authentication**: [Better Auth](https://www.better-auth.com/) - Modern auth library

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: [TanStack Router](https://tanstack.com/router) - Type-safe routing
- **State Management**: [TanStack Query](https://tanstack.com/query) - Data fetching & caching
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: Custom components inspired by shadcn/ui
- **Build Tool**: Vite

### DevOps
- **Monorepo**: Turborepo for build orchestration
- **Package Manager**: Bun
- **Containerization**: Docker & Docker Compose
- **Deployment**: Vercel (frontend), Render (backend)

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.2.23 or later (or Node.js 18+)
- PostgreSQL 15 or later
- Git

### Option 1: Docker Compose (Recommended)

The fastest way to get started:

```bash
# Clone the repository
git clone <repo-url>
cd weekwise

# Start all services (PostgreSQL, backend, frontend)
docker-compose up

# In another terminal, run database migrations
docker-compose exec server bun run db:push
```

Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:3000
- PostgreSQL: localhost:5432

### Option 2: Manual Setup

#### 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd weekwise
bun install
```

#### 2. Setup PostgreSQL Database

Start PostgreSQL using Docker:

```bash
docker run -d \
  --name weekwise-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=scheduler \
  -p 5432:5432 \
  postgres:15
```

Or use an existing PostgreSQL instance.

#### 3. Configure Environment Variables

Create `apps/server/.env`:

```bash
cp apps/server/.env.example apps/server/.env
```

Edit `apps/server/.env`:

```env
# Database Connection
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scheduler"

# CORS Configuration (frontend URL)
CORS_ORIGIN="http://localhost:3001"

# Better Auth Configuration
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"
BETTER_AUTH_URL="http://localhost:3000"
```

**Important**: Generate a secure `BETTER_AUTH_SECRET` for production:
```bash
openssl rand -base64 32
```

Create `apps/web/.env` (optional):

```env
VITE_API_URL="http://localhost:3000"
```

#### 4. Initialize Database

```bash
# Generate Prisma client and push schema to database
bun run db:push
```

#### 5. Start Development Servers

```bash
# Start both frontend and backend
bun run dev

# Or start individually:
bun run dev:server  # Backend only (http://localhost:3000)
bun run dev:web     # Frontend only (http://localhost:3001)
```

## 🔧 Environment Variables

### Backend (`apps/server/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CORS_ORIGIN` | ✅ | Allowed frontend origin(s), comma-separated | `http://localhost:3001` |
| `BETTER_AUTH_SECRET` | ✅ | Secret key for auth token signing | Generate with `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | ✅ | Backend URL for auth callbacks | `http://localhost:3000` |
| `PORT` | ❌ | Server port (default: 3000) | `3000` |
| `HOST` | ❌ | Server host (default: 0.0.0.0) | `0.0.0.0` |
| `NODE_ENV` | ❌ | Environment mode | `development` or `production` |

### Frontend (`apps/web/.env`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | ❌ | Backend API URL (default: http://localhost:3000) | `http://localhost:3000` |

## 📜 Available Scripts

### Root Level

```bash
bun run dev              # Start all services in dev mode
bun run build            # Build all apps
bun run check-types      # Type check all projects

# Individual app development
bun run dev:server       # Start backend only
bun run dev:web          # Start frontend only

# Database operations
bun run db:push          # Push Prisma schema to database (for development)
bun run db:migrate       # Create and apply migrations (for production)
bun run db:generate      # Generate Prisma client
bun run db:studio        # Open Prisma Studio (database GUI)
```

### Server (`apps/server`)

```bash
cd apps/server

bun run dev              # Start development server with hot reload
bun run build            # Build for production
bun run start            # Start production server
bun run check-types      # Run TypeScript type checking
bun run compile          # Create standalone executable

# Database
bun run db:push          # Push schema changes (development)
bun run db:migrate       # Create migrations (production)
bun run db:generate      # Generate Prisma client
bun run db:studio        # Open Prisma Studio
```

### Web (`apps/web`)

```bash
cd apps/web

bun run dev              # Start development server
bun run build            # Build for production
bun run serve            # Preview production build
bun run check-types      # Run TypeScript type checking
```

## 🚢 Deployment

### Frontend (Vercel)

The frontend is configured for deployment on Vercel:

1. Push your code to GitHub
2. Import the repository in Vercel
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && bun install && bun run build --filter=web`
   - **Output Directory**: `dist`

4. Set environment variables:
   - `VITE_API_URL`: Your backend API URL

The `vercel.json` in the project root handles this configuration automatically.

### Backend (Render)

The backend is configured for deployment on Render:

1. Push your code to GitHub
2. Create a new Web Service in Render
3. Connect your repository
4. Use the provided `render.yaml` configuration or manually configure:
   - **Environment**: Node
   - **Build Command**: `bun install && bun run build && bun run db:generate`
   - **Start Command**: `bun run start`
   - **Root Directory**: `apps/server`

5. Set environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://your-app.vercel.app`)
   - `BETTER_AUTH_SECRET`: Generate secure key with `openssl rand -base64 32`
   - `BETTER_AUTH_URL`: Your backend URL (e.g., `https://your-api.onrender.com`)

6. Add a PostgreSQL database:
   - Create a PostgreSQL instance in Render
   - Link it to your web service
   - Run migrations: `bun run db:migrate`

### Docker Deployment

Build and deploy using Docker:

```bash
# Build images
docker-compose build

# Deploy to production
docker-compose up -d

# Run migrations
docker-compose exec server bun run db:push
```

For production, update the `docker-compose.yml` with your environment variables and use a managed PostgreSQL service.

## 🧪 Testing the API

### Health Check

```bash
curl http://localhost:3000/health
```

### tRPC Endpoints

The backend exposes tRPC procedures at `/trpc/*`. Use the frontend or a tRPC client to interact with:

- `healthCheck` - Public health check
- `scheduler.createSchedule` - Create recurring schedule
- `scheduler.getSchedulesForWeek` - Fetch week schedules
- `scheduler.updateSlot` - Edit specific date (creates exception)
- `scheduler.deleteSlot` - Delete slot for specific date
- `scheduler.deleteSchedule` - Soft-delete entire recurring schedule

See `docs/architecture.md` for detailed API documentation.

## 🔍 Troubleshooting

### Database Connection Issues

**Problem**: `Error: Can't reach database server`

**Solutions**:
1. Ensure PostgreSQL is running:
   ```bash
   # Check Docker container
   docker ps | grep postgres
   
   # Or check local PostgreSQL service
   sudo systemctl status postgresql
   ```

2. Verify `DATABASE_URL` in `.env`:
   - Check host, port, username, password, database name
   - For Docker: use `localhost:5432`
   - For Docker Compose services: use service name (e.g., `postgres:5432`)

3. Test connection:
   ```bash
   cd apps/server
   bun run db:studio
   ```

### CORS Errors

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solutions**:
1. Verify `CORS_ORIGIN` in backend `.env` matches frontend URL exactly
2. For multiple origins, use comma-separated list:
   ```env
   CORS_ORIGIN="http://localhost:3001,http://127.0.0.1:3001"
   ```
3. Check browser console for the actual origin being used

### Authentication Issues

**Problem**: User login not persisting or authentication errors

**Solutions**:
1. Clear browser cookies and local storage
2. Ensure `BETTER_AUTH_SECRET` is set and consistent across restarts
3. Verify `BETTER_AUTH_URL` matches your backend URL
4. Check that database has `user`, `session`, and `account` tables:
   ```bash
   bun run db:studio
   ```

### Hot Reload Not Working

**Problem**: Changes not reflecting in development

**Solutions**:
1. Backend: Restart the dev server (Bun hot reload has known limitations)
2. Frontend: Check for TypeScript errors in console
3. Clear `.turbo` cache:
   ```bash
   rm -rf .turbo node_modules/.cache
   ```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Kill the process using the port:
   ```bash
   # Find process
   lsof -i :3000
   
   # Kill it
   kill -9 <PID>
   ```
2. Or change the port in `.env`:
   ```env
   PORT=3001
   ```

### Prisma Client Issues

**Problem**: `PrismaClient is unable to be run in the browser` or type errors

**Solutions**:
1. Regenerate Prisma client:
   ```bash
   bun run db:generate
   ```
2. Clear cache and reinstall:
   ```bash
   rm -rf node_modules apps/server/node_modules
   bun install
   bun run db:generate
   ```

### Docker Compose Issues

**Problem**: Services failing to start or communicate

**Solutions**:
1. Rebuild containers:
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```
2. Check logs:
   ```bash
   docker-compose logs server
   docker-compose logs postgres
   ```
3. Verify network connectivity:
   ```bash
   docker-compose exec server ping postgres
   ```

## 📂 Project Structure

```
weekwise/
├── apps/
│   ├── server/              # Backend API
│   │   ├── prisma/          # Database schema and migrations
│   │   │   └── schema/
│   │   │       ├── schema.prisma    # Prisma config
│   │   │       └── auth.prisma      # User, Session, Schedule models
│   │   ├── src/
│   │   │   ├── db/          # Database client
│   │   │   ├── lib/         # Auth and tRPC setup
│   │   │   ├── routers/     # tRPC routers
│   │   │   │   ├── index.ts         # Root router
│   │   │   │   └── scheduler.ts     # Schedule CRUD operations
│   │   │   └── index.ts     # Server entry point
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                 # Frontend React app
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── lib/         # tRPC client, utils
│       │   ├── routes/      # TanStack Router pages
│       │   │   ├── __root.tsx       # Root layout
│       │   │   ├── index.tsx        # Home page
│       │   │   ├── login.tsx        # Login page
│       │   │   └── scheduler.tsx    # Main scheduler UI
│       │   ├── types/       # TypeScript types
│       │   ├── utils/       # Helper functions
│       │   └── main.tsx     # App entry point
│       ├── .env.example
│       ├── Dockerfile
│       └── package.json
│
├── docs/                    # Documentation
│   ├── architecture.md      # System architecture
│   └── ...
│
├── docker-compose.yml       # Multi-container setup
├── turbo.json              # Turborepo config
├── package.json            # Root workspace config
├── render.yaml             # Render deployment config
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

## 🎯 Key Features

### Recurring Schedules
- Create recurring time slots for any day of the week (Sunday-Saturday)
- Limit of 2 slots per day per user
- Validation: end time must be after start time
- Soft delete: schedules marked inactive instead of deleted

### Exception Handling
- Edit specific dates without affecting the recurring pattern
- Delete slots for specific dates
- Exceptions stored separately from recurring schedules
- Automatic exception lookup during schedule generation

### Authentication
- Email/password authentication via Better Auth
- Session-based authentication with secure cookies
- Protected routes and API endpoints
- User-scoped data (each user sees only their schedules)

### User Experience
- Infinite week scrolling (past and future)
- Optimistic UI updates for instant feedback
- Toast notifications for actions
- Dark/light theme support
- Responsive design for mobile and desktop
- Only shows current and future dates (hides past slots)

## 📚 Documentation

For more detailed information, see:

- [**Architecture Documentation**](./docs/architecture.md) - System design, database schema, API details, data flow
- [**API Reference**](./docs/api.md) - Detailed tRPC procedure documentation
- [**Development Guide**](./docs/development.md) - Development best practices and workflows

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run type checking: `bun run check-types`
4. Test locally with `bun run dev`
5. Submit a pull request

## 📄 License

MIT

## 🙋 Support

For issues or questions:
1. Check the [Troubleshooting](#-troubleshooting) section
2. Review [docs/architecture.md](./docs/architecture.md) for technical details
3. Open an issue on GitHub

---

**Note**: This is a scheduler application for managing recurring weekly time slots, not a blockchain or cryptocurrency tracking application. There are no Firebase functions, blockchain APIs, or AI integrations in this codebase.
