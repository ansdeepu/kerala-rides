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

const pathanamthittaToKollamRoute: { name: string; location: { lat: number; lng: number } }[] = [
    { name: 'Pathanamthitta', location: { lat: 9.2647, lng: 76.7874 } },
    { name: 'Adoor', location: { lat: 9.1578, lng: 76.7355 } },
    { name: 'Kottarakkara', location: { lat: 9.0076, lng: 76.7725 } },
    { name: 'Chathannoor', location: { lat: 8.8584, lng: 76.7188 } },
    { name: 'Kollam', location: { lat: 8.8932, lng: 76.6141 } },
];

export const initialBuses: Bus[] = [
  {
    id: 'bus-01',
    number: 'KL-05-A-1234',
    routeName: 'Pathanamthitta - Kollam',
    currentLocation: { ...pathanamthittaToKollamRoute[0].location },
    status: 'On Time',
    eta: '5 min',
    stops: pathanamthittaToKollamRoute,
    nextStopIndex: 1,
    nextStopName: pathanamthittaToKollamRoute[1].name,
    direction: 'forward',
  },
];

// This function simulates the movement of buses along their route.
export function moveBuses(currentBuses: Bus[]): Bus[] {
    if (currentBuses.length === 0) {
        return initialBuses;
    }

  return currentBuses.map(bus => {
    const newBus = { ...bus };
    const fromStop = newBus.stops[newBus.direction === 'forward' ? newBus.nextStopIndex - 1 : newBus.nextStopIndex + 1];
    const toStop = newBus.stops[newBus.nextStopIndex];

    if (!fromStop || !toStop) {
        // Handle end of route
        if (newBus.direction === 'forward') {
            newBus.direction = 'backward';
            newBus.nextStopIndex = newBus.stops.length - 2;
        } else {
            newBus.direction = 'forward';
            newBus.nextStopIndex = 1;
        }
        newBus.currentLocation = newBus.stops[newBus.direction === 'forward' ? 0 : newBus.stops.length - 1].location;
        return newBus;
    }

    // Check if the bus has "arrived" at the next stop
    const lat_diff = Math.abs(newBus.currentLocation.lat - toStop.location.lat);
    const lng_diff = Math.abs(newBus.currentLocation.lng - toStop.location.lng);

    if (lat_diff < 0.005 && lng_diff < 0.005) {
        newBus.currentLocation = toStop.location; // Snap to stop

        if (newBus.direction === 'forward') {
            if (newBus.nextStopIndex === newBus.stops.length - 1) {
                // Reached the end (Kollam), turn back
                newBus.direction = 'backward';
                newBus.nextStopIndex--;
            } else {
                newBus.nextStopIndex++;
            }
        } else { // backward
            if (newBus.nextStopIndex === 0) {
                // Reached the start (Pathanamthitta), turn back
                newBus.direction = 'forward';
                newBus.nextStopIndex++;
            } else {
                newBus.nextStopIndex--;
            }
        }
        newBus.nextStopName = newBus.stops[newBus.nextStopIndex].name;
    } else {
        // Move bus towards the next stop
        const moveFraction = 0.2; // Move 20% of the way each interval
        newBus.currentLocation.lat += (toStop.location.lat - fromStop.location.lat) * moveFraction;
        newBus.currentLocation.lng += (toStop.location.lng - fromStop.location.lng) * moveFraction;
    }
    
    // Update ETA and Status (simple simulation)
    const distance = Math.sqrt(Math.pow(toStop.location.lat - newBus.currentLocation.lat, 2) + Math.pow(toStop.location.lng - newBus.currentLocation.lng, 2));
    const etaMinutes = Math.round(distance * 100); // Arbitrary calculation
    newBus.eta = `${etaMinutes} min`;

    const randomStatus = Math.random();
    if (randomStatus < 0.1) newBus.status = 'Delayed';
    else if (randomStatus > 0.9) newBus.status = 'Early';
    else newBus.status = 'On Time';

    return newBus;
  });
}
