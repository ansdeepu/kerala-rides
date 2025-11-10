'use client';

import { useDoc } from '../firestore/use-doc';
import { useUser } from './use-user';
import type { UserProfile } from '@/lib/types';


export function useUserProfile() {
  const { user } = useUser();
  // Only try to fetch the document if the user object (and thus user.uid) exists.
  const { data: userProfile, loading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  return { userProfile, loading };
}
