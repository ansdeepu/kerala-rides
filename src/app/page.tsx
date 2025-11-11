'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { BusPanel } from '@/components/bus-panel';
import type { Bus, Stop } from '@/lib/types';
import { useUser, useCollection } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Bus as BusIcon, Circle, CheckCircle, Clock } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

function StopTimeline({ stops, nextStopIndex, direction, eta }: { stops: Stop[], nextStopIndex: number, direction: 'forward' | 'backward', eta?: string }) {
  if (!stops || stops.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No stops defined for this route.</div>
  }
  
  const routeNotStarted = eta === "Route has not started";

  return (
    <ScrollArea className="h-full">
        <div className="p-4 md:p-8">
            <ol>
                {routeNotStarted && (
                  <li className="flex gap-4 mb-4">
                      <div className="flex flex-col items-center">
                          <Clock className="w-6 h-6 text-muted-foreground" />
                          <div className="w-px h-12 bg-border my-2" />
                      </div>
                      <div>
                          <p className="font-semibold text-muted-foreground">Route has not started</p>
                          <p className="text-sm text-muted-foreground">The bus is at the first stop.</p>
                      </div>
                  </li>
                )}
                {stops.map((stop, index) => {
                    const isCompleted = !routeNotStarted && (direction === 'forward' ? nextStopIndex > index : nextStopIndex < index);
                    const isCurrent = !routeNotStarted && (nextStopIndex === index);
                    const isFirstStopBeforeStart = routeNotStarted && index === 0;

                    return (
                    <li key={stop.name} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            {isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-primary" />
                            ) : (
                                <Circle className={cn("w-6 h-6", (isCurrent || isFirstStopBeforeStart) ? "text-primary animate-pulse" : "text-muted-foreground")} />
                            )}
                            {index < stops.length - 1 && <div className="w-px h-12 bg-border my-2" />}
                        </div>
                        <div>
                            <p className={cn("font-semibold", (isCurrent || isFirstStopBeforeStart) && "text-primary")}>{stop.name}</p>
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
  
  const { data: routes, loading: routesLoading } = useCollection<Bus>('routes');
  
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [drivingBusId, setDrivingBusId] = React.useState<string | null>(null);
  
  const selectedBus = React.useMemo(
    () => buses.find((b) => b.id === selectedBusId) || null,
    [buses, selectedBusId]
  );
  
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

  // Simulate bus movement
  React.useEffect(() => {
    if (!routes || routes.length === 0) return;

    const interval = setInterval(() => {
      setBuses((currentBuses) => simulateBusMovement(currentBuses, drivingBusId));
    }, 5000); // Move buses every 5 seconds
    return () => clearInterval(interval);
  }, [routes, drivingBusId]);

  if (loading || routesLoading) {
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
                  Route Details: {selectedBus.name}
                </CardTitle>
                <CardDescription>Status: {selectedBus.status}</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                 <StopTimeline 
                    stops={selectedBus.stops || []} 
                    nextStopIndex={selectedBus.nextStopIndex} 
                    direction={selectedBus.direction}
                    eta={selectedBus.eta}
                 />
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
