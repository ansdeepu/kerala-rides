'use client';

import * as React from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { Bus as BusIcon } from 'lucide-react';
import type { Bus } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { MapErrorBoundary } from './map-error-boundary';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface MapViewProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onBusSelect: (id: string | null) => void;
}

export default function MapView({
  buses,
  selectedBus,
  onBusSelect,
}: MapViewProps) {
  const mapCenter = { lat: 9.2647, lng: 76.7874 }; // Pathanamthitta

  const [activeMarkerId, setActiveMarkerId] = React.useState<string | null>(
    null
  );
  
  const [mapLoadError, setMapLoadError] = React.useState(false);

  const activeMarkerBus = React.useMemo(() => {
    if (!activeMarkerId) return null;
    return buses.find((b) => b.id === activeMarkerId);
  }, [activeMarkerId, buses]);

  const renderErrorCard = (title: string, message: React.ReactNode) => (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Card className="max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-destructive">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {message}
          </CardContent>
        </Card>
      </div>
  );

  if (!API_KEY) {
    return renderErrorCard(
        "Google Maps API Key Missing",
        <p className="text-sm mt-2 text-muted-foreground">
            Please ensure your{' '}
            <code className="p-1 rounded-sm bg-secondary">
                NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </code>{' '}
            is set correctly.
        </p>
    );
  }

  if (mapLoadError) {
      return renderErrorCard(
          "Map Loading Error",
          <p className="text-sm mt-2 text-muted-foreground">
              The application could not connect to Google Maps. This may be due to an
              invalid API key, or because billing is not enabled for your Google
              Cloud project. Please check the browser console for more details.
          </p>
      );
  }

  return (
    <div className="w-full h-full">
      <MapErrorBoundary>
        <APIProvider apiKey={API_KEY} onLoad={() => setMapLoadError(false)}>
          <Map
            defaultCenter={mapCenter}
            center={selectedBus ? selectedBus.currentLocation : mapCenter}
            defaultZoom={9}
            zoom={selectedBus ? 12 : 9}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="kerala-rides-map"
            className="rounded-lg"
            mapTypeControl={false}
            onError={() => setMapLoadError(true)}
          >
            {buses.map((bus) => (
              <AdvancedMarker
                key={bus.id}
                position={bus.currentLocation}
                onClick={() => {
                  onBusSelect(bus.id);
                  setActiveMarkerId(bus.id);
                }}
              >
                <BusIcon
                  className="w-8 h-8 text-white transition-transform duration-300 ease-in-out"
                  style={{
                    filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
                    transform:
                      selectedBus?.id === bus.id ? 'scale(1.5)' : 'scale(1)',
                    color:
                      selectedBus?.id === bus.id
                        ? 'hsl(var(--accent))'
                        : 'hsl(var(--primary))',
                  }}
                />
              </AdvancedMarker>
            ))}

            {activeMarkerBus && (
              <InfoWindow
                position={activeMarkerBus.currentLocation}
                onCloseClick={() => setActiveMarkerId(null)}
                pixelOffset={[0, -40]}
              >
                <div className="p-2">
                  <h3 className="font-bold font-headline">
                    {activeMarkerBus.routeName}
                  </h3>
                  <p className="text-sm">No: {activeMarkerBus.number}</p>
                  <p className="text-sm">Status: {activeMarkerBus.status}</p>
                  <Button
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => onBusSelect(activeMarkerBus.id)}
                  >
                    View Details
                  </Button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </MapErrorBoundary>
    </div>
  );
}
