# Development Guide

Best practices, conventions, and workflows for developing the Weekwise scheduler application.

## Table of Contents

- [Getting Started](#getting-started)
- [Code Style & Conventions](#code-style--conventions)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing Guidelines](#testing-guidelines)
- [Git Workflow](#git-workflow)
- [Common Tasks](#common-tasks)
- [Debugging](#debugging)
- [Performance](#performance)

## Getting Started

### First Time Setup

1. **Install Bun** (recommended) or Node.js 18+:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Clone and setup**:
   ```bash
   git clone <repo-url>
   cd weekwise
   bun install
   ```

3. **Quick start**:
   ```bash
   # Use the quick-start script
   ./docs/quickstart.sh
   
   # Or manually:
   cp apps/server/.env.example apps/server/.env
   docker run -d --name weekwise-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -p 5432:5432 postgres:15
   bun run db:push
   bun run dev
   ```

### Development Environment

**Recommended Tools**:
- **Editor**: VS Code with extensions:
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript Error Translator
- **Database GUI**: 
  - Prisma Studio (`bun run db:studio`)
  - TablePlus
  - pgAdmin
- **API Testing**: 
  - tRPC Panel (built-in dev tool)
  - Bruno or Postman

## Code Style & Conventions

### TypeScript

**General Rules**:
- Use TypeScript strict mode (enabled by default)
- Avoid `any` type - use `unknown` if type is truly unknown
- Prefer interfaces for objects, types for unions/intersections
- Use const assertions for literal types

**Example**:
```typescript
// ✅ Good
interface User {
  id: string;
  name: string;
}

const DAYS = ['Sun', 'Mon', 'Tue'] as const;
type Day = typeof DAYS[number];

// ❌ Bad
type User = {
  id: any;
  name: any;
};

const DAYS = ['Sun', 'Mon', 'Tue'];
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `schedule-card.tsx` |
| Components | PascalCase | `ScheduleCard` |
| Functions | camelCase | `createSchedule` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE_CASE | `MAX_SLOTS_PER_DAY` |
| Types/Interfaces | PascalCase | `Schedule`, `ScheduleInput` |
| Database Models | PascalCase | `User`, `Schedule` |

### File Organization

**Component Files**:
```typescript
// Component definition
export function ScheduleCard({ schedule }: ScheduleCardProps) {
  // Hooks first
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useMutation();
  
  // Event handlers
  const handleEdit = () => { /* ... */ };
  
  // Render
  return <div>...</div>;
}

// Types at the bottom
interface ScheduleCardProps {
  schedule: Schedule;
}
```

**Router Files**:
```typescript
// Imports
import { z } from 'zod';
import { protectedProcedure, router } from '../lib/trpc';

// Router definition
export const schedulerRouter = router({
  // Procedures
  createSchedule: protectedProcedure
    .input(/* ... */)
    .mutation(async ({ ctx, input }) => { /* ... */ }),
});

// Types
export type SchedulerRouter = typeof schedulerRouter;
```

### Comments

**When to Comment**:
- Complex business logic
- Non-obvious workarounds
- TODOs with context
- Public API functions (JSDoc)

**When NOT to Comment**:
- Self-explanatory code
- Obvious variable names
- Repeating the code in words

```typescript
// ✅ Good
// Using upsert to handle both create and update atomically
// This prevents race conditions when multiple users edit simultaneously
const exception = await db.scheduleException.upsert(/* ... */);

// TODO: Add pagination when user has > 50 schedules
const schedules = await db.schedule.findMany(/* ... */);

// ❌ Bad
// Create a schedule
const schedule = await db.schedule.create(/* ... */);

// Set the user name to the input name
user.name = input.name;
```

### React Conventions

**Component Structure**:
```typescript
// 1. Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Types
interface ScheduleFormProps {
  onSubmit: (data: ScheduleInput) => void;
}

// 3. Component
export function ScheduleForm({ onSubmit }: ScheduleFormProps) {
  // 3a. Hooks (state, queries, mutations)
  const [time, setTime] = useState('09:00');
  const mutation = trpc.scheduler.createSchedule.useMutation();
  
  // 3b. Derived state & memoized values
  const isValid = useMemo(() => validateTime(time), [time]);
  
  // 3c. Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // 3d. Event handlers
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ time });
  };
  
  // 3e. Render
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX */}
    </form>
  );
}
```

**Hooks Usage**:
- Always use hooks at the top level
- Don't call hooks conditionally
- Use custom hooks for reusable logic

**Props**:
- Destructure props in function signature
- Use default values when appropriate
- Keep prop drilling shallow (max 2-3 levels)

### Backend Conventions

**tRPC Procedures**:
```typescript
export const schedulerRouter = router({
  createSchedule: protectedProcedure
    .input(
      z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
        endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Extract from context
      const userId = ctx.session.user.id;
      
      // 2. Validate business logic
      const existingSlots = await db.schedule.findMany({
        where: { userId, dayOfWeek: input.dayOfWeek, isActive: true },
      });
      
      if (existingSlots.length >= 2) {
        throw new Error('Maximum 2 slots allowed per day');
      }
      
      // 3. Perform operation
      const schedule = await db.schedule.create({
        data: { userId, ...input },
      });
      
      // 4. Return result
      return schedule;
    }),
});
```

**Database Queries**:
- Always filter by `userId` for user-scoped data
- Use `include` to fetch relations
- Use `select` to limit fields when possible
- Use transactions for multi-step operations

```typescript
// ✅ Good - includes relations in one query
const schedule = await db.schedule.findUnique({
  where: { id: scheduleId },
  include: { exceptions: true },
});

