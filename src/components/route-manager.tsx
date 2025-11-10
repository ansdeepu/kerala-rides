'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, deleteDoc } from 'firebase/firestore';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useFirestore } from '@/firebase';
import { toast } from '@/hooks/use-toast';
import { Trash, MapPin } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Route {
  id: string;
  name: string;
  stops: { name: string; arrivalTime: string; location: { lat: number; lng: number } }[];
}

const stopSchema = z.object({
  name: z.string().min(3, 'Stop name is required.'),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid 24-hour time (e.g., 14:30)."),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type StopFormValues = z.infer<typeof stopSchema>;

function AddStopForm({ routeId }: { routeId: string }) {
  const db = useFirestore();
  const [selectedPosition, setSelectedPosition] = React.useState<{ lat: number; lng: number } | null>(null);
  const mapCenter = { lat: 9.2647, lng: 76.7874 }; // Pathanamthitta default

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      name: '',
      arrivalTime: '',
      lat: mapCenter.lat,
      lng: mapCenter.lng,
    }
  });
  
  React.useEffect(() => {
    if (selectedPosition) {
      form.setValue('lat', selectedPosition.lat);
      form.setValue('lng', selectedPosition.lng);
    }
  }, [selectedPosition, form]);

  const handleAddStop = async (values: StopFormValues) => {
    if (!db) return;
    const routeRef = doc(db, 'routes', routeId);
    try {
      await updateDoc(routeRef, {
        stops: arrayUnion({
          name: values.name,
          arrivalTime: values.arrivalTime,
          location: {
            lat: values.lat,
            lng: values.lng,
          },
        }),
      });
      toast({ title: 'Stop added successfully!' });
      form.reset();
      setSelectedPosition(null);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error adding stop',
        description: error.message,
      });
    }
  };
  
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.detail.latLng) {
      setSelectedPosition(event.detail.latLng);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleAddStop)}
        className="p-4 border rounded-md space-y-4"
      >
        <h4 className="font-semibold">Add New Stop</h4>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stop Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Central Bus Stand" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="arrivalTime"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arrival Time</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
          <FormLabel>Stop Location</FormLabel>
          <CardDescription className="mb-2">Click on the map to select a location for the stop.</CardDescription>
          <div className="w-full h-64 rounded-md overflow-hidden">
            <APIProvider apiKey={API_KEY}>
              <Map
                defaultCenter={mapCenter}
                defaultZoom={10}
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                mapId="route-manager-map"
                onClick={handleMapClick}
              >
                {selectedPosition && (
                  <AdvancedMarker position={selectedPosition}>
                    <MapPin className="text-red-500 w-8 h-8" />
                  </AdvancedMarker>
                )}
              </Map>
            </APIProvider>
          </div>
        </div>

        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="lat"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" readOnly placeholder="Select on map" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lng"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" readOnly placeholder="Select on map" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit">Add Stop</Button>
      </form>
    </Form>
  )
}


export function RouteManager() {
  const { data: routes, loading } = useCollection<Route>('routes');
  const db = useFirestore();

  const handleDeleteRoute = async (routeId: string) => {
    if (!db || !confirm('Are you sure you want to delete this route? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'routes', routeId));
      toast({ title: 'Route deleted successfully' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting route',
        description: error.message,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Manager</CardTitle>
        <CardDescription>
          Add or remove stops from existing routes. Click on a route to expand it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading routes...</p>
        ) : !API_KEY ? (
          <div className="text-red-600 p-4 border-l-4 border-red-600 bg-red-100">
            <h4 className="font-bold">Google Maps API Key Missing</h4>
            <p>You need to provide a Google Maps API Key in your environment variables to use the map features.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {routes?.map((route) => (
              <AccordionItem key={route.id} value={route.id}>
                <div className="flex items-center justify-between w-full">
                  <AccordionTrigger className="flex-grow text-left">
                    <span>{route.name}</span>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteRoute(route.id);
                    }}
                    className="mr-4 hover:bg-destructive/10"
                  >
                    <Trash className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <AccordionContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Existing Stops:</h4>
                    {route.stops.length > 0 ? (
                      <ul className="list-decimal pl-5 space-y-1 text-sm">
                        {route.stops.map((stop) => (
                          <li key={stop.name}>
                            <strong>{stop.name}</strong> (Arrives: {stop.arrivalTime})
                            <br/>
                            <span className="text-muted-foreground">Lat: {stop.location.lat.toFixed(4)}, Lng: {stop.location.lng.toFixed(4)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No stops added yet for this route.
                      </p>
                    )}
                  </div>

                  <AddStopForm routeId={route.id} />
                  
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

    