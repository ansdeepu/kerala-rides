"use client";

import * as React from "react";
import Link from 'next/link';
import {
  ArrowLeft,
  Bus as BusIcon,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Share2,
  Shield,
  Navigation,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import type { Bus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { KeralaRidesLogo } from "./icons";
import { NotificationDialog } from "./notification-dialog";
import { ShareSheet } from "./share-sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "./ui/tooltip";
import { useUser, useFirestore } from "@/firebase";
import { useLocation } from "@/hooks/use-location";
import { toast } from "@/hooks/use-toast";


interface BusPanelProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onBusSelect: (id: string | null) => void;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

// Helper to convert "hh:mm AM/PM" to a Date object for today
const parseTime = (name: string): Date | null => {
    const timeMatch = name.match(/@\s*(\d{1,2}:\d{2}\s*(?:AM|PM))/i);
    if (!timeMatch || !timeMatch[1]) return null;

    const timeStr = timeMatch[1];
    const now = new Date();
    const [time, modifier] = timeStr.split(' ');
    if (!time || !modifier) return null;

    let [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    if (modifier.toUpperCase() === 'PM' && hours < 12) {
        hours += 12;
    }
    if (modifier.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
};

export function BusPanel({
  buses,
  selectedBus,
  onBusSelect,
  onSidebarToggle,
  isSidebarOpen,
}: BusPanelProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isNotificationOpen, setNotificationOpen] = React.useState(false);
  const [isShareOpen, setShareOpen] = React.useState(false);
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const router = useRouter();
  const auth = getAuth();
  const db = useFirestore();
  const [drivingBusId, setDrivingBusId] = React.useState<string | null>(null);

  const { location, error, startTracking, stopTracking } = useLocation();

  const isDriving = selectedBus?.id === drivingBusId;

  React.useEffect(() => {
    if (drivingBusId && location && db) {
      const busRef = doc(db, 'routes', drivingBusId);
      updateDoc(busRef, {
        currentLocation: {
          lat: location.latitude,
          lng: location.longitude,
        },
        updatedAt: serverTimestamp(),
      });
    }
  }, [location, drivingBusId, db]);

  React.useEffect(() => {
    if(error) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: error,
      });
      stopTracking();
      setDrivingBusId(null);
    }
  }, [error, stopTracking]);


  const handleToggleDriving = () => {
    if (isDriving) {
      stopTracking();
      setDrivingBusId(null);
       toast({
        title: "Tracking Stopped",
        description: `You are no longer providing location for route ${selectedBus?.name}.`,
      });
    } else if (selectedBus) {
      startTracking();
      setDrivingBusId(selectedBus.id);
      toast({
        title: "Tracking Started!",
        description: `You are now providing the live location for route ${selectedBus.name}.`,
      });
    }
  };


  React.useEffect(() => {
    if (user && user.email === 'ss.deepu@gmail.com') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const filteredAndSortedBuses = React.useMemo(() => {
    const filtered = buses.filter((bus) =>
      bus.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const now = new Date().getTime();

    const upcoming: Bus[] = [];
    const pastOrActive: Bus[] = [];

    for (const bus of filtered) {
        const busTime = parseTime(bus.name);
        if (busTime && busTime.getTime() > now) {
            upcoming.push(bus);
        } else {
            pastOrActive.push(bus);
        }
    }
    
    // Sort upcoming buses by their time
    upcoming.sort((a, b) => {
        const timeA = parseTime(a.name);
        const timeB = parseTime(b.name);
        if (!timeA || !timeB) return 0;
        return timeA.getTime() - timeB.getTime();
    });

    // Sort past buses by their time
    pastOrActive.sort((a, b) => {
        const timeA = parseTime(a.name);
        const timeB = parseTime(b.name);
        if (!timeA || !timeB) return 0;
        return timeA.getTime() - timeB.getTime();
    });


    return [...upcoming, ...pastOrActive];
  }, [buses, searchQuery]);


  return (
    <TooltipProvider>
    <div className="flex flex-col h-full bg-card">
      <header className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <KeralaRidesLogo className="w-8 h-8 text-primary" />
          <h1 className="text-xl font-bold font-headline">Kerala Rides</h1>
        </div>
        <div className="flex items-center gap-1">
           <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Logout</p>
            </TooltipContent>
          </Tooltip>
          {isAdmin && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                  <Link href="/admin">
                    <Shield />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Admin Panel</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/help">
                  <HelpCircle />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Help</p>
            </TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" onClick={onSidebarToggle} className="md:hidden">
            {isSidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          </Button>
        </div>
      </header>

      {selectedBus ? (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isDriving) {
                  stopTracking();
                  setDrivingBusId(null);
                }
                onBusSelect(null)
              }}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 font-headline text-base">
                <BusIcon className="w-6 h-6 text-primary" />
                {selectedBus.name}
              </CardTitle>
              <CardDescription>Status: {selectedBus.status}</CardDescription>
            </CardHeader>
          </div>
          <ScrollArea className="flex-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Status
                </span>
                <span
                  className={cn(
                    "px-2 py-1 text-xs font-semibold rounded-full",
                    selectedBus.status === "On Time" &&
                      "bg-green-100 text-green-800",
                    selectedBus.status === "Delayed" &&
                      "bg-orange-100 text-orange-800",
                    selectedBus.status === "Early" && "bg-blue-100 text-blue-800",
                    (selectedBus.status === "Not Started" || selectedBus.status === "Finished") && "bg-gray-100 text-gray-800"
                  )}
                >
                  {selectedBus.status}
                </span>
              </div>
              <Separator />
              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                  Upcoming Stop
                </h4>
                <p className="font-bold">{selectedBus.nextStopName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">ETA: {selectedBus.eta || 'N/A'}</p>
              </div>
              <Separator />
              <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                      Live Tracking
                  </h4>
                  <p className="text-sm text-muted-foreground">
                      {isDriving ? "You are currently providing the location for this bus." : "Help other passengers by providing this bus's live location if you are on board."}
                  </p>
              </div>
            </CardContent>
          </ScrollArea>
          <div className="grid grid-cols-2 gap-2 p-4 mt-auto border-t">
            <Button
                onClick={handleToggleDriving}
                variant={isDriving ? 'destructive' : 'default'}
              >
                <Navigation className={cn("w-4 h-4 mr-2", isDriving && "animate-pulse")} />
                {isDriving ? "Stop Driving" : "Start Driving"}
            </Button>
            <Button variant="outline" onClick={() => {
                const url = `${window.location.origin}/?bus=${selectedBus.id}`;
                setShareOpen(true)
            }}>
              <Share2 className="w-4 h-4 mr-2" />
              Share Status
            </Button>
          </div>
          <NotificationDialog
            isOpen={isNotificationOpen}
            onOpenChange={setNotificationOpen}
            bus={selectedBus}
          />
          <ShareSheet
            isOpen={isShareOpen}
            onOpenChange={setShareOpen}
            bus={selectedBus}
          />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by route name"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
             {filteredAndSortedBuses.length > 0 ? (
              <div className="p-4 space-y-3">
                {filteredAndSortedBuses.map((bus) => (
                  <Card
                    key={bus.id}
                    className="transition-all cursor-pointer hover:shadow-md hover:border-primary"
                    onClick={() => onBusSelect(bus.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold font-headline">
                            {bus.name}
                          </CardTitle>
                          <CardDescription>
                            Status: {bus.status}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                           <span
                            className={cn(
                              "text-xs font-semibold px-2 py-1 rounded-full",
                              bus.status === "On Time" && "bg-green-100 text-green-800",
                              bus.status === "Delayed" && "bg-orange-100 text-orange-800",
                              bus.status === "Early" && "bg-blue-100 text-blue-800",
                              (bus.status === "Not Started" || bus.status === "Finished") && "bg-gray-100 text-gray-800"
                            )}
                          >
                            {bus.status}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                <BusIcon className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">No Routes Found</h3>
                <p className="text-sm">There are no active routes to display.</p>
                {isAdmin && (
                  <Button size="sm" asChild className="mt-4">
                    <Link href="/admin">Go to Admin Panel to add a route</Link>
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
