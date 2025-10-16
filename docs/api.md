# API Reference

Complete reference for all tRPC procedures in the Weekwise scheduler API.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: Your deployed backend URL

## Authentication

All protected endpoints require a valid session cookie obtained through Better Auth.

### Authentication Endpoints

Handled by Better Auth at `/api/auth/*`:

#### Sign Up

```http
POST /api/auth/sign-up
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### Sign In

```http
POST /api/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Sign Out

```http
POST /api/auth/sign-out
```

#### Get Session

```http
GET /api/auth/get-session
```

## tRPC Procedures

All tRPC procedures are accessed via `/trpc/*` endpoints.

### Public Procedures

#### Health Check

Check if the API is operational.

**Procedure**: `healthCheck`  
**Type**: Query  
**Auth**: None required

**Request**:
```typescript
const result = await trpc.healthCheck.query();
```

**Response**:
```typescript
"OK"
```

**HTTP Equivalent**:
```http
GET /trpc/healthCheck
```

---

### Protected Procedures

All procedures below require authentication. Session data is available in context.

#### Create Schedule

Create a new recurring weekly schedule.

**Procedure**: `scheduler.createSchedule`  
**Type**: Mutation  
**Auth**: Required

**Input Schema**:
```typescript
{
  dayOfWeek: number;    // 0-6 (0 = Sunday, 6 = Saturday)
  startTime: string;    // Format: "HH:MM" (24-hour)
  endTime: string;      // Format: "HH:MM" (24-hour)
}
```

**Validation Rules**:
- `dayOfWeek`: Integer between 0 and 6 (inclusive)
- `startTime`: Must match regex `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
- `endTime`: Must match regex `/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/`
- `endTime` must be after `startTime`
- User must have fewer than 2 active schedules for the given `dayOfWeek`

**Example Request**:
```typescript
const schedule = await trpc.scheduler.createSchedule.mutate({
  dayOfWeek: 1,        // Monday
  startTime: "09:00",  // 9:00 AM
  endTime: "10:30",    // 10:30 AM
});
```

**Response**:
```typescript
{
  id: 42,
  userId: "user_abc123",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:30",
  isActive: true,
  createdAt: "2024-10-16T10:30:00.000Z",
  updatedAt: "2024-10-16T10:30:00.000Z"
}
```

**Error Responses**:
```typescript
// Too many slots for this day
Error: "Maximum 2 slots allowed per day"

// Invalid time range
Error: "End time must be after start time"

// Validation error
TRPCError: "Invalid input"
```

---

#### Get Schedules for Week

Retrieve all schedule slots for a given week, including exceptions.

**Procedure**: `scheduler.getSchedulesForWeek`  
**Type**: Query  
**Auth**: Required

**Input Schema**:
```typescript
{
  startDate: string;    // ISO date string (YYYY-MM-DD)
}
```

**Example Request**:
```typescript
const slots = await trpc.scheduler.getSchedulesForWeek.query({
  startDate: "2024-10-14",  // Start of week (typically Sunday or Monday)
});
```

**Response**:
```typescript
[
  {
    id: "42-2024-10-14",      // Format: "{scheduleId}-{date}"
    scheduleId: 42,
    date: "2024-10-14",       // ISO date string
    startTime: "09:00",
    endTime: "10:30",
    isException: false,       // False = using recurring schedule
  },
  {
    id: "42-2024-10-15",
    scheduleId: 42,
    date: "2024-10-15",
    startTime: "09:30",       // Different time due to exception
    endTime: "11:00",
    isException: true,        // True = exception applied
    exceptionId: 15,          // ID of the exception record
  },
  // ... more slots for the week
]
```

**Behavior**:
- Returns slots for 7 days starting from `startDate`
- Only includes slots for today and future dates (past dates filtered out)
- Applies exceptions automatically:
  - If exception with `isDeleted = true`: Slot omitted from results
  - If exception with custom times: Uses exception times instead of recurring times
  - If no exception: Uses recurring schedule times
- Sorted by date and time

**Empty Response**:
```typescript
[]  // User has no schedules for this week
```

---

#### Update Slot

Edit a specific date without affecting the recurring schedule by creating or updating an exception.

**Procedure**: `scheduler.updateSlot`  
**Type**: Mutation  
**Auth**: Required

**Input Schema**:
```typescript
{
  scheduleId: string;   // ID of the recurring schedule
  date: string;         // ISO date string (YYYY-MM-DD)
  startTime: string;    // Format: "HH:MM" (24-hour)
  endTime: string;      // Format: "HH:MM" (24-hour)
}
```

**Validation Rules**:
- `scheduleId`: Must be a valid schedule ID owned by the authenticated user
- `date`: Must be a valid ISO date string
- `startTime` & `endTime`: Must match `HH:MM` format
- `endTime` must be after `startTime`

**Example Request**:
```typescript
// Edit Monday, Oct 16 to different times without changing recurring pattern
const exception = await trpc.scheduler.updateSlot.mutate({
  scheduleId: "42",
  date: "2024-10-16",
  startTime: "10:00",  // Changed from recurring 09:00
  endTime: "11:30",    // Changed from recurring 10:30
});
```

**Response**:
```typescript
{
  id: 15,
  scheduleId: 42,
  date: "2024-10-16T00:00:00.000Z",
  startTime: "10:00",
  endTime: "11:30",
  isDeleted: false,
  createdAt: "2024-10-16T10:30:00.000Z",
  updatedAt: "2024-10-16T10:35:00.000Z"
}
```

**Behavior**:
- If exception already exists for this date: Updates it
- If no exception exists: Creates new one
- Uses `upsert` operation for atomicity

**Error Responses**:
```typescript
// Schedule not found or doesn't belong to user
Error: "Schedule not found"

