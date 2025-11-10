"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import MapView from "@/components/map-view";
import { BusPanel } from "@/components/bus-panel";
import type { Bus } from "@/lib/data";
import { initialBuses, moveBuses } from "@/lib/data";

export default function Home() {
  const [buses, setBuses] = React.useState<Bus[]>(initialBuses);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  const selectedBus = React.useMemo(() => buses.find(b => b.id === selectedBusId) || null, [buses, selectedBusId]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setBuses(prevBuses => moveBuses(prevBuses));
    }, 5000); // Simulate bus movement every 5 seconds
    return () => clearInterval(interval);
  }, []);

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