// ❌ Bad - N+1 query problem
const schedule = await db.schedule.findUnique({ where: { id: scheduleId } });
const exceptions = await db.scheduleException.findMany({
  where: { scheduleId },
});
```

## Project Structure

```
weekwise/
├── apps/
│   ├── server/                 # Backend application
│   │   ├── prisma/
│   │   │   └── schema/
│   │   │       ├── schema.prisma     # Database config
│   │   │       └── auth.prisma       # Models
│   │   ├── src/
│   │   │   ├── db/                   # Database client
│   │   │   │   └── index.ts
│   │   │   ├── lib/                  # Shared utilities
│   │   │   │   ├── auth.ts           # Better Auth setup
│   │   │   │   ├── context.ts        # tRPC context
│   │   │   │   └── trpc.ts           # tRPC initialization
│   │   │   ├── routers/              # tRPC routers
│   │   │   │   ├── index.ts          # Root router
│   │   │   │   └── scheduler.ts      # Scheduler routes
│   │   │   └── index.ts              # Server entry point
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                    # Frontend application
│       ├── src/
│       │   ├── components/           # React components
│       │   │   ├── ui/               # Base UI components
│       │   │   ├── layout/           # Layout components
│       │   │   └── features/         # Feature-specific components
│       │   ├── lib/                  # Frontend utilities
│       │   │   ├── trpc.ts           # tRPC client
│       │   │   ├── auth.ts           # Auth client
│       │   │   └── utils.ts          # Helpers
│       │   ├── routes/               # TanStack Router pages
│       │   │   ├── __root.tsx        # Root layout
│       │   │   ├── index.tsx         # Home page
│       │   │   ├── login.tsx         # Auth page
│       │   │   └── scheduler.tsx     # Scheduler page
│       │   ├── types/                # TypeScript types
│       │   ├── utils/                # Utility functions
│       │   ├── index.css             # Global styles
│       │   └── main.tsx              # Entry point
│       ├── .env.example
│       ├── Dockerfile
│       └── package.json
│
├── docs/                       # Documentation
│   ├── architecture.md         # System architecture
│   ├── api.md                  # API reference
│   ├── development.md          # This file
│   ├── operations.md           # Operations guide
│   └── quickstart.sh           # Quick start script
│
├── docker-compose.yml          # Docker orchestration
├── turbo.json                  # Turborepo config
├── package.json                # Root package config
└── README.md                   # Main documentation
```

### Adding New Features

#### Backend (New tRPC Procedure)

1. **Define Zod schema** for input validation
2. **Add procedure** to appropriate router
3. **Implement business logic** with error handling
4. **Test** with frontend or API client

Example:
```typescript
// apps/server/src/routers/scheduler.ts

