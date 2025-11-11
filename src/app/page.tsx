'use client';

import * as React from 'react';
import { NavSidebar } from '@/components/nav-sidebar';
import type { Bus, Trip } from '@/lib/types';
import { useUser, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bus as BusIcon, CalendarIcon } from 'lucide-react';
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
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Simulate bus movement - this should be the source of truth for bus state
  React.useEffect(() => {
    // This effect should only run when the initial routes are loaded
    // It sets up an interval that continuously updates the bus states
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
  
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const showSearchResults = searchQuery.length > 0;
  const showBusDetails = !showSearchResults && selectedBus;

  return (
      <div className="flex h-screen bg-background">
        <NavSidebar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            buses={buses}
            setBuses={setBuses}
            selectedBusId={selectedBusId}
            onBusSelect={(id) => {
              setSelectedBusId(id);
              setSearchQuery(''); // Clear search when a bus is selected
            }}
        />

        <main className="flex-1 p-4 h-full overflow-y-auto">
             {showBusDetails && selectedBus ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                      <div>
                        <h2 className="text-2xl font-bold font-headline flex items-center gap-3">
                          <BusIcon />
                          Route: {selectedBus.name}
                        </h2>
                        <p className="text-muted-foreground">Status: {isToday ? selectedBus.status : `Viewing history for ${format(selectedDate, 'PPP')}`}</p>
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
                  <StopTimeline 
                      stops={selectedBus.stops || []} 
                      nextStopIndex={selectedBus.nextStopIndex} 
                      direction={selectedBus.direction}
                      eta={selectedBus.eta}
                      historicStops={historicTrip?.stops}
                      selectedDate={selectedDate}
                  />
                </>
            ) : showSearchResults ? (
              <SearchResults 
                routes={buses} 
                query={searchQuery} 
                onResultClick={(id) => {
                  setSelectedBusId(id);
                  setSearchQuery('');
                }}
              />
            ) : (
                <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                    <p>Select a route from the list to see its details and timeline.</p>
                </div>
            )
          }
        </main>
      </div>
  );
}
