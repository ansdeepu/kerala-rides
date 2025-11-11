'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
import type { Bus, Trip } from '@/lib/types';
import { Bus as BusIcon, CalendarIcon, PlayCircle, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { StopTimeline } from '@/components/stop-timeline';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from '@/hooks/use-location';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function RouteDetailsPage() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();
    const params = useParams();
    const busId = params.id as string;
    const db = useFirestore();

    const { location, error: locationError, startTracking, stopTracking } = useLocation();
    const [isDriving, setIsDriving] = React.useState(false);

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
    
    // Effect to handle location updates when driving
    React.useEffect(() => {
        if (isDriving && location && db && busId) {
            const routeRef = doc(db, 'routes', busId);
            updateDoc(routeRef, {
                currentLocation: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                updatedAt: serverTimestamp(),
            }).catch(e => {
                console.error("Error updating bus location: ", e);
                toast({
                    variant: "destructive",
                    title: "Could not update location",
                    description: "There was an error sending your location to the server."
                })
            });
        }
    }, [isDriving, location, db, busId]);

    // Effect to show location errors
    React.useEffect(() => {
        if (locationError) {
            toast({
                variant: 'destructive',
                title: 'Location Error',
                description: locationError,
            });
            setIsDriving(false);
            stopTracking();
        }
    }, [locationError, stopTracking]);

    const handleStartDriving = () => {
        startTracking();
        setIsDriving(true);
        toast({
            title: "Real-time Tracking Started",
            description: "You are now broadcasting your location for this bus.",
        });
    };
    
    const handleStopDriving = () => {
        stopTracking();
        setIsDriving(false);
         toast({
            title: "Real-time Tracking Stopped",
            description: "You are no longer broadcasting your location.",
        });
    };


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
    const status = isToday && liveBus ? liveBus.status : (historicTrip ? 'Finished' : `Viewing history for ${format(selectedDate, 'PPP')}`);

    return (
        <main className="flex-1 p-4 h-screen overflow-y-auto">
            <div className="container mx-auto max-w-4xl">
                <header className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-3">
                            <BusIcon />
                            Route: {busForDisplay?.name}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Status: {' '}
                            <span className={cn(
                                "font-semibold",
                                status === "On Time" && "text-green-600",
                                status === "Delayed" && "text-orange-500",
                                status === "Early" && "text-blue-600",
                                (status === "Not Started" || status === "Finished") && "text-gray-500"
                            )}>
                                {status}
                            </span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full md:w-[240px] justify-start text-left font-normal",
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

                        {isDriving ? (
                            <Button onClick={handleStopDriving} variant="destructive" className="w-full md:w-auto">
                                <Square className="mr-2 h-4 w-4" /> Stop Driving
                            </Button>
                        ) : (
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button className="bg-green-600 hover:bg-green-700 w-full md:w-auto">
                                        <PlayCircle className="mr-2 h-4 w-4" /> Start Driving
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Start Live Tracking?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will use your phone's GPS to broadcast its location as this bus's live location. Your location will be visible to all users viewing this route. Are you sure you want to proceed?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleStartDriving} className="bg-green-600 hover:bg-green-700">
                                        Confirm & Start
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
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
