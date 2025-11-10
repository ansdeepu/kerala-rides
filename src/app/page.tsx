'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { BusPanel } from '@/components/bus-panel';
import type { Bus, Stop } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import type { Route } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Bus as BusIcon, Circle, CheckCircle, Navigation } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

function StopTimeline({ stops, nextStopIndex, direction }: { stops: Stop[], nextStopIndex: number, direction: 'forward' | 'backward' }) {
  if (!stops || stops.length === 0) {
    return <div className="text-center text-muted-foreground">No stops defined for this route.</div>
  }
  
  return (
    <ScrollArea className="h-full">
        <div className="p-4 md:p-8">
            <ol>
                {stops.map((stop, index) => {
                    const isCompleted = direction === 'forward' ? nextStopIndex > index : nextStopIndex < index;
                    const isCurrent = nextStopIndex === index;

                    return (
                    <li key={stop.name} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            {isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-primary" />
                            ) : (
                                <Circle className={cn("w-6 h-6", isCurrent ? "text-primary animate-pulse" : "text-muted-foreground")} />
                            )}
                            {index < stops.length - 1 && <div className="w-px h-12 bg-border my-2" />}
                        </div>
                        <div>
                            <p className={cn("font-semibold", isCurrent && "text-primary")}>{stop.name}</p>
                            <p className="text-sm text-muted-foreground">{stop.arrivalTime}</p>
                        </div>
                    </li>
                )})}
            </ol>
        </div>
    </ScrollArea>
  );
}


export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const { data: routes, loading: routesLoading } = useCollection<Route>('routes');
  const { data: initialBuses, loading: busesLoading } = useCollection<Bus>('buses');
  
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [drivingBusId, setDrivingBusId] = React.useState<string | null>(null);
  
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
    if (!routes || routes.length === 0 || !initialBuses || initialBuses.length === 0) return;

    const interval = setInterval(() => {
      setBuses((currentBuses) => simulateBusMovement(currentBuses, routes, drivingBusId));
    }, 5000); // Move buses every 5 seconds
    return () => clearInterval(interval);
  }, [routes, initialBuses, drivingBusId]);

  if (loading || routesLoading || busesLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
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
        <div className="w-full h-full bg-muted flex flex-col">
          {selectedBus ? (
             <Card className="m-4 flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <BusIcon />
                  Route Details: {selectedBus.routeName}
                </CardTitle>
                <CardDescription>Bus No: {selectedBus.number}</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                 <StopTimeline stops={selectedBus.stops || []} nextStopIndex={selectedBus.nextStopIndex} direction={selectedBus.direction}/>
              </CardContent>
            </Card>
          ) : (
             <div className="w-full h-full flex items-center justify-center">
              <Card className="max-w-md text-center">
                <CardHeader>
                  <CardTitle className="font-headline text-primary flex items-center justify-center gap-2">
                    <MapPin />
                    Select a Bus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Please select a bus from the left panel to see its details and stop timeline.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
