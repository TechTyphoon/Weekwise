# Firebase Integration Guide

This document describes the Firebase integration for real-time data access and authentication.

## Setup

### 1. Install Dependencies

Firebase is already installed. If you need to reinstall:

```bash
bun add firebase
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your Firebase project credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Your Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Your Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Your Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

### 3. Firebase Project Setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore Database
3. Enable Authentication (Anonymous and/or Email/Password)
4. Set up Firestore security rules

## Architecture

### Provider Pattern

The `FirebaseProvider` component wraps the application and provides:
- Firebase app instance
- Firestore database instance
- Authentication state
- Helper methods for auth operations

### Hooks

#### `useFirebase()`
Access Firebase services and auth state from any component.

```tsx
import { useFirebase } from "@/components/firebase-provider";

function MyComponent() {
  const { auth, db, user, loading, signInAnonymous, signOut } = useFirebase();
  // ...
}
```

#### `useAlertsFeed(options)`
Subscribe to real-time alerts/events from Firestore.

```tsx
import { useAlertsFeed } from "@/hooks/use-alerts-feed";

function AlertsComponent() {
  const { alerts, loading, error } = useAlertsFeed({
    limitCount: 10,
    filters: [
      { field: "type", operator: "==", value: "error" }
    ]
  });
  // ...
}
```

#### `useFirestoreCollection<T>(options)`
Subscribe to any Firestore collection with type safety.

```tsx
import { useFirestoreCollection } from "@/hooks/use-firestore-collection";

function EventsComponent() {
  const { data, loading, error } = useFirestoreCollection<Event>({
    collectionName: "events",
    orderByField: "timestamp",
    orderDirection: "desc",
    limitCount: 20
  });
  // ...
}
```

#### `useFirestoreDocument<T>(options)`
Subscribe to a single Firestore document.

```tsx
import { useFirestoreDocument } from "@/hooks/use-firestore-document";

function UserProfile({ userId }: { userId: string }) {
  const { data, loading, error } = useFirestoreDocument<User>({
    collectionName: "users",
    documentId: userId
  });
  // ...
}
```

### Utilities

#### Firestore Operations

```tsx
import { addDocument, updateDocument, deleteDocument } from "@/lib/firestore-utils";

// Add a document
const docId = await addDocument("events", {
  message: "New event",
  type: "info"
});

// Update a document
await updateDocument("events", docId, {
  message: "Updated event"
});

// Delete a document
await deleteDocument("events", docId);
```

## Authentication

The integration supports two authentication methods:

### Anonymous Authentication
Automatically used in the dashboard for users without credentials. Allows Firestore security rules to work properly.

```tsx
const { signInAnonymous } = useFirebase();
await signInAnonymous();
```

### Email/Password Authentication
For persistent user accounts.

```tsx
const { signInWithEmail, signUpWithEmail } = useFirebase();

// Sign up
await signUpWithEmail("user@example.com", "password123");

// Sign in
await signInWithEmail("user@example.com", "password123");
```

## Firestore Security Rules

Example security rules for the events collection:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{eventId} {
      // Allow authenticated users to read
      allow read: if request.auth != null;
      
      // Allow authenticated users to write
      allow write: if request.auth != null;
    }
  }
}
```

## Dashboard Route

The `/dashboard` route demonstrates Firebase integration:
- Real-time alerts feed
- Live events stream
- Anonymous authentication
- Error handling
- Loading states

## Integration with Existing Auth

The Firebase auth is separate from the existing better-auth system:
- better-auth is used for user sessions and protected routes
- Firebase auth is used specifically for Firestore security rules
- Both can coexist - better-auth handles the main app, Firebase handles real-time data access

## Best Practices

1. **Always check auth state** before accessing Firestore
2. **Handle loading and error states** in your components
3. **Use anonymous auth** for public real-time features
4. **Use email/password auth** for user-specific data
5. **Filter and limit queries** to reduce bandwidth
6. **Unsubscribe from listeners** (hooks handle this automatically)

## Troubleshooting

### Firebase not connecting
- Check environment variables are set correctly
- Verify Firebase project settings
- Check browser console for errors

### Firestore permission denied
- Verify security rules allow the operation
- Check that user is authenticated (even anonymously)
- Review Firebase Console for security rule errors

### Real-time updates not working
- Verify internet connection
- Check Firestore indexes are created
- Review browser console for WebSocket errors
