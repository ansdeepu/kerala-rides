'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import MapView from '@/components/map-view';
import { BusPanel } from '@/components/bus-panel';
import type { Bus } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import type { Route } from '@/lib/types';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const { data: routes, loading: routesLoading } = useCollection<Route>('routes');
  const { data: initialBuses, loading: busesLoading } = useCollection<Bus>('buses');
  
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  
  const selectedBus = React.useMemo(
    () => buses.find((b) => b.id === selectedBusId) || null,
    [buses, selectedBusId]
  );
  
  // Set initial buses from Firestore
  React.useEffect(() => {
    if (initialBuses) {
      setBuses(initialBuses);
    }
  }, [initialBuses]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Simulate bus movement
  React.useEffect(() => {
    if (!routes || routes.length === 0) return;

    const interval = setInterval(() => {
      setBuses((currentBuses) => simulateBusMovement(currentBuses, routes));
    }, 5000); // Move buses every 5 seconds
    return () => clearInterval(interval);
  }, [routes]);

  if (loading || routesLoading || busesLoading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar>
        <BusPanel
          buses={buses}
          selectedBus={selectedBus}
          onBusSelect={setSelectedBusId}
          onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </Sidebar>
      <SidebarInset>
        <MapView
          buses={buses}
          selectedBus={selectedBus}
          onBusSelect={setSelectedBusId}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
