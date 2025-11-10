'use client';

import { useEffect, useState } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

import { initializeFirebase } from '.';
import { FirebaseProvider } from './provider';

// This provider is responsible for initializing Firebase on the client side.
// It should be used as a wrapper around the root of your application.
// It ensures that Firebase is initialized only once.
export function FirebaseClientProvider({ children }: { children: React.ReactNode }) {
  const [firebase, setFirebase] = useState<{
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
  } | null>(null);

  useEffect(() => {
    const { app, auth, db } = initializeFirebase();
    setFirebase({ app, auth, db });
  }, []);

  if (!firebase) {
    // You can show a loading state here if needed
    return null;
  }

  return (
    <FirebaseProvider app={firebase.app} auth={firebase.auth} db={firebase.db}>
      {children}
    </FirebaseProvider>
  );
}
