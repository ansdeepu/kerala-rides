'use client';

import { useEffect, useState } from 'react';
import {
  onSnapshot,
  query,
  collection,
  where,
  type Firestore,
  type Query,
  type DocumentData,
} from 'firebase/firestore';

import { useFirestore } from '../provider';

// This hook provides a real-time stream of a collection from Firestore.
// It uses the onSnapshot listener to keep the data up-to-date.
// It also provides a loading state, so you can show a spinner while the data is being fetched.
export function useCollection<T = DocumentData>(path: string, field?: string, value?: any) {
  const db = useFirestore() as Firestore;
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we don't have a database instance, we can't fetch the data.
    if (!db) return;

    let q: Query;
    // If a field and value are provided, we create a query to filter the collection.
    if (field && value) {
      q = query(collection(db, path), where(field, '==', value));
    } else {
      q = query(collection(db, path));
    }

    // The onSnapshot listener is called whenever the data in the collection changes.
    // We use this to update the state with the new data.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: T[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as T);
      });
      setData(data);
      setLoading(false);
    });

    // We return a cleanup function that unsubscribes from the listener.
    // This is important to prevent memory leaks.
    return () => unsubscribe();
  }, [db, path, field, value]);

  return { data, loading };
}
