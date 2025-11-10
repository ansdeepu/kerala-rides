'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { addDoc, collection } from 'firebase/firestore';

import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const routeFormSchema = z.object({
  name: z
    .string()
    .min(5, { message: 'Route name must be at least 5 characters long.' })
    .describe("The name of the route (e.g., 'Pathanamthitta - Kollam')."),
});

type RouteFormValues = z.infer<typeof routeFormSchema>;

export default function AdminPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const db = useFirestore();

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (!loading && user?.email !== 'ss.deepu@gmail.com') {
      toast({
        variant: 'destructive',
        title: 'Unauthorized',
        description: 'You do not have permission to access this page.',
      });
      router.push('/');
    }
  }, [user, loading, router]);

  const onSubmit = async (data: RouteFormValues) => {
    if (!db) return;

    try {
      const routesCollection = collection(db, 'routes');
      await addDoc(routesCollection, {
        name: data.name,
        stops: [], // Will add stops in a later step
      });
      toast({
        title: 'Route Created',
        description: `The route "${data.name}" has been added successfully.`,
      });
      form.reset();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error Creating Route',
        description: error.message,
      });
    }
  };

  if (loading || user?.email !== 'ss.deepu@gmail.com') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
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
            Back to Map
          </Link>
        </Button>
      </header>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Create New Bus Route</CardTitle>
            <CardDescription>
              Define a new route. You can add stops in the next step.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Route Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Kottayam - Alappuzha"
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
      </div>
    </div>
  );
}
