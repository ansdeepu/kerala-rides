'use client';
import type { Bus, Route, Stop } from './types';

// Helper to convert "hh:mm AM/PM" to a Date object for today
function timeToDate(timeStr: string): Date | null {
  if (!timeStr || !timeStr.includes(' ')) {
    return null; // Return null if the time string is invalid
  }
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
    const route = routes.find(r => r.id === bus.routeId);

    // If a user is actively driving this bus, or if it has been recently updated,
    // don't simulate its movement but still enrich it with route data.
    const lastUpdated = bus.updatedAt?.toDate ? bus.updatedAt.toDate() : new Date(0);
    const secondsSinceUpdate = (now.getTime() - lastUpdated.getTime()) / 1000;
    
    if (bus.id === drivingBusId || secondsSinceUpdate < 15) {
      const nextStop = route?.stops[bus.nextStopIndex];
      return {
        ...bus,
        routeName: route ? route.name : 'Unknown Route',
        stops: route ? route.stops : [],
        nextStopName: nextStop?.name || 'N/A',
        eta: nextStop ? '1 min' : 'N/A',
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
    
    // Filter out stops with invalid times before processing
    const validStopTimes = stops
        .map(stop => ({ stop, time: timeToDate(stop.arrivalTime) }))
        .filter(item => item.time !== null) as { stop: Stop, time: Date }[];

    if (validStopTimes.length < 2) {
        // Not enough valid stops to create a route segment
        newBus.currentLocation = stops[0]?.location || { lat: 0, lng: 0 };
        newBus.nextStopIndex = 1;
        newBus.eta = "Schedule data incomplete";
        return newBus;
    }

    const firstStopTime = validStopTimes[0].time;
    const lastStopTime = validStopTimes[validStopTimes.length - 1].time;

    let fromStop: Stop;
    let toStop: Stop;
    let fromTime: Date;
    let toTime: Date;
    let randomStatusApplied = false;

    if (now < firstStopTime) {
        // Before the route starts, park at the first stop
        newBus.currentLocation = validStopTimes[0].stop.location;
        newBus.nextStopIndex = 0; // It's at the first stop
        newBus.status = "Not Started";
        newBus.eta = "Route has not started";
        newBus.nextStopName = 'N/A';
    } else if (now > lastStopTime) {
        // After the route ends, park at the last stop
        newBus.currentLocation = validStopTimes[validStopTimes.length - 1].stop.location;
        newBus.nextStopIndex = stops.length; // No next stop
        newBus.status = "Finished";
        newBus.eta = "Route has finished";
        newBus.nextStopName = 'End of Route';
    } else {
        // Find the current segment of the route
        let segmentFound = false;
        for (let i = 0; i < validStopTimes.length - 1; i++) {
            if (now >= validStopTimes[i].time && now <= validStopTimes[i+1].time) {
                fromStop = validStopTimes[i].stop;
                toStop = validStopTimes[i+1].stop;
                fromTime = validStopTimes[i].time;
                toTime = validStopTimes[i+1].time;
                
                const timeInSegment = toTime.getTime() - fromTime.getTime();
                const timeElapsed = now.getTime() - fromTime.getTime();
                const progress = timeInSegment > 0 ? timeElapsed / timeInSegment : 0;

                newBus.currentLocation = {
                    lat: fromStop.location.lat + (toStop.location.lat - fromStop.location.lat) * progress,
                    lng: fromStop.location.lng + (toStop.location.lng - fromStop.location.lng) * progress,
                };
                
                // Find the original index from the main stops array
                const originalStopIndex = stops.findIndex(s => s.name === toStop.name && s.arrivalTime === toStop.arrivalTime);
                newBus.nextStopIndex = originalStopIndex !== -1 ? originalStopIndex : i + 1;
                
                const etaMillis = toTime.getTime() - now.getTime();
                const etaMinutes = Math.round(etaMillis / 60000);
                newBus.eta = `${Math.max(0, etaMinutes)} min`;

                segmentFound = true;
                break;
            }
        }
        if (!segmentFound) {
           // If in a layover period, park at the last departed stop
           let lastDepartedIndex = validStopTimes.findIndex(item => item.time > now) - 1;
           if (lastDepartedIndex < 0) lastDepartedIndex = validStopTimes.length - 1;

           const lastDepartedStop = validStopTimes[lastDepartedIndex].stop;
           newBus.currentLocation = lastDepartedStop.location;

           const originalStopIndex = stops.findIndex(s => s.name === lastDepartedStop.name && s.arrivalTime === lastDepartedStop.arrivalTime);
           newBus.nextStopIndex = (originalStopIndex !== -1 ? originalStopIndex : lastDepartedIndex) + 1;
           newBus.eta = "At Stop";
        }
        
        newBus.nextStopName = stops[newBus.nextStopIndex]?.name || 'End of Route';
        const randomStatus = Math.random();
        if (randomStatus < 0.1) newBus.status = 'Delayed';
        else if (randomStatus > 0.9) newBus.status = 'Early';
        else newBus.status = 'On Time';
        randomStatusApplied = true;
    }

    if (!newBus.nextStopName) {
      newBus.nextStopName = stops[newBus.nextStopIndex]?.name || 'End of Route';
    }

    // Only apply random status if bus is running
    if (!randomStatusApplied && newBus.status !== 'Not Started' && newBus.status !== 'Finished') {
      const randomStatus = Math.random();
      if (randomStatus < 0.1) newBus.status = 'Delayed';
      else if (randomStatus > 0.9) newBus.status = 'Early';
      else newBus.status = 'On Time';
    }
    
    return newBus;
  });
}
