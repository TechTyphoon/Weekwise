# Architecture Documentation

This document provides a detailed technical overview of the Weekwise scheduler application architecture, including system design, database schema, API specifications, and data flow patterns.

## Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [API Layer](#api-layer)
- [Authentication System](#authentication-system)
- [Business Logic](#business-logic)
- [Frontend Architecture](#frontend-architecture)
- [Data Flow](#data-flow)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)

## System Overview

Weekwise is a full-stack TypeScript application built as a monorepo using Turborepo. It consists of two main applications:

1. **Backend API** (`apps/server`): Hono-based HTTP server with tRPC for type-safe API procedures
2. **Frontend Web** (`apps/web`): React 18 SPA with TanStack Router and Query

### Design Principles

- **Type Safety**: End-to-end TypeScript with shared types between client and server via tRPC
- **Separation of Concerns**: Clear boundaries between presentation, business logic, and data layers
- **Optimistic UI**: Frontend updates immediately before server confirmation for better UX
- **Exception Pattern**: Recurring schedules with date-specific exceptions for flexibility
- **Soft Deletes**: Data marked inactive rather than permanently deleted for auditability

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React 18 + TypeScript                                     │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ TanStack     │  │ TanStack     │  │ tRPC Client  │    │ │
│  │  │ Router       │  │ Query        │  │              │    │ │
│  │  │ (Routing)    │  │ (State)      │  │ (API)        │    │ │
│  │  └──────────────┘  └──────────────┘  └──────┬───────┘    │ │
│  │                                               │            │ │
│  │  ┌──────────────────────────────────────────┴───────────┐ │ │
│  │  │  UI Components (Tailwind CSS + shadcn-inspired)      │ │ │
│  │  └────────────────────────────────────────────────────── │ │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP/tRPC (JSON-RPC)
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                       SERVER (Bun/Node.js)                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Hono HTTP Server                                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ CORS         │  │ Better Auth  │  │ tRPC Server  │    │ │
│  │  │ Middleware   │  │ Middleware   │  │              │    │ │
│  │  └──────────────┘  └──────────────┘  └──────┬───────┘    │ │
│  │                                               │            │ │
│  │  ┌────────────────────────────────────────── ▼ ─────────┐ │ │
│  │  │  tRPC Routers                                         │ │ │
│  │  │  ┌─────────────────┐  ┌─────────────────┐           │ │ │
│  │  │  │ Health Check    │  │ Scheduler Router│           │ │ │
│  │  │  │ (Public)        │  │ (Protected)     │           │ │ │
│  │  │  └─────────────────┘  └────────┬────────┘           │ │ │
│  │  └──────────────────────────────────┼────────────────────┘ │ │
│  │                                     │                      │ │
│  │  ┌──────────────────────────────────▼────────────────────┐ │ │
│  │  │  Business Logic Layer                                 │ │ │
│  │  │  - Schedule validation (2 slots max, time checks)    │ │ │
│  │  │  - Exception handling logic                          │ │ │
│  │  │  - Week generation algorithm                         │ │ │
│  │  └──────────────────────────────────┬────────────────────┘ │ │
│  │                                     │                      │ │
│  │  ┌──────────────────────────────────▼────────────────────┐ │ │
│  │  │  Prisma ORM                                           │ │ │
│  │  │  - Type-safe database queries                        │ │ │
│  │  │  - Schema management                                 │ │ │
│  │  └──────────────────────────────────┬────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────┬─────────────────────────────────┘
                                │ PostgreSQL Protocol
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                        PostgreSQL Database                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Tables: user, session, account, verification,             │ │
│  │          schedule, schedule_exception                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Bun / Node.js | JavaScript runtime (Bun for development, Node.js fallback) |
| Web Framework | Hono | Lightweight, fast web framework |
| API Layer | tRPC v11 | Type-safe RPC procedures |
| ORM | Prisma v6 | Type-safe database client with migrations |
| Database | PostgreSQL 15+ | Relational database |
| Authentication | Better Auth v1 | Modern authentication library |
| Validation | Zod v4 | TypeScript-first schema validation |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 | UI library |
| Routing | TanStack Router | File-based type-safe routing |
| State Management | TanStack Query v5 | Server state management & caching |
| API Client | tRPC React Query | Type-safe API calls with React hooks |
| Styling | Tailwind CSS 4 | Utility-first CSS framework |
| UI Components | Custom (shadcn-inspired) | Reusable component library |
| Build Tool | Vite 6 | Fast build tool and dev server |
| Forms | TanStack Form | Type-safe form handling |
| Notifications | Sonner | Toast notifications |
| Icons | Lucide React | Icon library |

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Monorepo | Turborepo | Build system orchestration |
| Package Manager | Bun | Fast package manager |
| Containerization | Docker | Application containerization |
| Orchestration | Docker Compose | Multi-container orchestration |
| Frontend Hosting | Vercel | Serverless frontend deployment |
| Backend Hosting | Render | Managed Node.js hosting |

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐         ┌──────────────────┐
│     User        │         │     Account      │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │─────┬───│ id (PK)          │
│ name            │     │   │ accountId        │
│ email (unique)  │     │   │ providerId       │
│ emailVerified   │     │   │ userId (FK)      │
│ image           │     │   │ accessToken      │
│ createdAt       │     │   │ refreshToken     │
│ updatedAt       │     │   │ ...              │
└─────────────────┘     │   └──────────────────┘
        │               │
        │               │   ┌──────────────────┐
        │               └───│     Session      │
        │                   ├──────────────────┤
        │                   │ id (PK)          │
        │                   │ expiresAt        │
        │                   │ token (unique)   │
        │                   │ userId (FK)      │
        │                   │ ipAddress        │
        │                   │ userAgent        │
        │                   └──────────────────┘
        │
        │               ┌──────────────────────┐
        └───────────────│     Schedule         │
                        ├──────────────────────┤
                        │ id (PK)              │
                        │ userId (FK)          │
                        │ dayOfWeek            │
                        │ startTime            │
                        │ endTime              │
                        │ isActive             │
                        │ createdAt            │
                        │ updatedAt            │
                        └──────────┬───────────┘
                                   │
                                   │
                        ┌──────────▼──────────────────┐
                        │  ScheduleException          │
                        ├─────────────────────────────┤
                        │ id (PK)                     │
                        │ scheduleId (FK)             │
                        │ date (unique with scheduleId)│
                        │ startTime (nullable)        │
                        │ endTime (nullable)          │
                        │ isDeleted                   │
                        │ createdAt                   │
                        │ updatedAt                   │
                        └─────────────────────────────┘
```

### Prisma Models

#### User Model

```prisma
model User {
  id            String    @id @map("_id")
  name          String
  email         String    @unique
  emailVerified Boolean
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]
  schedules     Schedule[]
}
```

**Purpose**: Stores user account information. Managed by Better Auth.

**Fields**:
- `id`: Unique identifier (generated by Better Auth)
- `email`: User's email address (unique constraint)
- `emailVerified`: Whether email has been verified
- `name`: Display name
- `image`: Optional profile image URL
- Relations to sessions, accounts, and schedules

#### Session Model

```prisma
model Session {
  id        String   @id @map("_id")
  expiresAt DateTime
  token     String   @unique
  createdAt DateTime
  updatedAt DateTime
  ipAddress String?
  userAgent String?
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Purpose**: Stores active user sessions for authentication.

**Fields**:
- `token`: Session token stored in HTTP-only cookie (unique)
- `expiresAt`: Session expiration timestamp
- `ipAddress` & `userAgent`: Security metadata
- Cascades delete when user is deleted

#### Schedule Model

```prisma
model Schedule {
  id          Int       @id @default(autoincrement())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  dayOfWeek   Int       // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime   String    // Format: "HH:MM"
  endTime     String    // Format: "HH:MM"
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  exceptions  ScheduleException[]
}
```

**Purpose**: Stores recurring weekly schedule patterns.

**Fields**:
- `dayOfWeek`: Day of week (0-6, Sunday=0)
- `startTime` / `endTime`: Time slots in "HH:MM" format (24-hour)
- `isActive`: Soft delete flag (false = deleted)
- Relations to user and exceptions

**Constraints**:
- Maximum 2 schedules per user per `dayOfWeek` (enforced at application level)
- Cascades delete when user is deleted

#### ScheduleException Model

```prisma
model ScheduleException {
  id         Int       @id @default(autoincrement())
  scheduleId Int
  schedule   Schedule  @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  date       DateTime  // Specific date for the exception
  startTime  String?   // If null, slot is deleted for this date
  endTime    String?   // If null, slot is deleted for this date
  isDeleted  Boolean   @default(false)
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@unique([scheduleId, date])
}
```

**Purpose**: Stores date-specific overrides to recurring schedules.

**Fields**:
- `date`: Specific date for this exception
- `startTime` / `endTime`: Override times (nullable)
- `isDeleted`: If true, slot is hidden for this date
- Unique constraint on `(scheduleId, date)` ensures one exception per schedule per date

**Exception Logic**:
1. If `isDeleted = true`: Slot doesn't appear for that date
2. If `isDeleted = false` and times are set: Use exception times instead of recurring schedule times
3. If no exception exists: Use recurring schedule times

## API Layer

### tRPC Architecture

The application uses tRPC for type-safe API procedures. All procedures are defined in `apps/server/src/routers/`.

#### Context

```typescript
interface Context {
  session: {
    user: {
      id: string;
      email: string;
      name: string;
    };
    session: {
      token: string;
      expiresAt: Date;
    };
  } | null;
}
```

#### Procedure Types

- **Public Procedures**: No authentication required
- **Protected Procedures**: Require valid session (middleware checks `ctx.session`)

### API Endpoints

#### Health Check

**Procedure**: `healthCheck`  
**Type**: Public Query  
**Purpose**: Server health check

```typescript
healthCheck.query() => "OK"
```

#### Create Schedule

**Procedure**: `scheduler.createSchedule`  
**Type**: Protected Mutation  
**Purpose**: Create a new recurring schedule

**Input**:
```typescript
{
  dayOfWeek: number;    // 0-6 (Sunday-Saturday)
  startTime: string;    // "HH:MM" format
  endTime: string;      // "HH:MM" format
}
```

**Validations**:
- `dayOfWeek` must be 0-6
- Time format must match `HH:MM` regex
- End time must be after start time
- User must have less than 2 slots for this day of week

**Output**: Created `Schedule` object

**Errors**:
- `"Maximum 2 slots allowed per day"` - User already has 2 slots
- `"End time must be after start time"` - Invalid time range

#### Get Schedules for Week

**Procedure**: `scheduler.getSchedulesForWeek`  
**Type**: Protected Query  
**Purpose**: Fetch all slots for a given week

**Input**:
```typescript
{
  startDate: string;    // ISO date string (YYYY-MM-DD)
}
```

**Output**: Array of week slots
```typescript
Array<{
  id: string;           // Format: "{scheduleId}-{date}"
  scheduleId: number;
  date: string;         // ISO date string
  startTime: string;    // "HH:MM"
  endTime: string;      // "HH:MM"
  isException: boolean; // True if using exception times
  exceptionId?: number; // Present if isException is true
}>
```

**Logic**:
1. Fetch all active schedules for the user
2. Fetch all exceptions within the date range
3. Generate slots for each day of the week (7 days)
4. Skip slots for past dates (before today)
5. For each slot:
   - If exception with `isDeleted = true`: Skip
   - If exception with times: Use exception times
   - Otherwise: Use recurring schedule times

#### Update Slot

**Procedure**: `scheduler.updateSlot`  
**Type**: Protected Mutation  
**Purpose**: Edit a specific date without affecting recurring schedule (creates/updates exception)

**Input**:
```typescript
{
  scheduleId: string;   // ID of recurring schedule
  date: string;         // ISO date string
  startTime: string;    // "HH:MM"
  endTime: string;      // "HH:MM"
}
```

**Validations**:
- Schedule must belong to the authenticated user
- End time must be after start time

**Output**: Created/updated `ScheduleException` object

**Behavior**: Uses `upsert` to create new exception or update existing one

#### Delete Slot

**Procedure**: `scheduler.deleteSlot`  
**Type**: Protected Mutation  
**Purpose**: Delete a slot for a specific date (creates/updates exception with `isDeleted = true`)

**Input**:
```typescript
{
  scheduleId: string;   // ID of recurring schedule
  date: string;         // ISO date string
}
```

**Validations**:
- Schedule must belong to the authenticated user

**Output**: Created/updated `ScheduleException` object with `isDeleted = true`, `startTime = null`, `endTime = null`

#### Delete Schedule

**Procedure**: `scheduler.deleteSchedule`  
**Type**: Protected Mutation  
**Purpose**: Soft-delete an entire recurring schedule

**Input**:
```typescript
{
  scheduleId: string;   // ID of recurring schedule
}
```

**Validations**:
- Schedule must belong to the authenticated user

**Output**: `{ success: true }`

**Behavior**: Sets `isActive = false` (soft delete)

## Authentication System

### Better Auth Configuration

Better Auth provides session-based authentication with email/password:

```typescript
{
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  trustedOrigins: [CORS_ORIGIN, "http://localhost:3001"],
  advanced: {
    defaultCookieAttributes: {
      sameSite: isDevelopment ? "lax" : "none",
      secure: !isDevelopment,
      httpOnly: true,
    },
  },
}
```

### Authentication Flow

1. **Registration/Login**:
   - User submits email/password to `/api/auth/sign-up` or `/api/auth/sign-in`
   - Better Auth validates credentials, creates session
   - Session token stored in HTTP-only cookie

2. **Subsequent Requests**:
   - Cookie automatically sent with requests
   - tRPC middleware extracts session from request
   - Context populated with user data
   - Protected procedures check `ctx.session` exists

3. **Logout**:
   - Client calls `/api/auth/sign-out`
   - Session deleted from database
   - Cookie cleared

### Security Features

- **HTTP-Only Cookies**: Session tokens not accessible via JavaScript (XSS protection)
- **SameSite Cookie**: Prevents CSRF attacks (`lax` for dev, `none` for cross-origin prod)
- **Secure Cookie**: HTTPS-only in production
- **Session Expiration**: Configurable session lifetime
- **IP & User Agent Tracking**: Stored for security auditing

## Business Logic

### Two-Slot-Per-Day Rule

**Implementation**: In `createSchedule` mutation

```typescript
const existingSlots = await db.schedule.findMany({
  where: { userId, dayOfWeek: input.dayOfWeek, isActive: true },
});

if (existingSlots.length >= 2) {
  throw new Error("Maximum 2 slots allowed per day");
}
```

**Rationale**: Business constraint to limit schedule complexity per day.

### Time Validation

**Implementation**: In `createSchedule` and `updateSlot` mutations

```typescript
const [startHour, startMin] = input.startTime.split(":").map(Number);
const [endHour, endMin] = input.endTime.split(":").map(Number);
const startMinutes = startHour * 60 + startMin;
const endMinutes = endHour * 60 + endMin;

if (endMinutes <= startMinutes) {
  throw new Error("End time must be after start time");
}
```

**Rationale**: Ensures valid time ranges (no zero or negative duration slots).

### Exception Pattern

**Design Decision**: Store exceptions separately rather than duplicating entire schedule.

**Advantages**:
- Efficient storage (only store differences)
- Easy to revert exceptions (delete exception record)
- Clear audit trail (see when specific dates were modified)
- Single source of truth for recurring pattern

**Disadvantage**: Requires merge logic during retrieval (complexity in `getSchedulesForWeek`).

### Soft Delete Pattern

**Implementation**: `isActive` flag on Schedule model

**Rationale**:
- Preserve historical data for auditing
- Potential to restore deleted schedules
- Maintain referential integrity (exceptions remain linked)

### Past Date Filtering

**Implementation**: In `getSchedulesForWeek` query

```typescript
const today = new Date();
today.setHours(0, 0, 0, 0);

if (currentDate < today) {
  continue; // Skip past dates
}
```

**Rationale**: Only show current and future slots to avoid clutter and confusion.

## Frontend Architecture

### File Structure

```
apps/web/src/
├── components/          # Reusable UI components
│   ├── ui/             # Base components (Button, Dialog, etc.)
│   ├── layout/         # Layout components (Nav, Header, etc.)
│   └── features/       # Feature-specific components
├── lib/                # Shared libraries
│   ├── trpc.ts         # tRPC client configuration
│   ├── auth.ts         # Better Auth client
│   └── utils.ts        # Utility functions
├── routes/             # TanStack Router pages
│   ├── __root.tsx      # Root layout with nav & auth
│   ├── index.tsx       # Landing page
│   ├── login.tsx       # Login/register page
│   └── scheduler.tsx   # Main scheduler UI
├── types/              # TypeScript type definitions
├── utils/              # Helper functions
└── main.tsx            # Application entry point
```

### State Management

#### TanStack Query

Used for server state management with caching, optimistic updates, and automatic refetching.

**Query Example**: Fetch week schedules
```typescript
const { data: slots } = trpc.scheduler.getSchedulesForWeek.useQuery({
  startDate: weekStart.toISOString(),
});
```

**Mutation Example**: Create schedule with optimistic update
```typescript
const createMutation = trpc.scheduler.createSchedule.useMutation({
  onMutate: async (newSchedule) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['scheduler', 'getSchedulesForWeek'] });
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(['scheduler', 'getSchedulesForWeek']);
    
    // Optimistically update
    queryClient.setQueryData(['scheduler', 'getSchedulesForWeek'], (old) => [...old, newSchedule]);
    
    return { previous };
  },
  onError: (err, newSchedule, context) => {
    // Rollback on error
    queryClient.setQueryData(['scheduler', 'getSchedulesForWeek'], context.previous);
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries({ queryKey: ['scheduler', 'getSchedulesForWeek'] });
  },
});
```

#### Local State

- **Component State**: `useState` for local UI state (modal open/close, form inputs)
- **Context**: Theme context for dark/light mode
- **Router State**: URL search params for week navigation

### Routing

TanStack Router provides file-based routing with type-safe navigation.

**Routes**:
- `/` - Landing page (unauthenticated)
- `/login` - Login/register page
- `/scheduler` - Main scheduler interface (protected)

**Protection**: Root route checks authentication and redirects to `/login` if not authenticated.

### Infinite Week Scrolling

**Implementation**:

1. **State**: `currentWeekStart` date state
2. **Navigation**: Previous/Next week buttons
3. **Data Fetching**: Query triggered when `currentWeekStart` changes
4. **Optimization**: TanStack Query caches previous weeks for instant back navigation

```typescript
const [currentWeekStart, setCurrentWeekStart] = useState(() => {
  const today = new Date();
  return startOfWeek(today); // Helper function
});

const goToPreviousWeek = () => {
  setCurrentWeekStart(prev => subDays(prev, 7));
};

const goToNextWeek = () => {
  setCurrentWeekStart(prev => addDays(prev, 7));
};
```

### Component Architecture

#### Atomic Design Principles

- **Atoms**: Button, Input, Label (basic UI elements)
- **Molecules**: TimeSlotCard, DayColumn (composed components)
- **Organisms**: WeekView, ScheduleModal (complex components)
- **Templates**: SchedulerLayout (page structure)
- **Pages**: Scheduler route (full page with data fetching)

#### Key Components

**TimeSlotCard**: Displays individual time slot
- Props: `slot`, `onEdit`, `onDelete`
- Features: Hover actions, exception indicator

**ScheduleModal**: Dialog for creating/editing slots
- Props: `mode`, `initialData`, `onSubmit`, `onClose`
- Features: Form validation, time pickers, error display

**WeekView**: Main scheduler grid
- Layout: 7 columns (one per day)
- Features: Scroll navigation, loading states, empty states

## Data Flow

### Create Schedule Flow

```
┌──────────────┐
│ User clicks  │
│ "Add Slot"   │
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│ Open modal         │
│ with form          │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ User fills form    │
│ and submits        │
└──────┬─────────────┘
       │
       ▼
┌────────────────────────┐
│ tRPC mutation          │
│ scheduler.createSchedule│
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Optimistic UI update   │
│ (show immediately)     │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Server validation      │
│ & database insert      │
└──────┬─────────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────┐   ┌─────────────┐
│ Success  │   │ Error       │
└────┬─────┘   └─────┬───────┘
     │               │
     ▼               ▼
┌──────────┐   ┌─────────────────┐
│ Toast    │   │ Rollback UI     │
│ success  │   │ Show error      │
└────┬─────┘   └─────┬───────────┘
     │               │
     └───────┬───────┘
             │
             ▼
┌──────────────────────┐
│ Invalidate queries   │
│ (refetch from server)│
└──────────────────────┘
```

### Week Navigation Flow

```
┌──────────────┐
│ User clicks  │
│ "Next Week"  │
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│ Update state       │
│ currentWeekStart   │
└──────┬─────────────┘
       │
       ▼
┌──────────────────────────┐
│ Check TanStack Query     │
│ cache                    │
└──────┬───────────────────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌──────────┐   ┌─────────────────┐
│ Hit      │   │ Miss            │
│ (cached) │   │ (not cached)    │
└────┬─────┘   └─────┬───────────┘
     │               │
     │               ▼
     │         ┌─────────────────┐
     │         │ Show loading UI │
     │         └─────┬───────────┘
     │               │
     │               ▼
     │         ┌──────────────────────┐
     │         │ Fetch from server    │
     │         │ getSchedulesForWeek  │
     │         └─────┬────────────────┘
     │               │
     └───────┬───────┘
             │
             ▼
┌──────────────────────┐
│ Display week slots   │
└──────────────────────┘
```

### Exception Creation Flow

```
┌──────────────┐
│ User edits   │
│ slot date    │
└──────┬───────┘
       │
       ▼
┌────────────────────┐
│ Open modal with    │
│ existing times     │
└──────┬─────────────┘
       │
       ▼
┌────────────────────┐
│ User changes times │
│ and submits        │
└──────┬─────────────┘
       │
       ▼
┌────────────────────────┐
│ tRPC mutation          │
│ scheduler.updateSlot   │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Server checks:         │
│ - Schedule ownership   │
│ - Time validation      │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────────┐
│ Upsert ScheduleException   │
│ with new times             │
└──────┬───────────────────── ┘
       │
       ▼
┌────────────────────────┐
│ Return exception       │
│ to client              │
└──────┬─────────────────┘
       │
       ▼
┌────────────────────────┐
│ Invalidate week query  │
│ UI updates with        │
│ exception indicator    │
└────────────────────────┘
```

## Security Considerations

### Authentication

- **Session Tokens**: Random, unpredictable tokens stored in HTTP-only cookies
- **Token Lifetime**: Configurable expiration enforced server-side
- **Secure Cookies**: HTTPS-only in production
- **CSRF Protection**: SameSite cookie attribute

### Authorization

- **User-Scoped Queries**: All queries filtered by `userId` from session
- **Ownership Validation**: Mutations verify resource ownership before modification
- **Protected Procedures**: Middleware rejects unauthenticated requests

### Input Validation

- **Zod Schemas**: All inputs validated with Zod at API boundary
- **Time Format**: Regex validation for "HH:MM" format
- **Range Checks**: Day of week (0-6), time comparison
- **Sanitization**: Prisma ORM prevents SQL injection

### CORS

- **Origin Whitelist**: Only configured origins allowed (environment variable)
- **Credentials**: `credentials: true` requires exact origin match
- **Methods**: Limited to necessary HTTP methods

### Database

- **Prepared Statements**: Prisma uses parameterized queries (SQL injection protection)
- **Cascade Deletes**: Prevent orphaned records
- **Unique Constraints**: Database-level uniqueness enforcement

## Performance Optimizations

### Backend

1. **Database Queries**:
   - Selective field projection (only fetch needed fields)
   - Include relations in single query (avoid N+1)
   - Date range filtering (fetch only relevant exceptions)

2. **Caching**:
   - Bun runtime caching for hot code paths
   - Prisma query caching

3. **Connection Pooling**:
   - PostgreSQL connection pool via Prisma

### Frontend

1. **TanStack Query Caching**:
   - Automatic cache invalidation
   - Background refetching
   - Cache persistence across navigations

2. **Optimistic Updates**:
   - Instant UI feedback before server response
   - Rollback on error

3. **Code Splitting**:
   - Route-based code splitting with TanStack Router
   - Lazy loading for modals and dialogs

4. **Virtualization**:
   - TanStack Virtual for large lists (if needed in future)

5. **Bundle Optimization**:
   - Vite tree-shaking
   - Production build minification

### Deployment

1. **Frontend (Vercel)**:
   - Edge CDN distribution
   - Automatic HTTPS
   - Serverless functions

2. **Backend (Render)**:
   - Auto-scaling
   - Health checks
   - Zero-downtime deployments

3. **Database**:
   - Managed PostgreSQL with automatic backups
   - Connection pooling

## Future Considerations

### Scalability

- **Database Indexing**: Add indexes on `userId`, `dayOfWeek`, `date` columns
- **Read Replicas**: Separate read/write database instances
- **Caching Layer**: Redis for session storage and frequently accessed data
- **Rate Limiting**: Prevent API abuse

### Features

- **Recurring Patterns**: Support bi-weekly, monthly schedules
- **Time Zones**: Store and display times in user's timezone
- **Notifications**: Email/push notifications for upcoming slots
- **Sharing**: Share schedules with other users
- **Calendar Integration**: Import/export to iCal format

### Monitoring

- **Error Tracking**: Sentry or similar for error monitoring
- **Performance Monitoring**: APM for backend performance
- **Analytics**: User behavior tracking
- **Logging**: Structured logging with log aggregation

---

**Note**: This architecture is designed for the current Weekwise scheduler application. References to Firebase, blockchain, AI, or whale tracking in related documentation are not applicable to this codebase.
