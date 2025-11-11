'use client';

import * as React from 'react';
import type { Bus } from '@/lib/types';
import { useCollection, useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import { SearchResults } from '@/components/search-results';
import { RouteList } from '@/components/route-list';
import { useLayout } from '@/components/layout-provider';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useLayout();
  
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [drivingBusId, setDrivingBusId] = React.useState<string | null>(null);
  
  const { data: routes, loading: routesLoading } = useCollection<Bus>('routes');

  React.useEffect(() => {
    if (routes) {
        setBuses(routes);
    }
  }, [routes]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Simulate bus movement for non-driving buses
  React.useEffect(() => {
    const interval = setInterval(() => {
      setBuses((currentBuses) => simulateBusMovement(currentBuses, drivingBusId));
    }, 5000);
    return () => clearInterval(interval);
  }, [drivingBusId]);


  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    return null;
  }
  
  const showSearchResults = searchQuery.length > 0;

  const handleRouteSelect = (id: string) => {
    router.push(`/route/${id}`);
  }

  return (
      <main className="flex-1 p-4 h-screen overflow-y-auto">
           {showSearchResults ? (
            <SearchResults 
              routes={buses} 
              query={searchQuery} 
              onResultClick={(id) => {
                handleRouteSelect(id);
                setSearchQuery('');
              }}
            />
          ) : (
              <RouteList 
                  buses={buses}
                  onBusSelect={handleRouteSelect}
                  isLoading={routesLoading}
              />
          )
        }
      </main>
  );
}
