'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useUser } from '@/firebase';
import type { Bus, Trip } from '@/lib/types';
import { Bus as BusIcon, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { StopTimeline } from '@/components/stop-timeline';
import { Skeleton } from '@/components/ui/skeleton';

export default function RouteDetailsPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const params = useParams();
    const busId = params.id as string;

    const [liveBus, setLiveBus] = React.useState<Bus | null>(null);
    const { data: route, loading: routeLoading } = useDoc<Bus>(`routes/${busId}`);

    const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const historicTripPath = busId ? `routes/${busId}/history/${dateString}` : null;
    const { data: historicTrip, loading: tripLoading } = useDoc<Trip>(historicTripPath);

    React.useEffect(() => {
        if (!userLoading && !user) {
        router.push('/login');
        }
    }, [user, userLoading, router]);

    // This effect is to handle the real-time update from the `route` doc
    React.useEffect(() => {
        if (route) {
            setLiveBus(route);
        }
    }, [route]);

    if (userLoading || routeLoading) {
        return (
            <main className="flex-1 p-4 h-screen overflow-y-auto">
                <div className="container mx-auto p-4 md:p-8">
                    <header className="mb-8 flex items-center justify-between">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-10 w-32" />
                    </header>
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </div>
            </main>
        );
    }
    
    if (!user) {
        return null; // Redirecting...
    }
    
    if (!route) {
        return (
             <main className="flex-1 p-4 h-screen overflow-y-auto">
                 <div className="container mx-auto max-w-4xl p-4 md:p-8 text-center">
                     <h2 className="text-2xl font-bold font-headline text-destructive">Route Not Found</h2>
                     <p className="mt-2 text-muted-foreground">The requested route could not be found.</p>
                 </div>
            </main>
        )
    }

    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
    const busForDisplay = isToday ? liveBus : route;
    
    return (
        <main className="flex-1 p-4 h-screen overflow-y-auto">
            <div className="container mx-auto max-w-4xl">
                <header className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                            <BusIcon />
                            Route: {busForDisplay?.name}
                        </h1>
                        <p className="text-muted-foreground">Status: {isToday && liveBus ? liveBus.status : `Viewing history for ${format(selectedDate, 'PPP')}`}</p>
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
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => date && setSelectedDate(date)}
                            disabled={(date) => date > new Date() || date < new Date("2024-01-01")}
                            initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </header>
                <main>
                    <StopTimeline 
                        stops={busForDisplay?.stops || []} 
                        nextStopIndex={busForDisplay?.nextStopIndex || 0} 
                        direction={busForDisplay?.direction || 'forward'}
                        eta={busForDisplay?.eta}
                        historicStops={historicTrip?.stops}
                        selectedDate={selectedDate}
                    />
                </main>
            </div>
        </main>
    );
}
