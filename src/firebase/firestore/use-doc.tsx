'use client';

import { useEffect, useState } from 'react';
import {
  onSnapshot,
  doc,
  type Firestore,
  type DocumentData,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

// This hook provides a real-time stream of a single document from Firestore.
// It uses the onSnapshot listener to keep the data up-to-date.
// It also provides a loading state, so you can show a spinner while the data is being fetched.
export function useDoc<T = DocumentData>(path: string) {
  const db = useFirestore() as Firestore;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we don't have a database instance, we can't fetch the data.
    if (!db) return;

    // The onSnapshot listener is called whenever the data in the document changes.
    // We use this to update the state with the new data.
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        setData({ id: snapshot.id, ...snapshot.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    });

    // We return a cleanup function that unsubscribes from the listener.
    // This is important to prevent memory leaks.
    return () => unsubscribe();
  }, [db, path]);

  return { data, loading };
}