export const schedulerRouter = router({
  // ... existing procedures
  
  // New procedure
  getScheduleById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const schedule = await db.schedule.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id, // Always filter by user
        },
      });
      
      if (!schedule) {
        throw new Error('Schedule not found');
      }
      
      return schedule;
    }),
});
```

#### Frontend (New Component)

1. **Create component file** in appropriate directory
2. **Define TypeScript interface** for props
3. **Implement component** with hooks
4. **Use in route** or parent component

Example:
```typescript
// apps/web/src/components/features/schedule-card.tsx

interface ScheduleCardProps {
  schedule: Schedule;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ScheduleCard({ schedule, onEdit, onDelete }: ScheduleCardProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3>{schedule.dayOfWeek}</h3>
      <p>{schedule.startTime} - {schedule.endTime}</p>
      <button onClick={() => onEdit(schedule.id)}>Edit</button>
      <button onClick={() => onDelete(schedule.id)}>Delete</button>
    </div>
  );
}
```

#### Database Schema Change

1. **Edit Prisma schema** in `apps/server/prisma/schema/auth.prisma`
2. **Generate migration** (production) or **push** (development)
3. **Update TypeScript types** (automatic via Prisma)
4. **Update procedures** that use the modified models

Example:
```prisma
// Add new field to Schedule model
model Schedule {
  // ... existing fields
  color String? @default("#3B82F6")  // New field
}
```

```bash
# Development
bun run db:push

# Production
bun run db:migrate
```

## Development Workflow

### Daily Workflow

1. **Pull latest changes**:
   ```bash
   git pull origin main
   bun install  # Update dependencies if needed
   ```

2. **Start development servers**:
   ```bash
   bun run dev
   ```

3. **Make changes** and test locally

4. **Type check**:
   ```bash
   bun run check-types
   ```

5. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add schedule color picker"
   git push origin feature/color-picker
   ```

### Hot Reload

- **Frontend (Vite)**: Automatically reloads on changes
- **Backend (Bun)**: Uses `--hot` flag but may need manual restart for some changes

If hot reload isn't working:
```bash
# Ctrl+C to stop, then restart
bun run dev
```

## Testing Guidelines

### Manual Testing Checklist

Before pushing:
- [ ] Type check passes: `bun run check-types`
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Feature works as expected
- [ ] Error cases handled gracefully
- [ ] Works in both light and dark mode (if UI change)

### Testing New Features

**Backend Procedure**:
1. Test happy path with valid input
2. Test with invalid input (wrong types, missing fields)
3. Test authorization (try accessing another user's data)
4. Test edge cases (empty results, max limits, etc.)

**Frontend Component**:
1. Test rendering with different props
2. Test user interactions (clicks, form submissions)
3. Test loading states
4. Test error states
5. Test responsive design (mobile, tablet, desktop)

### Future: Automated Testing

Currently no automated tests. Future additions should include:

- **Unit Tests**: Vitest for utilities and pure functions
- **Integration Tests**: Test tRPC procedures
- **E2E Tests**: Playwright for critical user flows
- **Type Tests**: Use `expectTypeOf` for complex types

## Git Workflow

### Branch Naming

```
feature/short-description      # New features
fix/short-description          # Bug fixes
refactor/short-description     # Code refactoring
docs/short-description         # Documentation
chore/short-description        # Maintenance tasks
```

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance

**Examples**:
```bash
git commit -m "feat(scheduler): add color picker for schedules"
git commit -m "fix(auth): resolve session cookie not persisting"
git commit -m "docs: update API reference with new endpoints"
git commit -m "refactor(db): optimize schedule query performance"
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and commit
3. Push to GitHub
4. Open Pull Request
5. Fill out PR template
6. Request review
7. Address feedback
8. Merge when approved

## Common Tasks

### Adding a New tRPC Procedure

```typescript
// 1. Define input schema
const createScheduleInput = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
});

