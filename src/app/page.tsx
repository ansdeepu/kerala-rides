"use client";

import * as React from "react";
import { SidebarProvider, Sidebar, SidebarInset } from "@/components/ui/sidebar";
import MapView from "@/components/map-view";
import { BusPanel } from "@/components/bus-panel";
import type { Bus } from "@/lib/bus-data";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [buses, setBuses] = React.useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = React.useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);

  const selectedBus = React.useMemo(() => buses.find(b => b.id === selectedBusId) || null, [buses, selectedBusId]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  if (loading || !user) {
    return <div>Loading...</div>;
  }

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
