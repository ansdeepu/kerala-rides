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
import { Trash } from 'lucide-react';

interface Route {
  id: string;
  name: string;
  stops: { name: string; arrivalTime: string; location: { lat: number; lng: number } }[];
}

const stopSchema = z.object({
  name: z.string().min(3, 'Stop name is required.'),
  arrivalTime: z.string().min(1, 'Arrival time is required.'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

type StopFormValues = z.infer<typeof stopSchema>;

export function RouteManager() {
  const { data: routes, loading } = useCollection<Route>('routes');
  const db = useFirestore();

  const form = useForm<StopFormValues>({
    resolver: zodResolver(stopSchema),
    defaultValues: {
      name: '',
      arrivalTime: '',
      lat: 0,
      lng: 0,
    }
  });

  const handleAddStop = async (routeId: string, values: StopFormValues) => {
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
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error adding stop',
        description: error.message,
      });
    }
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (!db || !confirm('Are you sure you want to delete this route?')) return;
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
          Add or remove stops from existing routes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading routes...</p>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {routes?.map((route) => (
              <AccordionItem key={route.id} value={route.id}>
                <div className="flex items-center justify-between w-full">
                  <AccordionTrigger className="flex-grow">
                    <span>{route.name}</span>
                  </AccordionTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation(); // prevent accordion from toggling
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
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {route.stops.map((stop) => (
                          <li key={stop.name}>
                            {stop.name} (Arrives: {stop.arrivalTime}) - Lat: {stop.location.lat}, Lng: {stop.location.lng}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No stops added yet.
                      </p>
                    )}
                  </div>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit((values) => handleAddStop(route.id, values))}
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
                                <Input placeholder="e.g., 8:15 AM" {...field} />
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
                                  <Input type="number" placeholder="e.g., 9.1578" {...field} />
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
                                  <Input type="number" placeholder="e.g., 76.7355" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      <Button type="submit">Add Stop</Button>
                    </form>
                  </Form>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
