import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

import { firebaseConfig, isConfigValid } from './config';

// This function initializes Firebase and returns the app, auth, and firestore instances.
// It's designed to be called once and then reused throughout the app.
// This is a common pattern to avoid re-initializing Firebase on every render.
function initializeFirebase(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  // Check if any Firebase apps have been initialized.
  const apps = getApps();

  // If no apps are initialized and the config is valid, initialize a new app.
  if (!apps.length) {
    if (isConfigValid(firebaseConfig)) {
      initializeApp(firebaseConfig);
    } else {
      console.error(
        `Firebase config is not valid. Please make sure to set all the required environment variables.`
      );
    }
  }

  // Get the default app instance.
  const app = getApps()[0];

  // Get the auth and firestore instances.
  const auth = getAuth(app);
  const db = getFirestore(app);

  return { app, auth, db };
}

// We re-export the initializeFirebase function and all the hooks from the other files.
// This makes it easy to import everything from a single file.
export { initializeFirebase };
export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
