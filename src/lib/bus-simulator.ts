'use client';
import type { Bus, Route, Stop } from './types';

// Helper to convert "hh:mm AM/PM" to a Date object for today
function timeToDate(timeStr: string): Date | null {
  if (!timeStr || !timeStr.includes(' ')) {
    return null; // Return null if the time string is invalid
  }
  const now = new Date();
  const [time, modifier] = timeStr.split(' ');
  if (!time || !modifier) {
      return null;
  }
  let [hours, minutes] = time.split(':').map(Number);

  if (modifier.toUpperCase() === 'PM' && hours < 12) {
    hours += 12;
  }
  if (modifier.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  now.setHours(hours, minutes, 0, 0);
  return now;
}

// This function simulates the movement of buses along their routes.
// It will not move buses that are being actively "driven" by a user.
export function simulateBusMovement(currentBuses: Bus[], routes: Route[], drivingBusId: string | null): Bus[] {
  if (currentBuses.length === 0 || routes.length === 0) {
    return currentBuses;
  }

  const now = new Date();

  return currentBuses.map(bus => {
    const route = routes.find(r => r.id === bus.routeId);
    const enrichedBus = { ...bus, routeName: route?.name || 'Unknown Route', stops: route?.stops || [] };

    // If a user is actively driving this bus, just enrich it with route data and return.
    // The live location is being updated directly in Firestore and will be reflected via the useCollection hook.
    if (bus.id === drivingBusId) {
        const nextStop = route?.stops[bus.nextStopIndex];
         return {
            ...enrichedBus,
            nextStopName: nextStop?.name || 'N/A',
            eta: nextStop ? '1 min' : 'N/A', // A simple placeholder ETA for live driving
            status: 'On Time'
        };
    }
    
    if (!route || route.stops.length < 2) {
      return {
        ...enrichedBus,
        status: 'On Time',
        eta: 'N/A',
        currentLocation: route?.stops[0]?.location || { lat: 0, lng: 0 },
        nextStopIndex: 1,
        nextStopName: 'N/A',
      };
    }
    
    const { stops } = route;
    
    // Filter out stops with invalid times before processing
    const validStopTimes = stops
        .map(stop => ({ stop, time: timeToDate(stop.arrivalTime) }))
        .filter(item => item.time !== null) as { stop: Stop, time: Date }[];

    if (validStopTimes.length < 2) {
        // Not enough valid stops to create a route segment
        enrichedBus.currentLocation = stops[0]?.location || { lat: 0, lng: 0 };
        enrichedBus.nextStopIndex = 1;
        enrichedBus.eta = "Schedule data incomplete";
        enrichedBus.status = 'Not Started';
        enrichedBus.nextStopName = stops[0]?.name || 'N/A';
        return enrichedBus;
    }

    const firstStopTime = validStopTimes[0].time;
    const lastStopTime = validStopTimes[validStopTimes.length - 1].time;

    let segmentFound = false;

    if (now < firstStopTime) {
        // Before the route starts, park at the first stop
        enrichedBus.currentLocation = validStopTimes[0].stop.location;
        enrichedBus.nextStopIndex = 0; // It's at the first stop
        enrichedBus.status = "Not Started";
        enrichedBus.eta = "Route has not started";
        enrichedBus.nextStopName = 'N/A';
    } else if (now > lastStopTime) {
        // After the route ends, park at the last stop
        enrichedBus.currentLocation = validStopTimes[validStopTimes.length - 1].stop.location;
        enrichedBus.nextStopIndex = stops.length; // No next stop
        enrichedBus.status = "Finished";
        enrichedBus.eta = "Route has finished";
        enrichedBus.nextStopName = 'End of Route';
    } else {
        // Find the current segment of the route
        for (let i = 0; i < validStopTimes.length - 1; i++) {
            const fromTime = validStopTimes[i].time;
            const toTime = validStopTimes[i+1].time;

            if (now >= fromTime && now <= toTime) {
                const fromStop = validStopTimes[i].stop;
                const toStop = validStopTimes[i+1].stop;
                
                const timeInSegment = toTime.getTime() - fromTime.getTime();
                const timeElapsed = now.getTime() - fromTime.getTime();
                const progress = timeInSegment > 0 ? timeElapsed / timeInSegment : 0;

                enrichedBus.currentLocation = {
                    lat: fromStop.location.lat + (toStop.location.lat - fromStop.location.lat) * progress,
                    lng: fromStop.location.lng + (toStop.location.lng - fromStop.location.lng) * progress,
                };
                
                // Find the original index from the main stops array
                const originalStopIndex = stops.findIndex(s => s.name === toStop.name && s.arrivalTime === toStop.arrivalTime);
                enrichedBus.nextStopIndex = originalStopIndex !== -1 ? originalStopIndex : i + 1;
                
                const etaMillis = toTime.getTime() - now.getTime();
                const etaMinutes = Math.round(etaMillis / 60000);
                enrichedBus.eta = `${Math.max(0, etaMinutes)} min`;

                segmentFound = true;
                break;
            }
        }
        if (!segmentFound) {
           // If in a layover period, park at the last departed stop
           let lastDepartedIndex = validStopTimes.findIndex(item => item.time > now) - 1;
           if (lastDepartedIndex < 0) lastDepartedIndex = validStopTimes.length - 1;

           const lastDepartedStop = validStopTimes[lastDepartedIndex].stop;
           enrichedBus.currentLocation = lastDepartedStop.location;

           const originalStopIndex = stops.findIndex(s => s.name === lastDepartedStop.name && s.arrivalTime === lastDepartedStop.arrivalTime);
           enrichedBus.nextStopIndex = (originalStopIndex !== -1 ? originalStopIndex : lastDepartedIndex) + 1;
           enrichedBus.eta = "At Stop";
        }
        
        enrichedBus.nextStopName = stops[enrichedBus.nextStopIndex]?.name || 'End of Route';
        const randomStatus = Math.random();
        if (randomStatus < 0.1) enrichedBus.status = 'Delayed';
        else if (randomStatus > 0.9) enrichedBus.status = 'Early';
        else enrichedBus.status = 'On Time';
    }
    
    return enrichedBus;
  });
}
