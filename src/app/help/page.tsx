import Link from "next/link";
import { ArrowLeft, Bus, Smartphone, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold font-headline text-primary">
            How Kerala Rides Works
          </h1>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="mr-2" />
              Back to Map
            </Link>
          </Button>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Bus className="text-primary" />
                Is this real bus data?
              </CardTitle>
              <CardDescription>
                Understanding the source of the bus locations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                The bus locations you see on the map are part of a **simulation**. This application does not use live GPS data from actual KSRTC buses. The data is generated in the project code to demonstrate how a real-time tracking app would look and feel.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                In a real-world scenario, this app would connect to a database that receives live GPS coordinates from tracking devices installed on each bus.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Smartphone className="text-accent" />
                Does it use my phone's GPS?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                No, this application **does not** access your phone's GPS location. Your location is not tracked or used for any feature. The map is centered on a default location, and when you select a bus, it simply focuses on that bus's simulated location.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Database className="text-secondary-foreground" />
                How can I enter data?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Users with an **admin** role can add and manage bus routes and stops. The bus data is stored in the project's Firestore database.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                If you are an admin, you can access the <Link href="/admin" className="underline">Admin Panel</Link> to create new routes and add stops with their coordinates. Bus locations themselves are still part of a simulation based on these routes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
