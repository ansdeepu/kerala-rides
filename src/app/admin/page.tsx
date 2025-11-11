'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';

import { useFirestore, useUser, useCollection } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Trash } from 'lucide-react';
import { RouteManager } from '@/components/route-manager';
import type { Route, Bus } from '@/lib/types';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const routeFormSchema = z.object({
  name: z
    .string()
    .min(5, { message: 'Route name must be at least 5 characters long.' })
    .describe(
      "The name of the route, including time (e.g., 'Pathanamthitta - Kollam @ 8:00 AM')."
    ),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

const busFormSchema = z.object({
  number: z
    .string()
    .min(5, { message: 'Bus number must be at least 5 characters.' })
    .regex(/^[A-Z]{2}[- ]?\d{1,2}[- ]?[A-Z]{1,2}[- ]?\d{4}$/i, "Please use a valid format like KL 01 A 1234"),
  routeId: z.string().min(1, { message: 'Please select a route.' }),
});

type BusFormValues = z.infer<typeof busFormSchema>;

export default function AdminPage() {
  const { user, loading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const db = useFirestore();

  const { data: routes, loading: routesLoading } = useCollection<Route>('routes');
  const { data: buses, loading: busesLoading } = useCollection<Bus>('buses');

  useEffect(() => {
    if (!loading) {
      if (user && user.email === 'ss.deepu@gmail.com') {
        setIsAdmin(true);
      } else {
        toast({
          variant: 'destructive',
          title: 'Unauthorized',
          description: 'You do not have permission to access this page.',
        });
        router.push('/');
      }
    }
  }, [user, loading, router]);


  const routeForm = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const busForm = useForm<BusFormValues>({
    resolver: zodResolver(busFormSchema),
    defaultValues: {
      number: '',
      routeId: '',
    },
  });

  const onRouteSubmit = async (data: RouteFormValues) => {
    if (!db || !isAdmin) return;

    try {
      const routesCollection = collection(db, 'routes');
      await addDoc(routesCollection, {
        name: data.name,
        stops: [],
      });
      toast({
        title: 'Route Created',
        description: `The route "${data.name}" has been added successfully.`,
      });
      routeForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Route',
        description: error.message,
      });
    }
  };
  
  const onBusSubmit = async (data: BusFormValues) => {
    if (!db || !isAdmin) return;

    try {
      const busesCollection = collection(db, 'buses');
      const selectedRoute = routes?.find(r => r.id === data.routeId);
      
      await addDoc(busesCollection, {
        number: data.number.toUpperCase().replace(/[-\s]/g, ''),
        routeId: data.routeId,
        currentLocation: selectedRoute?.stops?.[0]?.location || { lat: 9.26, lng: 76.78 }, // Default to first stop or a fallback
        status: 'Not Started',
        updatedAt: serverTimestamp(),
        direction: 'forward',
        nextStopIndex: 0,
      });
      toast({
        title: 'Bus Added',
        description: `Bus ${data.number} has been assigned to a route.`,
      });
      busForm.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Adding Bus',
        description: error.message,
      });
    }
  };

  const handleDeleteBus = async (busId: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'buses', busId));
      toast({ description: 'Bus has been successfully removed.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error removing bus', description: error.message });
    }
  };


  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline text-primary">
          Admin Panel
        </h1>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2" />
            Back to Home
          </Link>
        </Button>
      </header>

      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Bus Route</CardTitle>
            <CardDescription>
              Define a new route. You can add stops in the manager below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...routeForm}>
              <form
                onSubmit={routeForm.handleSubmit(onRouteSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={routeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Kottayam - Alappuzha @ 8:00 AM"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create Route</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        <RouteManager />
        
        <Card>
          <CardHeader>
            <CardTitle>Bus Manager</CardTitle>
            <CardDescription>Assign buses to routes. The simulation will automatically start.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...busForm}>
              <form onSubmit={busForm.handleSubmit(onBusSubmit)} className="space-y-6 mb-8 p-4 border rounded-lg">
                <div className='grid md:grid-cols-2 gap-4'>
                <FormField
                  control={busForm.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bus Registration No.</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., KL 05 AZ 1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={busForm.control}
                  name="routeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign to Route</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a route for the bus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {routesLoading ? (
                            <SelectItem value="loading" disabled>Loading routes...</SelectItem>
                          ) : (
                            routes?.map(route => (
                              <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
                <Button type="submit" disabled={busesLoading}>Add Bus</Button>
              </form>
            </Form>

            <h4 className="font-semibold mb-2">Active Buses:</h4>
            <div className="space-y-2">
              {busesLoading ? <p>Loading buses...</p> : (
                buses && buses.length > 0 ? (
                  buses.map(bus => {
                    const route = routes?.find(r => r.id === bus.routeId);
                    return (
                    <div key={bus.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div>
                        <p className="font-semibold">{bus.number}</p>
                        <p className="text-sm text-muted-foreground">{route?.name || 'Unknown Route'}</p>
                      </div>
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
                                This will permanently remove bus {bus.number} from the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteBus(bus.id)} className="bg-destructive hover:bg-destructive/90">
                                Delete Bus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </div>
                  )})
                ) : (
                  <p className="text-sm text-muted-foreground">No buses have been added yet.</p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
