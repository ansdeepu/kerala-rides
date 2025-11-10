"use client";

import * as React from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { Bus as BusIcon, Route } from "lucide-react";
import type { Bus } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface MapViewProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onBusSelect: (id: string | null) => void;
}

export default function MapView({ buses, selectedBus, onBusSelect }: MapViewProps) {
  const mapCenter = { lat: 9.2647, lng: 76.7874 }; // Pathanamthitta
  
  const [activeMarkerId, setActiveMarkerId] = React.useState<string | null>(null);
  
  const activeMarkerBus = React.useMemo(() => {
    if (!activeMarkerId) return null;
    return buses.find(b => b.id === activeMarkerId);
  }, [activeMarkerId, buses]);

  if (!API_KEY) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <Card className="max-w-md text-center">
            <CardHeader>
                <CardTitle className="font-headline text-destructive">Google Maps API Key Missing</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Please add your Google Maps API key to view the map.</p>
                <p className="text-sm mt-2 text-muted-foreground">Create a <code className="p-1 rounded-sm bg-secondary">.env.local</code> file and add <code className="p-1 rounded-sm bg-secondary">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=&lt;YOUR_KEY&gt;</code>.</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={mapCenter}
          center={selectedBus ? selectedBus.currentLocation : mapCenter}
          defaultZoom={9}
          zoom={selectedBus ? 12 : 9}
          gestureHandling={"greedy"}
          disableDefaultUI={true}
          mapId="kerala-rides-map"
          className="rounded-lg"
          mapTypeControl={false}
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
              <BusIcon className="w-8 h-8 text-white transition-transform duration-300 ease-in-out" style={{
                filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
                transform: selectedBus?.id === bus.id ? 'scale(1.5)' : 'scale(1)',
                color: selectedBus?.id === bus.id ? 'hsl(var(--accent))' : 'hsl(var(--primary))'
              }}/>
            </AdvancedMarker>
          ))}
          
           {activeMarkerBus && (
            <InfoWindow
              position={activeMarkerBus.currentLocation}
              onCloseClick={() => setActiveMarkerId(null)}
              pixelOffset={[0, -40]}
            >
              <div className="p-2">
                <h3 className="font-bold font-headline">{activeMarkerBus.routeName}</h3>
                <p className="text-sm">No: {activeMarkerBus.number}</p>
                <p className="text-sm">Status: {activeMarkerBus.status}</p>
                <Button size="sm" className="w-full mt-2" onClick={() => onBusSelect(activeMarkerBus.id)}>View Details</Button>
              </div>
            </InfoWindow>
          )}

        </Map>
      </APIProvider>
    </div>
  );
}
