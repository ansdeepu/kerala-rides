import type { Bus, Route } from './types';

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

    if (bus.id === drivingBusId || secondsSinceUpdate < 15) {
      const route = routes.find(r => r.id === bus.routeId);
       const nextStop = route?.stops[bus.nextStopIndex];
      return {
        ...bus,
        routeName: route ? route.name : 'Unknown Route',
        stops: route ? route.stops : [],
        nextStopName: nextStop?.name || 'N/A',
        eta: nextStop ? '1 min' : 'N/A',
      };
    }

    const route = routes.find(r => r.id === bus.routeId);
    if (!route || route.stops.length < 2) {
      // If no route or not enough stops, don't move the bus
      return {
        ...bus,
        routeName: route ? route.name : 'Unknown Route',
        stops: route ? route.stops : [],
        status: 'On Time',
        eta: 'N/A'
      };
    }

    const newBus = { ...bus, routeName: route.name, stops: route.stops };

    // If bus has just been created or reset, place it at the start
    if (newBus.nextStopIndex === undefined || newBus.nextStopIndex >= route.stops.length || newBus.nextStopIndex < 0) {
        newBus.nextStopIndex = 1;
        newBus.currentLocation = route.stops[0].location;
        newBus.direction = 'forward';
    }

    const fromStopIndex = newBus.direction === 'forward' ? newBus.nextStopIndex - 1 : newBus.nextStopIndex + 1;
    const toStop = route.stops[newBus.nextStopIndex];
    
    // Check if indices are valid
    if (!toStop || !route.stops[fromStopIndex]) {
       // Reset bus to start of the route
       return {
         ...newBus,
         nextStopIndex: 1,
         currentLocation: route.stops[0].location,
         direction: 'forward',
       };
    }
    const fromStop = route.stops[fromStopIndex];

    // Check if the bus has "arrived" at the next stop
    const lat_diff = Math.abs(newBus.currentLocation.lat - toStop.location.lat);
    const lng_diff = Math.abs(newBus.currentLocation.lng - toStop.location.lng);
    const arrivalThreshold = 0.005;

    if (lat_diff < arrivalThreshold && lng_diff < arrivalThreshold) {
      newBus.currentLocation = { ...toStop.location }; // Snap to stop

      if (newBus.direction === 'forward') {
        if (newBus.nextStopIndex === route.stops.length - 1) {
          // Reached the end, turn back
          newBus.direction = 'backward';
          newBus.nextStopIndex--;
        } else {
          newBus.nextStopIndex++;
        }
      } else { // backward
        if (newBus.nextStopIndex === 0) {
          // Reached the start, turn back
          newBus.direction = 'forward';
          newBus.nextStopIndex++;
        } else {
          newBus.nextStopIndex--;
        }
      }
    } else {
      // Move bus towards the next stop
      const moveFraction = 0.2; // Move 20% of the way each interval
      newBus.currentLocation.lat += (toStop.location.lat - fromStop.location.lat) * moveFraction;
      newBus.currentLocation.lng += (toStop.location.lng - fromStop.location.lng) * moveFraction;
    }
    
    newBus.nextStopName = route.stops[newBus.nextStopIndex]?.name;

    // Update ETA and Status (simple simulation)
    const nextStopLocation = route.stops[newBus.nextStopIndex]?.location;
    if (nextStopLocation) {
        const distance = Math.sqrt(Math.pow(nextStopLocation.lat - newBus.currentLocation.lat, 2) + Math.pow(nextStopLocation.lng - newBus.currentLocation.lng, 2));
        const etaMinutes = Math.max(1, Math.round(distance * 300)); // Arbitrary calculation
        newBus.eta = `${etaMinutes} min`;
    } else {
        newBus.eta = 'N/A';
    }


    const randomStatus = Math.random();
    if (randomStatus < 0.1) newBus.status = 'Delayed';
    else if (randomStatus > 0.9) newBus.status = 'Early';
    else newBus.status = 'On Time';

    return newBus;
  });
}
