'use client';

import { createContext, useContext } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// This file creates a context for the Firebase app, auth, and firestore instances.
// It also provides hooks to access these instances from any component in the app.
// This is a common pattern for managing global state in React applications.
// By using a context, we can avoid passing the Firebase instances down through the component tree.

// Define the shape of the context value.
interface FirebaseContextValue {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
}

// Create the context with a default value of null.
const FirebaseContext = createContext<FirebaseContextValue>({
  app: null,
  auth: null,
  db: null,
});

// Create a provider component that will wrap the application.
// This component will provide the Firebase instances to all its children.
export function FirebaseProvider({
  children,
  app,
  auth,
  db,
}: {
  children: React.ReactNode;
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}) {
  return <FirebaseContext.Provider value={{ app, auth, db }}>{children}</FirebaseContext.Provider>;
}

// Create a hook to access the Firebase context.
// This hook will throw an error if used outside of a FirebaseProvider.
// This is a good practice to ensure that the context is always available when needed.
export const useFirebase = () => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }

  return context;
};

// Create hooks to access the individual Firebase instances.
// These hooks are just wrappers around the useFirebase hook.
// They provide a more convenient way to access the instances.
export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().db;