// 2. Add procedure
export const schedulerRouter = router({
  createSchedule: protectedProcedure
    .input(createScheduleInput)
    .mutation(async ({ ctx, input }) => {
      // Implementation
    }),
});

// 3. Use in frontend
const mutation = trpc.scheduler.createSchedule.useMutation({
  onSuccess: () => {
    toast.success('Schedule created!');
  },
});
```

### Adding a Database Model

```prisma
// 1. Add to auth.prisma
model Tag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  color     String
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  
  @@map("tag")
}

// 2. Update User model to include relation
model User {
  // ... existing fields
  tags Tag[]
}
```

```bash
# 3. Generate and apply changes
bun run db:push  # or db:migrate for production
```

### Adding Environment Variable

```bash
# 1. Add to .env.example
NEW_API_KEY="your-key-here"

# 2. Add to your .env
NEW_API_KEY="actual-key-value"

# 3. Use in code
const apiKey = process.env.NEW_API_KEY;

# 4. Add to deployment (Vercel/Render dashboard)
```

### Creating a Custom Hook

```typescript
// apps/web/src/hooks/use-schedule-week.ts

export function useScheduleWeek(initialDate: Date) {
  const [weekStart, setWeekStart] = useState(initialDate);
  
  const { data: slots, isLoading } = trpc.scheduler.getSchedulesForWeek.useQuery({
    startDate: weekStart.toISOString(),
  });
  
  const nextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const prevWeek = () => setWeekStart(prev => subDays(prev, 7));
  
  return {
    slots,
    isLoading,
    weekStart,
    nextWeek,
    prevWeek,
  };
}
```

## Debugging

### Backend Debugging

**Console Logging**:
```typescript
console.log('[DEBUG] User ID:', ctx.session.user.id);
console.log('[DEBUG] Input:', JSON.stringify(input, null, 2));
```

**Prisma Query Logging**:
```typescript
// apps/server/src/db/index.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

**Database Studio**:
```bash
bun run db:studio
# Opens GUI at http://localhost:5555
```

### Frontend Debugging

**React DevTools**:
- Install browser extension
- Inspect component props and state

**TanStack Query DevTools**:
```typescript
// Already included in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
```

**Network Tab**:
- Check tRPC requests in browser DevTools > Network
- Filter by `/trpc` to see API calls

**Console Logging**:
```typescript
console.log('Current slots:', slots);
console.log('Mutation state:', mutation);
```

## Performance

### Backend Performance

**Database Optimization**:
```typescript
// ✅ Good - single query with relations
const schedule = await db.schedule.findUnique({
  where: { id },
  include: {
    exceptions: {
      where: { date: { gte: startDate, lte: endDate } },
    },
  },
});

// ❌ Bad - multiple queries
const schedule = await db.schedule.findUnique({ where: { id } });
const exceptions = await db.scheduleException.findMany({
  where: { scheduleId: schedule.id },
});
```

**Query Indexing**:
```sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_schedule_user_day ON schedule("userId", "dayOfWeek");
```

### Frontend Performance

**Memoization**:
```typescript
const sortedSlots = useMemo(() => {
  return slots?.sort((a, b) => a.startTime.localeCompare(b.startTime));
}, [slots]);
```

**Lazy Loading**:
```typescript
const ScheduleModal = lazy(() => import('./components/schedule-modal'));
```

**Optimistic Updates**:
Already implemented in mutation hooks to show instant feedback.

---

## Resources

- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Hono Documentation](https://hono.dev/)
- [Better Auth](https://www.better-auth.com/)

---

**Note**: This development guide is specific to the Weekwise scheduler application. It does not cover Firebase Cloud Functions, blockchain development, AI integration, or whale tracking features, as those are not part of this codebase.
