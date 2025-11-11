'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import type { Stop } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CheckCircle, Circle, Clock } from 'lucide-react';

function timeToMinutes(timeStr: string): number | null {
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


export function StopTimeline({ stops, nextStopIndex, direction, eta, historicStops, selectedDate }: { stops: Stop[], nextStopIndex: number, direction: 'forward' | 'backward', eta?: string, historicStops?: Stop[], selectedDate: Date }) {
  if (!stops || stops.length === 0) {
    return <div className="text-center text-muted-foreground p-8">No stops defined for this route.</div>
  }
  
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const displayStops = historicStops || stops;
  const isHistoricalView = !!historicStops;
  const routeNotStarted = isToday && !isHistoricalView && eta === "Route has not started";


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
                {displayStops.map((stop, index) => {
                    
                    const isCompleted = isHistoricalView 
                      ? !!stop.actualArrivalTime 
                      : !routeNotStarted && (direction === 'forward' ? nextStopIndex > index : nextStopIndex < index);
                    
                    const isCurrent = isToday && !isHistoricalView && !routeNotStarted && (nextStopIndex === index);
                    const isFirstStopBeforeStart = routeNotStarted && index === 0;

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