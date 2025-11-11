'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Bus as BusIcon, Search, Clock } from 'lucide-react';
import type { Bus, Stop } from '@/lib/types';

interface SearchResultsProps {
  routes: Bus[];
  query: string;
  onResultClick: (id: string) => void;
}

interface SearchResult {
    routeId: string;
    routeName: string;
    stopName: string;
    arrivalTime: string;
}

// Helper to convert "hh:mm AM/PM" to a Date object for today
const timeToDate = (timeStr: string): Date | null => {
    if (!timeStr || !timeStr.includes(' ')) {
      return null;
    }
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


export function SearchResults({ routes, query, onResultClick }: SearchResultsProps) {
  const searchResults = React.useMemo(() => {
    if (!query) return [];
    
    const lowercasedQuery = query.toLowerCase();
    const now = new Date();
    const results: SearchResult[] = [];

    routes.forEach(route => {
      // First, check if the route name itself matches
      if (route.name.toLowerCase().includes(lowercasedQuery)) {
        // If the route name matches, we add a generic result for the route itself,
        // without specifying a stop.
        results.push({
            routeId: route.id,
            routeName: route.name,
            stopName: "Route Match",
            arrivalTime: route.status,
        });
      }

      // Next, check for matching stops with future arrival times
      if (route.stops) {
          route.stops.forEach(stop => {
              const arrivalTimeDate = timeToDate(stop.arrivalTime);
              if (
                  stop.name.toLowerCase().includes(lowercasedQuery) &&
                  arrivalTimeDate &&
                  arrivalTimeDate >= now
              ) {
                  results.push({
                      routeId: route.id,
                      routeName: route.name,
                      stopName: stop.name,
                      arrivalTime: stop.arrivalTime,
                  });
              }
          });
      }
    });

    // Sort results: route matches first, then by time
    results.sort((a, b) => {
        if (a.stopName === 'Route Match') return -1;
        if (b.stopName === 'Route Match') return 1;
        const timeA = timeToDate(a.arrivalTime);
        const timeB = timeToDate(b.arrivalTime);
        if (timeA && timeB) {
            return timeA.getTime() - timeB.getTime();
        }
        return 0;
    });

    return results;
  }, [routes, query]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search />
          Search Results
        </CardTitle>
        <CardDescription>
          Found {searchResults.length} results matching "{query}"
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {searchResults.length > 0 ? (
            <div className="p-4 space-y-3">
              {searchResults.map((result, index) => (
                <Card
                  key={`${result.routeId}-${index}`}
                  className="transition-all cursor-pointer hover:shadow-md hover:border-primary"
                  onClick={() => onResultClick(result.routeId)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-base font-bold font-headline">
                      {result.routeName}
                    </CardTitle>
                    {result.stopName === 'Route Match' ? (
                       <CardDescription>Status: {result.arrivalTime}</CardDescription>
                    ) : (
                      <CardDescription className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>Arriving at <strong>{result.stopName}</strong> at {result.arrivalTime}</span>
                      </CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <BusIcon className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-semibold">No Upcoming Buses Found</h3>
              <p className="text-sm">Your search for "{query}" did not return any upcoming results.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
