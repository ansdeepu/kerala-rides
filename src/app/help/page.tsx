import Link from "next/link";
import { Bus, Smartphone, Database } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HelpPage() {
  return (
    <main className="flex-1 p-4 h-screen overflow-y-auto">
      <div className="container mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-headline text-primary">
            How Kerala Rides Works
          </h1>
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
                This application uses two types of data to show bus locations:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>
                  <strong>Simulation Mode:</strong> By default, most bus locations are part of a simulation. The app calculates a bus's position based on the scheduled arrival times for its stops.
                </li>
                <li>
                  <strong>Live GPS Mode:</strong> When a user selects a route and presses the "Start Driving" button, that specific bus's location becomes real-time data, broadcast from that user's phone GPS.
                </li>
              </ul>
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
                The app only accesses your phone's GPS if you explicitly choose to. By default, your location is not tracked.
              </p>
               <p className="mt-2">
                If you go to a route's detail page and click the <strong>"Start Driving"</strong> button, the app will request permission to use your GPS. If you grant it, your location will be broadcast as that bus's live position until you press "Stop Driving". No other users can see your personal information, only the bus's location on the map.
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
                If you are an admin, you can access the <Link href="/admin" className="underline">Admin Panel</Link> to create new routes and add stops with their coordinates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
