'use client';

import { useDoc } from '../firestore/use-doc';
import { useUser } from './use-user';
import type { UserProfile } from '@/lib/types';
import { useState, useEffect } from 'react';


export function useUserProfile() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);

  // Only try to fetch the document if the user object (and thus user.uid) exists.
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  useEffect(() => {
    if (user) {
      user.getIdTokenResult().then((idTokenResult) => {
        setIsAdmin(!!idTokenResult.claims.admin);
      });
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const loading = profileLoading || (user && typeof isAdmin === 'undefined');

  return { userProfile, isAdmin, loading };
}
