import type { Bus, Route, Stop } from './types';

// Helper to convert "hh:mm AM/PM" to a Date object for today
function timeToDate(timeStr: string): Date {
  const now = new Date();
  const [time, modifier] = timeStr.split(' ');
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
    // If a user is actively driving this bus, don't simulate its movement.
    // Also, if the bus has been updated in the last 15 seconds, assume it's live data.
    const lastUpdated = bus.updatedAt?.toDate ? bus.updatedAt.toDate() : new Date(0);
    const secondsSinceUpdate = (now.getTime() - lastUpdated.getTime()) / 1000;
    
    const route = routes.find(r => r.id === bus.routeId);

    if (bus.id === drivingBusId || secondsSinceUpdate < 15) {
      const nextStop = route?.stops[bus.nextStopIndex];
      return {
        ...bus,
        routeName: route ? route.name : 'Unknown Route',
        stops: route ? route.stops : [],
        nextStopName: nextStop?.name || 'N/A',
        eta: nextStop ? '1 min' : 'N/A', // ETA for live buses is complex, so we'll keep it simple
      };
    }
    
    if (!route || route.stops.length < 2) {
      return {
        ...bus,
        routeName: route ? route.name : 'Unknown Route',
        stops: route ? route.stops : [],
        status: 'On Time',
        eta: 'N/A',
        currentLocation: route?.stops[0]?.location || { lat: 0, lng: 0 },
        nextStopIndex: 1,
        nextStopName: 'N/A',
      };
    }
    
    const newBus = { ...bus, routeName: route.name, stops: route.stops };
    const { stops } = route;
    
    const stopTimes = stops.map(stop => timeToDate(stop.arrivalTime));
    const firstStopTime = stopTimes[0];
    const lastStopTime = stopTimes[stopTimes.length - 1];

    let fromStop: Stop;
    let toStop: Stop;
    let fromTime: Date;
    let toTime: Date;

    if (now < firstStopTime) {
        // Before the route starts, park at the first stop
        newBus.currentLocation = stops[0].location;
        newBus.nextStopIndex = 1;
        newBus.status = "On Time";
        newBus.eta = "Route has not started";
    } else if (now > lastStopTime) {
        // After the route ends, park at the last stop
        newBus.currentLocation = stops[stops.length - 1].location;
        newBus.nextStopIndex = stops.length; // No next stop
        newBus.status = "On Time";
        newBus.eta = "Route has finished";
    } else {
        // Find the current segment of the route
        let segmentFound = false;
        for (let i = 0; i < stopTimes.length - 1; i++) {
            if (now >= stopTimes[i] && now <= stopTimes[i+1]) {
                fromStop = stops[i];
                toStop = stops[i+1];
                fromTime = stopTimes[i];
                toTime = stopTimes[i+1];
                
                const timeInSegment = toTime.getTime() - fromTime.getTime();
                const timeElapsed = now.getTime() - fromTime.getTime();
                const progress = timeInSegment > 0 ? timeElapsed / timeInSegment : 0;

                newBus.currentLocation = {
                    lat: fromStop.location.lat + (toStop.location.lat - fromStop.location.lat) * progress,
                    lng: fromStop.location.lng + (toStop.location.lng - fromStop.location.lng) * progress,
                };

                newBus.nextStopIndex = i + 1;
                
                const etaMillis = toTime.getTime() - now.getTime();
                const etaMinutes = Math.round(etaMillis / 60000);
                newBus.eta = `${Math.max(0, etaMinutes)} min`;

                segmentFound = true;
                break;
            }
        }
        if (!segmentFound) {
           // If in a layover period, park at the last departed stop
           let lastDepartedStopIndex = stopTimes.findIndex(st => st > now) - 1;
           if (lastDepartedStopIndex < 0) lastDepartedStopIndex = stops.length -1; // Park at end
           
           newBus.currentLocation = stops[lastDepartedStopIndex].location;
           newBus.nextStopIndex = lastDepartedStopIndex + 1;
           newBus.eta = "At Stop";
        }
    }

    newBus.nextStopName = stops[newBus.nextStopIndex]?.name || 'End of Route';
    
    const randomStatus = Math.random();
    if (randomStatus < 0.1) newBus.status = 'Delayed';
    else if (randomStatus > 0.9) newBus.status = 'Early';
    else newBus.status = 'On Time';

    return newBus;
  });
}