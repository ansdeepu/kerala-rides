'use client';

import { useDoc } from '../firestore/use-doc';
import { useUser } from './use-user';
import type { UserProfile } from '@/lib/types';
import { useState, useEffect } from 'react';


export function useUserProfile() {
  const { user, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // The user's profile data from firestore
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  useEffect(() => {
    // We get the admin status from the user's ID token claims
    if (user) {
      user.getIdTokenResult().then((idTokenResult) => {
        setIsAdmin(!!idTokenResult.claims.admin);
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // The overall loading state is true if either the user or profile is loading,
  // or if we are still waiting to determine the admin status.
  const loading = userLoading || profileLoading || (user && typeof isAdmin === 'undefined');

  return { userProfile, user, isAdmin, loading };
}
