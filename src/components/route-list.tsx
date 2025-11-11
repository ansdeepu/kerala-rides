'use client';

import * as React from 'react';
import type { Bus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Bus as BusIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

const parseTime = (name: string): Date | null => {
    const timeMatch = name.match(/@\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (!timeMatch || !timeMatch[1]) return null;

    const timeStr = timeMatch[1];
    const now = new Date();
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return null;

    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    if (modifier.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
};

interface RouteListProps {
    buses: Bus[];
    onBusSelect: (id: string) => void;
    isLoading: boolean;
}

export function RouteList({ buses, onBusSelect, isLoading }: RouteListProps) {
    
    const filteredAndSortedBuses = React.useMemo(() => {
        const now = new Date().getTime();

        const upcoming: Bus[] = [];
        const pastOrActive: Bus[] = [];
        const finished: Bus[] = [];

        for (const bus of buses) {
            if (bus.status === 'Finished') {
                finished.push(bus);
            } else {
                const busTime = parseTime(bus.name);
                if (busTime && busTime.getTime() > now && bus.status === 'Not Started') {
                    upcoming.push(bus);
                } else {
                    pastOrActive.push(bus);
                }
            }
        }
        
        const timeSorter = (a: Bus, b: Bus) => {
            const timeA = parseTime(a.name);
            const timeB = parseTime(b.name);
            if (!timeA || !timeB) return 0;
            return timeA.getTime() - timeB.getTime();
        };

        upcoming.sort(timeSorter);
        pastOrActive.sort(timeSorter);
        finished.sort(timeSorter);

        return [...upcoming, ...pastOrActive, ...finished];
    }, [buses]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        )
    }
    
    return (
        <div className="flex flex-col h-full">
            <h2 className="text-2xl font-bold font-headline mb-4">All Routes</h2>
            <ScrollArea className="h-full -mr-4 pr-4">
                {filteredAndSortedBuses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAndSortedBuses.map((bus) => (
                    <Card
                        key={bus.id}
                        className="transition-all cursor-pointer hover:shadow-lg hover:border-primary"
                        onClick={() => onBusSelect(bus.id)}
                    >
                        <CardHeader className='p-4'>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-md font-bold font-headline">
                                        {bus.name}
                                    </CardTitle>
                                    <CardDescription>
                                        Status: {bus.status}
                                    </CardDescription>
                                </div>
                                <span
                                    className={cn(
                                    "text-xs font-semibold px-2 py-1 rounded-full",
                                    bus.status === "On Time" && "bg-green-100 text-green-800",
                                    bus.status === "Delayed" && "bg-orange-100 text-orange-800",
                                    bus.status === "Early" && "bg-blue-100 text-blue-800",
                                    (bus.status === "Not Started" || bus.status === "Finished") && "bg-gray-100 text-gray-800"
                                    )}
                                >
                                    {bus.status}
                                </span>
                            </div>
                        </CardHeader>
                    </Card>
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                    <BusIcon className="w-12 h-12 mb-4" />
                    <h3 className="text-lg font-semibold">No Routes Found</h3>
                    <p className="text-sm">There are no active routes to display.</p>
                </div>
                )}
            </ScrollArea>
        </div>
    )
}
