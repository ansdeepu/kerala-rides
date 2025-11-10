'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
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
import { Trash, MapPin, Edit, X } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface Stop {
  name: string;
  arrivalTime: string;
  location: { lat: number; lng: number };
}

interface Route {
  id: string;
  name: string;
  stops: Stop[];
}

const stopSchema = z.object({
  name: z.string().min(3, 'Stop name is required.'),
  arrivalTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Please enter a valid 24-hour time (e.g., 14:30)."),
  lat: z.coerce.number().min(-90).max(90, 'Latitude must be between -90 and 90.'),
  lng: z.coerce.number().min(-180).max(180, 'Longitude must be between -180 and 180.'),
});

type StopFormValues = z.infer<typeof stopSchema>;

function StopForm({ route, onFormSubmit }: { route: Route; onFormSubmit: () => void }) {
  const db = useFirestore();
  const map = useMap();
  const [editingStop, setEditingStop] = React.useState<Stop | null>(null);
  
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

  const { formState: { isSubmitting } } = form;

  React.useEffect(() => {
    if (selectedPosition) {
      form.setValue('lat', selectedPosition.lat);
      form.setValue('lng', selectedPosition.lng);
    }
  }, [selectedPosition, form]);
  
  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.detail.latLng) {
      setSelectedPosition(event.detail.latLng);
      map?.panTo(event.detail.latLng);
    }
  };

  const handleEditClick = (stop: Stop) => {
    setEditingStop(stop);
    form.reset({
      name: stop.name,
      arrivalTime: stop.arrivalTime,
      lat: stop.location.lat,
      lng: stop.location.lng,
    });
    setSelectedPosition(stop.location);
    if(map) {
      map.panTo(stop.location);
      map.setZoom(14);
    }
  };

  const cancelEdit = () => {
    setEditingStop(null);
    form.reset({ name: '', arrivalTime: '', lat: mapCenter.lat, lng: mapCenter.lng });
    setSelectedPosition(null);
  };

  const handleDeleteStop = async (stopToDelete: Stop) => {
    if (!db) return;
    const routeRef = doc(db, 'routes', route.id);
    try {
      await updateDoc(routeRef, {
        stops: arrayRemove(stopToDelete),
      });
      toast({ title: 'Stop Deleted', description: `"${stopToDelete.name}" has been removed from the route.` });
      onFormSubmit();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error deleting stop',
        description: error.message,
      });
    }
  };

  const onSubmit = async (values: StopFormValues) => {
    if (!db) return;
    const routeRef = doc(db, 'routes', route.id);

    const newStopData = {
      name: values.name,
      arrivalTime: values.arrivalTime,
      location: { lat: values.lat, lng: values.lng },
    };

    try {
      if (editingStop) {
        // To edit an item in an array, we remove the old one and add the new one.
        // This isn't a single atomic operation but is good enough for this admin panel.
        await updateDoc(routeRef, {
          stops: arrayRemove(editingStop)
        });
        await updateDoc(routeRef, {
          stops: arrayUnion(newStopData)
        });
        toast({ title: 'Stop Updated!', description: `"${values.name}" has been updated.` });
      } else {
        await updateDoc(routeRef, {
          stops: arrayUnion(newStopData),
        });
        toast({ title: 'Stop Added!', description: `"${values.name}" has been added to the route.` });
      }
      cancelEdit();
      onFormSubmit(); // Callback to refresh parent state if needed
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `Error ${editingStop ? 'updating' : 'adding'} stop`,
        description: error.message,
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold mb-2">Existing Stops:</h4>
        {route.stops.length > 0 ? (
          <ul className="list-decimal pl-5 space-y-2 text-sm">
            {route.stops.map((stop) => (
              <li key={stop.name} className="flex justify-between items-center">
                <div>
                  <strong>{stop.name}</strong> (Arrives: {stop.arrivalTime})
                  <br />
                  <span className="text-muted-foreground">Lat: {stop.location.lat.toFixed(4)}, Lng: {stop.location.lng.toFixed(4)}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEditClick(stop)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the stop "{stop.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteStop(stop)}
                          className="bg-destructive hover:bg-destructive/90">
                          Delete Stop
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No stops added yet for this route.</p>
        )}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-4 border rounded-md space-y-4"
        >
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">{editingStop ? 'Edit Stop' : 'Add New Stop'}</h4>
            {editingStop && (
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="mr-2 h-4 w-4"/> Cancel Edit
              </Button>
            )}
          </div>
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
                <Map
                  defaultCenter={mapCenter}
                  center={selectedPosition || mapCenter}
                  defaultZoom={10}
                  zoom={selectedPosition ? 14 : 10}
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
                    <Input type="number" step="any" readOnly placeholder="Select on map" {...field} />
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
                    <Input type="number" step="any" readOnly placeholder="Select on map" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>{editingStop ? 'Update Stop' : 'Add Stop'}</Button>
        </form>
      </Form>
    </div>
  );
}

export function RouteManager() {
  const { data: routes, loading, setData: setRoutes } = useCollection<Route>('routes');
  const db = useFirestore();

  const handleDeleteRoute = async (routeId: string) => {
    if (!db || !confirm('Are you sure you want to delete this entire route and all its stops? This action cannot be undone.')) return;
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

  // Callback to refresh route data after a stop is modified
  const refreshRouteData = async (routeId: string) => {
    if (!db || !routes) return;
    const routeRef = doc(db, 'routes', routeId);
    const routeSnap = await getDoc(routeRef);
    if(routeSnap.exists()){
      const updatedRoute = {id: routeSnap.id, ...routeSnap.data()} as Route;
      setRoutes(currentRoutes => currentRoutes?.map(r => r.id === routeId ? updatedRoute : r) || []);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route Manager</CardTitle>
        <CardDescription>
          Add, edit, or remove stops from existing routes. Click on a route to expand it.
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
                  <AccordionTrigger className="flex-grow text-left hover:no-underline">
                    <span>{route.name}</span>
                  </AccordionTrigger>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                          variant="ghost"
                          size="icon"
                          className="mr-4 hover:bg-destructive/10 text-destructive hover:text-destructive"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure you want to delete this route?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the route "{route.name}" and all its stops. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRoute(route.id)}
                            className="bg-destructive hover:bg-destructive/90">
                            Delete Route
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <AccordionContent className="space-y-4">
                   <APIProvider apiKey={API_KEY}>
                      <StopForm route={route} onFormSubmit={() => refreshRouteData(route.id)} />
                   </APIProvider>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}