// Invalid time range
Error: "End time must be after start time"
```

---

#### Delete Slot

Delete a slot for a specific date without affecting other occurrences of the recurring schedule.

**Procedure**: `scheduler.deleteSlot`  
**Type**: Mutation  
**Auth**: Required

**Input Schema**:
```typescript
{
  scheduleId: string;   // ID of the recurring schedule
  date: string;         // ISO date string (YYYY-MM-DD)
}
```

**Example Request**:
```typescript
// Delete the slot for Monday, Oct 16 only
const result = await trpc.scheduler.deleteSlot.mutate({
  scheduleId: "42",
  date: "2024-10-16",
});
```

**Response**:
```typescript
{
  id: 15,
  scheduleId: 42,
  date: "2024-10-16T00:00:00.000Z",
  startTime: null,       // Set to null when deleted
  endTime: null,         // Set to null when deleted
  isDeleted: true,       // Marked as deleted
  createdAt: "2024-10-16T10:30:00.000Z",
  updatedAt: "2024-10-16T10:40:00.000Z"
}
```

**Behavior**:
- Creates/updates exception with `isDeleted = true`
- Sets `startTime` and `endTime` to `null`
- Slot will not appear in `getSchedulesForWeek` results for this date
- Other dates with the same recurring schedule are unaffected

**Error Responses**:
```typescript
// Schedule not found or doesn't belong to user
Error: "Schedule not found"
```

---

#### Delete Schedule

Soft-delete an entire recurring schedule and all its future occurrences.

**Procedure**: `scheduler.deleteSchedule`  
**Type**: Mutation  
**Auth**: Required

**Input Schema**:
```typescript
{
  scheduleId: string;   // ID of the recurring schedule
}
```

**Example Request**:
```typescript
// Delete entire recurring schedule
const result = await trpc.scheduler.deleteSchedule.mutate({
  scheduleId: "42",
});
```

**Response**:
```typescript
{
  success: true
}
```

**Behavior**:
- Sets `isActive = false` on the schedule (soft delete)
- Schedule no longer appears in `getSchedulesForWeek` results
- Exceptions remain in database but are not used
- Can be restored by setting `isActive = true` manually in database

**Error Responses**:
```typescript
// Schedule not found or doesn't belong to user
Error: "Schedule not found"
```

---

## Error Handling

### Error Types

All errors follow the tRPC error format:

```typescript
{
  error: {
    message: string;           // Human-readable error message
    code: string;              // Error code (e.g., "UNAUTHORIZED", "BAD_REQUEST")
    data: {
      code: string;
      httpStatus: number;
      path: string;            // tRPC procedure path
      zodError?: object;       // If validation error
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Not authenticated or invalid session |
| `FORBIDDEN` | 403 | Authenticated but not authorized (e.g., accessing another user's schedule) |
| `BAD_REQUEST` | 400 | Invalid input (validation failed) |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |
| `TIMEOUT` | 408 | Request timeout |

### Error Examples

**Authentication Error**:
```typescript
{
  error: {
    message: "UNAUTHORIZED",
    code: "UNAUTHORIZED",
    data: {
      code: "UNAUTHORIZED",
      httpStatus: 401,
      path: "scheduler.createSchedule"
    }
  }
}
```

**Validation Error**:
```typescript
{
  error: {
    message: "Invalid input",
    code: "BAD_REQUEST",
    data: {
      code: "BAD_REQUEST",
      httpStatus: 400,
      path: "scheduler.createSchedule",
      zodError: {
        fieldErrors: {
          dayOfWeek: ["Expected number, received string"]
        }
      }
    }
  }
}
```

**Business Logic Error**:
```typescript
{
  error: {
    message: "Maximum 2 slots allowed per day",
    code: "BAD_REQUEST",
    data: {
      code: "BAD_REQUEST",
      httpStatus: 400,
      path: "scheduler.createSchedule"
    }
  }
}
```

---

## Usage Examples

### React (with tRPC React Query)

#### Setup tRPC Client

```typescript
// lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/src/routers';

export const trpc = createTRPCReact<AppRouter>();
```

#### Query Example

```typescript
function SchedulerView() {
  const { data: slots, isLoading, error } = trpc.scheduler.getSchedulesForWeek.useQuery({
    startDate: '2024-10-14',
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {slots.map(slot => (
        <div key={slot.id}>
          {slot.date} - {slot.startTime} to {slot.endTime}
        </div>
      ))}
    </div>
  );
}
```

#### Mutation with Optimistic Update

```typescript
function CreateSlotButton() {
  const queryClient = useQueryClient();
  
  const createMutation = trpc.scheduler.createSchedule.useMutation({
    onMutate: async (newSchedule) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['scheduler', 'getSchedulesForWeek'],
      });
      
      // Snapshot previous value
      const previous = queryClient.getQueryData([
        'scheduler',
        'getSchedulesForWeek',
      ]);
      
      // Optimistically update
      queryClient.setQueryData(
        ['scheduler', 'getSchedulesForWeek'],
        (old) => [...(old || []), { ...newSchedule, id: 'temp' }]
      );
      
      return { previous };
    },
    onError: (err, newSchedule, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['scheduler', 'getSchedulesForWeek'],
        context?.previous
      );
      toast.error(err.message);
    },
    onSuccess: () => {
      toast.success('Schedule created!');
    },
    onSettled: () => {
      // Refetch to sync
      queryClient.invalidateQueries({
        queryKey: ['scheduler', 'getSchedulesForWeek'],
      });
    },
  });

  return (
    <button
      onClick={() =>
        createMutation.mutate({
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:30',
        })
      }
    >
      Create Schedule
    </button>
  );
}
```

### Vanilla TypeScript

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/src/routers';

const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      credentials: 'include', // Important for cookies
    }),
  ],
});

// Query
const slots = await client.scheduler.getSchedulesForWeek.query({
  startDate: '2024-10-14',
});

// Mutation
const newSchedule = await client.scheduler.createSchedule.mutate({
  dayOfWeek: 1,
  startTime: '09:00',
  endTime: '10:30',
});
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding rate limiting middleware to prevent abuse.

**Recommended limits**:
- 100 requests per 15 minutes per IP
- 1000 requests per hour per authenticated user

---

## Versioning

The API currently does not use versioning. Breaking changes will be communicated via:
- Major version bumps in package.json
- Migration guides in documentation
- Deprecated procedure warnings

---

## Support

For API questions or issues:
1. Check this documentation
2. Review [Architecture Documentation](./architecture.md)
3. Check GitHub issues
4. Open a new issue with reproduction steps

---

**Note**: This API is for the Weekwise scheduler application only. There are no endpoints for blockchain data, whale tracking, price feeds, AI prompts, or Firebase functions.
