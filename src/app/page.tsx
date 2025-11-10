"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import MapView from "@/components/map-view";
import { BusPanel } from "@/components/bus-panel";

// The 'Bus' type is now defined here temporarily until we set up a proper data source.
export interface Bus {
  id: string;
  number: string;
  routeName: string;
  currentLocation: { lat: number; lng: number };
  status: "On Time" | "Delayed" | "Early";
  eta: string; // e.g., "5min"
  stops: { name: string; location: { lat: number; lng: number } }[];
  nextStopIndex: number;
  nextStopName: string;
}


export default function Home() {
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  const selectedBus = React.useMemo(() => buses.find(b => b.id === selectedBusId) || null, [buses, selectedBusId]);

  // Bus movement simulation is paused as there is no data.
  // React.useEffect(() => {
  //   const interval = setInterval(() => {
  //     // setBuses(prevBuses => moveBuses(prevBuses));
  //   }, 5000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <SidebarProvider open={isSidebarOpen} onOpenChange={setSidebarOpen}>
      <Sidebar>
        <BusPanel
          buses={buses}
          selectedBus={selectedBus}
          onBusSelect={setSelectedBusId}
          onSidebarToggle={() => setSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </Sidebar>
      <SidebarInset>
        <MapView buses={buses} selectedBus={selectedBus} onBusSelect={setSelectedBusId} />
      </SidebarInset>
    </SidebarProvider>
  );
}
