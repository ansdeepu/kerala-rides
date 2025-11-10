'use client';

import { useDoc } from '../firestore/use-doc';
import { useUser } from './use-user';
import type { UserProfile } from '@/lib/types';


export function useUserProfile() {
  const { user } = useUser();
  const { data: userProfile, loading } = useDoc<UserProfile>(user ? `users/${user.uid}` : '');

  return { userProfile, loading };
}
