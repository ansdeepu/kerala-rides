'use client';

import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { BusPanel } from '@/components/bus-panel';
import type { Bus, Stop, Trip } from '@/lib/types';
import { useUser, useCollection, useDoc } from '@/firebase';
import { useRouter } from 'next/navigation';
import { simulateBusMovement } from '@/lib/bus-simulator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MapPin, Bus as BusIcon, Circle, CheckCircle, Clock, CalendarIcon } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

function StopTimeline({ stops, nextStopIndex, direction, eta, historicStops, selectedDate }: { stops: Stop[], nextStopIndex: number, direction: 'forward' | 'backward', eta?: string, historicStops?: Stop[], selectedDate: Date }) {
  if (!stops || stops.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No stops defined for this route.</div>
  }
  
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const routeNotStarted = isToday && eta === "Route has not started";
  const displayStops = historicStops || stops;

  // Helper to convert "hh:mm AM/PM" to a comparable number.
  const timeToMinutes = (timeStr: string): number | null => {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let [hours, minutes] = [parseInt(match[1]), parseInt(match[2])];
    const modifier = match[3].toUpperCase();

    if (modifier === 'PM' && hours < 12) {
      hours += 12;
    }
    if (modifier === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  };


  return (
    <ScrollArea className="h-full">
        <div className="p-4 md:p-8">
            <ol>
                {isToday && routeNotStarted && (
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
                {displayStops.map((stop, index) => {
                    const isCompleted = historicStops ? !!stop.actualArrivalTime : !routeNotStarted && (direction === 'forward' ? nextStopIndex > index : nextStopIndex < index);
                    const isCurrent = isToday && !historicStops && !routeNotStarted && (nextStopIndex === index);
                    const isFirstStopBeforeStart = isToday && !historicStops && routeNotStarted && index === 0;

                    let statusText = '';
                    let statusClass = '';
                    if (stop.actualArrivalTime && stop.arrivalTime) {
                        const actualMinutes = timeToMinutes(stop.actualArrivalTime);
                        const scheduledMinutes = timeToMinutes(stop.arrivalTime);
                        
                        if (actualMinutes !== null && scheduledMinutes !== null) {
                            const diffMinutes = actualMinutes - scheduledMinutes;
                            
                            if (diffMinutes > 5) {
                                statusText = `Delayed by ${diffMinutes} min`;
                                statusClass = 'text-destructive';
                            } else if (diffMinutes < -5) {
                                 statusText = `Early by ${-diffMinutes} min`;
                                 statusClass = 'text-blue-600';
                            } else {
                                statusText = `On Time`;
                                statusClass = 'text-green-600';
                            }
                        } else {
                            statusText = "Invalid time";
                            statusClass = 'text-muted-foreground';
                        }
                    }

                    return (
                    <li key={stop.name + index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            {isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-primary" />
                            ) : (
                                <Circle className={cn("w-6 h-6", (isCurrent || isFirstStopBeforeStart) ? "text-primary animate-pulse" : "text-muted-foreground")} />
                            )}
                            {index < displayStops.length - 1 && <div className="w-px h-12 bg-border my-2" />}
                        </div>
                        <div className='w-full'>
                            <p className={cn("font-semibold", (isCurrent || isFirstStopBeforeStart) && "text-primary")}>{stop.name}</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Scheduled: {stop.arrivalTime}</span>
                              {stop.actualArrivalTime && (
                                <span className={cn('font-medium', statusClass)}>
                                  Actual: {stop.actualArrivalTime} ({statusText})
                                </span>
                              )}
                            </div>
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
              <CardContent className="h-[calc(100%-100px)]">
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
