'use client';

import * as React from 'react';
import type { Bus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Bus as BusIcon } from 'lucide-react';
import { Input } from './ui/input';

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

export function RouteList({ buses, onBusSelect, selectedBusId }: { buses: Bus[], onBusSelect: (id: string) => void, selectedBusId: string | null }) {
    const [searchQuery, setSearchQuery] = React.useState("");

    const filteredAndSortedBuses = React.useMemo(() => {
        const filtered = buses.filter((bus) =>
        bus.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const now = new Date().getTime();

        const upcoming: Bus[] = [];
        const pastOrActive: Bus[] = [];
        const finished: Bus[] = [];

        for (const bus of filtered) {
            if (bus.status === 'Finished') {
                finished.push(bus);
            } else {
                const busTime = parseTime(bus.name);
                if (busTime && busTime.getTime() > now) {
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
    }, [buses, searchQuery]);
    
    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>All Routes</CardTitle>
                <CardDescription>Select a route to see details.</CardDescription>
            </CardHeader>
            <div className="px-6 pb-4">
                {/* I'll add the global search here later */}
            </div>
            <ScrollArea className="flex-1">
                {filteredAndSortedBuses.length > 0 ? (
                <div className="p-4 space-y-3">
                    {filteredAndSortedBuses.map((bus) => (
                    <Card
                        key={bus.id}
                        className={cn(
                            "transition-all cursor-pointer hover:shadow-md hover:border-primary",
                            selectedBusId === bus.id && "border-primary shadow-md"
                        )}
                        onClick={() => onBusSelect(bus.id)}
                    >
                        <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                            <CardTitle className="text-sm font-bold font-headline">
                                {bus.name}
                            </CardTitle>
                            <CardDescription>
                                Status: {bus.status}
                            </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
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
        </Card>
    )
}
