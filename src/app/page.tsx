'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { NavSidebar } from '@/components/nav-sidebar';
import { RouteList } from '@/components/route-list';
import type { Bus, Stop, Trip } from '@/lib/types';
import { useUser, useCollection, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bus as BusIcon, CalendarIcon, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { StopTimeline } from '@/components/stop-timeline';


export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const { data: routes, loading: routesLoading } = useCollection<Bus>('routes');
  
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [drivingBusId, setDrivingBusId] = React.useState<string | null>(null);

  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const historicTripPath = selectedBusId ? `routes/${selectedBusId}/history/${dateString}` : null;
  const { data: historicTrip, loading: tripLoading } = useDoc<Trip>(historicTripPath);
  
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
  
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
      <div className="flex h-screen bg-background">
        <NavSidebar />
        <main className="flex-1 grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4 p-4 h-full overflow-hidden">
          
          {/* Route List Column */}
          <div className="md:col-span-1 xl:col-span-1 h-full">
            <RouteList 
              buses={buses}
              onBusSelect={setSelectedBusId}
              selectedBusId={selectedBusId}
            />
          </div>

          {/* Details Column */}
          <div className="md:col-span-2 xl:col-span-3 h-full overflow-y-auto">
             {selectedBus ? (
              <Card className="h-full flex-1 flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-3">
                          <BusIcon />
                          Route Details: {selectedBus.name}
                        </CardTitle>
                        <CardDescription>Status: {isToday ? selectedBus.status : `Viewing history for ${format(selectedDate, 'PPP')}`}</CardDescription>
                      </div>
                      <Popover>
                          <PopoverTrigger asChild>
                              <Button
                              variant={"outline"}
                              className={cn(
                                  "w-[240px] justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                              )}
                              >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={(date) => date && setSelectedDate(date)}
                              disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                              initialFocus
                              />
                          </PopoverContent>
                      </Popover>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 h-0">
                  <StopTimeline 
                      stops={selectedBus.stops || []} 
                      nextStopIndex={selectedBus.nextStopIndex} 
                      direction={selectedBus.direction}
                      eta={selectedBus.eta}
                      historicStops={historicTrip?.stops}
                      selectedDate={selectedDate}
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Card className="max-w-md text-center bg-transparent border-dashed">
                  <CardHeader>
                    <CardTitle className="font-headline text-primary flex items-center justify-center gap-2">
                      <MapPin />
                      Select a Route
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>Please select a route from the list to see its details and stop timeline.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
  );
}
