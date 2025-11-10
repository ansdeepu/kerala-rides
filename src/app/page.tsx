'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { BusPanel } from '@/components/bus-panel';
import type { Bus } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import type { Route } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

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
        <div className="w-full h-full flex items-center justify-center bg-muted">
           <Card className="max-w-md text-center">
            <CardHeader>
              <CardTitle className="font-headline text-primary flex items-center justify-center gap-2">
                <MapPin />
                Map View Disabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>The interactive map is currently disabled.</p>
              <p className="text-sm mt-2 text-muted-foreground">
                To re-enable map functionality, a valid Google Maps API key with billing enabled is required.
              </p>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
