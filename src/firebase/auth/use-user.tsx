'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, onIdTokenChanged, type User } from 'firebase/auth';
import { useAuth } from '../provider';

// This hook provides the current user and their loading state.
// It uses the onAuthStateChanged and onIdTokenChanged listeners to keep the user state up-to-date.
// This is the recommended way to get the current user in Firebase.
export function useUser() {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If there is no auth instance, we can't get the user.
    if (!auth) {
      setLoading(false);
      return;
    }

    // The onAuthStateChanged listener is called when the user signs in or out.
    // We use this to set the initial user state.
    const unsubscribeAuthState = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // The onIdTokenChanged listener is called when the user's ID token changes.
    // This happens when the user's custom claims are updated.
    // We use this to force a refresh of the ID token, which will update the custom claims.
    const unsubscribeIdToken = onIdTokenChanged(auth, async (user) => {
      if (user) {
        await user.getIdToken(true);
      }
      setUser(user);
    });

    // We return a cleanup function that unsubscribes from the listeners.
    // This is important to prevent memory leaks.
    return () => {
      unsubscribeAuthState();
      unsubscribeIdToken();
    };
  }, [auth]);

  return { user, loading };
}
