// This file contains the logic for a bus traveling from Pathanamthitta to Kollam and back.

export interface Bus {
  id: string;
  number: string;
  routeName: string;
  currentLocation: { lat: number; lng: number };
  status: "On Time" | "Delayed" | "Early";
  eta: string;
  stops: { name: string; location: { lat: number; lng: number } }[];
  nextStopIndex: number;
  nextStopName: string;
  direction: 'forward' | 'backward'; // To track the round trip
}

// Define the stops for the route
const ptaToKollamStops = [
    { name: "Pathanamthitta", location: { lat: 9.2647, lng: 76.7874 } },
    { name: "Adoor", location: { lat: 9.1593, lng: 76.7329 } },
    { name: "Kottarakkara", location: { lat: 9.0069, lng: 76.7616 } },
    { name: "Kollam", location: { lat: 8.8932, lng: 76.6141 } },
];

// Initial state for our single bus
export const initialBuses: Bus[] = [
  {
    id: "pta-klm-01",
    number: "KL-05-AB-1234",
    routeName: "Pathanamthitta - Kollam",
    stops: ptaToKollamStops,
    currentLocation: ptaToKollamStops[0].location,
    status: "On Time",
    eta: "10min",
    nextStopIndex: 1,
    nextStopName: ptaToKollamStops[1].name,
    direction: 'forward',
  },
];

// Simple interpolation function to move between two points
function interpolate(start: { lat: number, lng: number }, end: { lat: number, lng: number }, factor: number) {
    return {
        lat: start.lat + (end.lat - start.lat) * factor,
        lng: start.lng + (end.lng - start.lng) * factor,
    };
}

// The core logic to move the bus
export function moveBuses(buses: Bus[]): Bus[] {
    return buses.map(bus => {
        const newBus = { ...bus };

        let fromStopIndex: number;
        let toStopIndex: number;
        
        // Determine the direction and stops
        if (newBus.direction === 'forward') {
            fromStopIndex = newBus.nextStopIndex - 1;
            toStopIndex = newBus.nextStopIndex;
        } else { // backward
            fromStopIndex = newBus.nextStopIndex + 1;
            toStopIndex = newBus.nextStopIndex;
        }
        
        const fromStop = newBus.stops[fromStopIndex];
        const toStop = newBus.stops[toStopIndex];

        // This is a simplified movement. In a real app, you'd use the time elapsed.
        // Let's assume the bus moves a fixed fraction of the distance between stops each interval.
        // We can get the total distance and figure out a step, but for now, let's just move it a little.
        const currentDistanceLat = toStop.location.lat - fromStop.location.lat;
        const currentDistanceLng = toStop.location.lng - fromStop.location.lng;
        
        // Move a fraction of the way. Let's say 20% of the segment per update.
        const step = 0.2;
        
        newBus.currentLocation = {
            lat: newBus.currentLocation.lat + currentDistanceLat * step,
            lng: newBus.currentLocation.lng + currentDistanceLng * step
        };


        // Check if bus is close to the next stop
        const lat_diff = Math.abs(newBus.currentLocation.lat - toStop.location.lat);
        const lng_diff = Math.abs(newBus.currentLocation.lng - toStop.location.lng);
        
        // Let's use a small threshold to decide if we've "arrived"
        const arrivalThreshold = 0.005;

        if (lat_diff < arrivalThreshold && lng_diff < arrivalThreshold) {
            newBus.currentLocation = toStop.location; // Snap to stop

            if (newBus.direction === 'forward') {
                if (newBus.nextStopIndex === newBus.stops.length - 1) {
                    // Reached Kollam, turn back
                    newBus.direction = 'backward';
                    newBus.nextStopIndex--;
                } else {
                    newBus.nextStopIndex++;
                }
            } else { // backward
                 if (newBus.nextStopIndex === 0) {
                    // Reached Pathanamthitta, turn back
                    newBus.direction = 'forward';
                    newBus.nextStopIndex++;
                } else {
                    newBus.nextStopIndex--;
                }
            }
        }
        
        newBus.nextStopName = newBus.stops[newBus.nextStopIndex].name;
        
        // Reset bus location if it overshoots for some reason (simple recovery)
        if (newBus.direction === 'forward' && newBus.nextStopIndex === 1 && newBus.currentLocation.lat < ptaToKollamStops[0].location.lat) {
            newBus.currentLocation = ptaToKollamStops[0].location;
        }
        if (newBus.direction === 'backward' && newBus.nextStopIndex === ptaToKollamStops.length - 2 && newBus.currentLocation.lat > ptaToKollamStops[ptaToKollamStops.length -1].location.lat) {
             newBus.currentLocation = ptaToKollamStops[ptaToKollamStops.length - 1].location;
        }

        
        return newBus;
    });
}
