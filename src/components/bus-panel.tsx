"use client";

import * as React from "react";
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Bus as BusIcon,
  HelpCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Share2,
  Shield,
} from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import type { Bus } from "@/lib/bus-data";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useUserProfile } from "@/firebase/auth/use-user-profile";

interface BusPanelProps {
  buses: Bus[];
  selectedBus: Bus | null;
  onBusSelect: (id: string | null) => void;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

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
  const { userProfile } = useUserProfile();
  const router = useRouter();
  const auth = getAuth();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isAdmin = userProfile?.role === 'admin';

  const filteredBuses = buses.filter(
    (bus) =>
      (bus.number && bus.number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bus.routeName && bus.routeName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
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
        <div className="flex flex-col flex-1">
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBusSelect(null)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 font-headline">
                <BusIcon className="w-6 h-6 text-primary" />
                {selectedBus.routeName}
              </CardTitle>
              <CardDescription>Bus No: {selectedBus.number}</CardDescription>
            </CardHeader>
          </div>
          <CardContent className="p-4 space-y-4 flex-1">
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
                  selectedBus.status === "Early" && "bg-blue-100 text-blue-800"
                )}
              >
                {selectedBus.status}
              </span>
            </div>
            <Separator />
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                Upcoming Stops
              </h4>
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {selectedBus.stops?.map((stop, index) => (
                    <div key={stop.name} className="flex items-center">
                      <div className="flex flex-col items-center mr-4">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full border-2",
                            selectedBus.nextStopIndex > index
                              ? "bg-primary border-primary"
                              : "border-muted-foreground"
                          )}
                        />
                        {index < selectedBus.stops.length - 1 && (
                          <div className="w-px h-6 bg-border" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-sm",
                          selectedBus.nextStopIndex > index &&
                            "text-muted-foreground line-through",
                          selectedBus.nextStopIndex === index && "font-bold"
                        )}
                      >
                        {stop.name}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <div className="grid grid-cols-2 gap-2 p-4 mt-auto border-t">
            <Button onClick={() => setNotificationOpen(true)}>
              <Bell className="w-4 h-4 mr-2" />
              Notify Me
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
                placeholder="Search by route or bus number"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
             {filteredBuses.length > 0 ? (
              <div className="p-4 space-y-3">
                {filteredBuses.map((bus) => (
                  <Card
                    key={bus.id}
                    className="transition-all cursor-pointer hover:shadow-md hover:border-primary"
                    onClick={() => onBusSelect(bus.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base font-bold font-headline">
                            {bus.routeName}
                          </CardTitle>
                          <CardDescription>
                            Bus No: {bus.number}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              bus.status === "On Time" && "text-green-600",
                              bus.status === "Delayed" && "text-orange-500"
                            )}
                          >
                            {bus.status}
                          </span>
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs bg-secondary">
                              {bus.eta}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <BusIcon className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-semibold">No Buses Found</h3>
                <p className="text-sm">There is no active bus data to display.</p>
                {isAdmin && (
                  <p className="text-sm mt-2">Admins can add new buses and routes.</p>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}