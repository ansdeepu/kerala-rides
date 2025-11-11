'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { addDoc, collection } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
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
import { toast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { RouteManager } from '@/components/route-manager';

const routeFormSchema = z.object({
  name: z
    .string()
    .min(5, { message: 'Route name must be at least 5 characters long.' })
    .describe(
      "The name of the route, including time (e.g., 'Pathanamthitta - Kollam @ 8:00 AM')."
    ),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

export default function AdminPage() {
  const { user, loading } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const db = useFirestore();

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


  const onRouteSubmit = async (data: RouteFormValues) => {
    if (!db || !isAdmin) return;

    try {
      const routesCollection = collection(db, 'routes');
      await addDoc(routesCollection, {
        name: data.name,
        stops: [],
        status: 'Not Started',
        currentLocation: null,
        nextStopIndex: 0,
        direction: 'forward',
      });
      toast({
        title: 'Route Created',
        description: `The route "${data.name}" has been added successfully. It will now appear on the map.`,
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
              Define a new route. Once created, it will appear on the map. You can add stops in the manager below.
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
        
      </div>
    </div>
  );
}
