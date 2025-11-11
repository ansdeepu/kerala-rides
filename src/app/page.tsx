'use client';

import * as React from 'react';
import { NavSidebar } from '@/components/nav-sidebar';
import { RouteList } from '@/components/route-list';
import type { Bus, Trip } from '@/lib/types';
import { useUser, useCollection, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bus as BusIcon, CalendarIcon, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { StopTimeline } from '@/components/stop-timeline';
import { SearchResults } from '@/components/search-results';


export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  
  const { data: routes, loading: routesLoading } = useCollection<Bus>('routes');
  
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [drivingBusId, setDrivingBusId] = React.useState<string | null>(null);

  const [searchQuery, setSearchQuery] = React.useState('');

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
  const showSearchResults = searchQuery.length > 0;
  const showBusDetails = !showSearchResults && selectedBus;

  return (
      <div className="flex h-screen bg-background">
        <NavSidebar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <div className="w-1/3 border-r overflow-y-auto">
            <RouteList 
              buses={buses}
              onBusSelect={(id) => {
                setSelectedBusId(id);
                setSearchQuery(''); // Clear search when a bus is selected
              }}
              selectedBusId={selectedBusId}
            />
        </div>

        <main className="flex-1 flex flex-col gap-4 p-4 h-full overflow-hidden">
          <div className="flex-1 min-h-0">
             {showBusDetails && selectedBus ? (
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
            ) : showSearchResults ? (
              <SearchResults 
                routes={buses} 
                query={query} 
                onResultClick={(id) => {
                  setSelectedBusId(id);
                  setSearchQuery('');
                }}
              />
            ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    <p>Select a route to see its details and timeline.</p>
                </div>
            )
          }
          </div>
        </main>
      </div>
  );
}
