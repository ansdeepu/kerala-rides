'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Bus as BusIcon, Search } from 'lucide-react';
import type { Bus } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SearchResultsProps {
  routes: Bus[];
  query: string;
  onResultClick: (id: string) => void;
}

export function SearchResults({ routes, query, onResultClick }: SearchResultsProps) {
  const filteredRoutes = React.useMemo(() => {
    if (!query) return [];
    return routes.filter(route =>
      route.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [routes, query]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search />
          Search Results
        </CardTitle>
        <CardDescription>
          Found {filteredRoutes.length} routes matching "{query}"
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {filteredRoutes.length > 0 ? (
            <div className="p-4 space-y-3">
              {filteredRoutes.map(bus => (
                <Card
                  key={bus.id}
                  className="transition-all cursor-pointer hover:shadow-md hover:border-primary"
                  onClick={() => onResultClick(bus.id)}
                >
                  <CardHeader>
                    <CardTitle className="text-base font-bold font-headline">
                      {bus.name}
                    </CardTitle>
                    <CardDescription>Status: {bus.status}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
              <BusIcon className="w-12 h-12 mb-4" />
              <h3 className="text-lg font-semibold">No Routes Found</h3>
              <p className="text-sm">Your search for "{query}" did not return any results.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
