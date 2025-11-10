'use client';

import * as React from 'react';
import { useCollection } from '@/firebase';
import { doc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
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
import { Trash, Edit, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

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
  arrivalTime: z.string().regex(/^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i, "Please enter a valid 12-hour time (e.g., 02:30 PM)."),
  lat: z.coerce.number().min(-90, 'Lat must be > -90').max(90, 'Lat must be < 90'),
  lng: z.coerce.number().min(-180, 'Lng must be > -180').max(180, 'Lng must be < 180'),
});

type StopFormValues = z.infer<typeof stopSchema>;

// Function to convert 24h format from time picker to 12h AM/PM format
const formatTo12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12 + 1);
    return `${hour12.toString().padStart(2, '0')}:${minutes} ${suffix}`;
};

// Function to convert 12h AM/PM format to 24h format for time picker
const formatTo24Hour = (time12: string): string => {
    if (!time12) return '';
    const [time, modifier] = time12.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
        hours = '00';
    }
    if (modifier.toUpperCase() === 'PM') {
        hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes}`;
};


function StopForm({ route, onFormSubmit }: { route: Route; onFormSubmit: () => void }) {
  const db = useFirestore();
  const [editingStop, setEditingStop] = React.useState<Stop | null>(null);

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      name: '',
      arrivalTime: '',
      lat: 0,
      lng: 0,
    }
  });

  const { formState: { isSubmitting } } = form;
  
  const handleEditClick = (stop: Stop) => {
    setEditingStop(stop);
    form.reset({
      name: stop.name,
      arrivalTime: stop.arrivalTime,
      lat: stop.location.lat,
      lng: stop.location.lng,
    });
  };

  const cancelEdit = () => {
    setEditingStop(null);
    form.reset({ name: '', arrivalTime: '', lat: 0, lng: 0 });
  };

  const handleDeleteStop = async (stopToDelete: Stop) => {
    if (!db) return;
    const routeRef = doc(db, 'routes', route.id);
    try {
        const routeDoc = await getDoc(routeRef);
        if (routeDoc.exists()) {
            const existingStops = routeDoc.data().stops || [];
            const updatedStops = existingStops.filter((s: Stop) => 
                !(s.name === stopToDelete.name && s.arrivalTime === stopToDelete.arrivalTime && s.location.lat === stopToDelete.location.lat && s.location.lng === stopToDelete.location.lng)
            );
            await updateDoc(routeRef, { stops: updatedStops });
            toast({ title: 'Stop Deleted', description: `"${stopToDelete.name}" has been removed from the route.` });
            onFormSubmit();
        }
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
      const routeDoc = await getDoc(routeRef);
      if (!routeDoc.exists()) throw new Error("Route not found");
      const existingStops = routeDoc.data().stops || [];
      let updatedStops: Stop[];

      if (editingStop) {
        const originalStopTime = editingStop.arrivalTime;
        updatedStops = existingStops.map((s: Stop) =>
          s.name === editingStop.name && s.arrivalTime === originalStopTime ? newStopData : s
        );
        toast({ title: 'Stop Updated!', description: `"${values.name}" has been updated.` });
      } else {
        updatedStops = [...existingStops, newStopData];
        toast({ title: 'Stop Added!', description: `"${values.name}" has been added to the route.` });
      }
      
      // Sort stops by arrival time before updating
      updatedStops.sort((a, b) => {
        const timeA = formatTo24Hour(a.arrivalTime);
        const timeB = formatTo24Hour(b.arrivalTime);
        return timeA.localeCompare(timeB);
      });

      await updateDoc(routeRef, { stops: updatedStops });
      cancelEdit();
      onFormSubmit();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: `Error ${editingStop ? 'updating' : 'adding'} stop`,
        description: error.message,
      });
    }
  };
  
  return (
    <div className="space-y-4 p-4">
      <div>
        <h4 className="font-semibold mb-2">Existing Stops:</h4>
        {route.stops.length > 0 ? (
          <ul className="list-decimal pl-5 space-y-2 text-sm">
            {route.stops.map((stop, index) => (
              <li key={`${stop.name}-${index}`} className="flex justify-between items-center">
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
                  <FormLabel>Arrival Time (12h format)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      value={formatTo24Hour(field.value)}
                      onChange={(e) => field.onChange(formatTo12Hour(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )}
          />
          
          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="e.g., 9.2647" {...field} />
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
                    <Input type="number" step="any" placeholder="e.g., 76.7874" {...field} />
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
    if (!db) return;
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
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {routes?.map((route) => (
              <AccordionItem key={route.id} value={route.id}>
                <div className="flex items-center w-full">
                  <AccordionTrigger className="flex-1 hover:no-underline px-4 py-2 text-left">
                    <span>{route.name}</span>
                  </AccordionTrigger>
                   <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button
                          variant="ghost"
                          size="icon"
                          className="mr-2 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <AccordionContent>
                  <StopForm route={route} onFormSubmit={() => refreshRouteData(route.id)} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
