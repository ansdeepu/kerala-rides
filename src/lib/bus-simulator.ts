'use client';
import type { Bus, Stop } from './types';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';


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

// Function to update or create a trip document with actual arrival times
async function updateTripHistory(routeId: string, stopIndex: number, actualTime: Date) {
    const db = getFirestore();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tripRef = doc(db, `routes/${routeId}/history/${todayStr}`);
    
    try {
        const tripDoc = await getDoc(tripRef);
        let stops: Stop[] = [];

        if (tripDoc.exists()) {
            stops = tripDoc.data().stops || [];
        } else {
            // If trip doesn't exist, create it from the route definition
            const routeRef = doc(db, 'routes', routeId);
            const routeDoc = await getDoc(routeRef);
            if (routeDoc.exists()) {
                stops = routeDoc.data().stops.map((s: any) => ({ ...s, actualArrivalTime: undefined })) || [];
            }
        }
        
        if (stops[stopIndex] && !stops[stopIndex].actualArrivalTime) {
            stops[stopIndex].actualArrivalTime = format(actualTime, 'hh:mm a');

            await setDoc(tripRef, {
                date: todayStr,
                stops: stops,
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error updating trip history:", error);
    }
}


// This function simulates the movement of buses along their routes.
// It will not move buses that are being actively "driven" by a user.
export function simulateBusMovement(currentBuses: Bus[], drivingBusId: string | null): Bus[] {
  if (currentBuses.length === 0) {
    return currentBuses;
  }

  const now = new Date();

  return currentBuses.map(bus => {
    // If a user is actively driving this bus, just enrich it with route data and return.
    // The live location is being updated directly in Firestore and will be reflected via the useCollection hook.
    if (bus.id === drivingBusId) {
        const nextStop = bus.stops[bus.nextStopIndex];
         return {
            ...bus,
            nextStopName: nextStop?.name || 'N/A',
            eta: nextStop ? '1 min' : 'N/A', // A simple placeholder ETA for live driving
            status: 'On Time'
        };
    }
    
    if (!bus.stops || bus.stops.length < 2) {
      return {
        ...bus,
        status: 'On Time',
        eta: 'N/A',
        currentLocation: bus.stops[0]?.location || { lat: 0, lng: 0 },
        nextStopIndex: 1,
        nextStopName: 'N/A',
      };
    }
    
    const { stops } = bus;
    
    // Filter out stops with invalid times before processing
    const validStopTimes = stops
        .map((stop, index) => ({ stop, time: timeToDate(stop.arrivalTime), originalIndex: index }))
        .filter(item => item.time !== null) as { stop: Stop, time: Date, originalIndex: number }[];

    if (validStopTimes.length < 2) {
        // Not enough valid stops to create a route segment
        bus.currentLocation = stops[0]?.location || { lat: 0, lng: 0 };
        bus.nextStopIndex = 1;
        bus.eta = "Schedule data incomplete";
        bus.status = 'Not Started';
        bus.nextStopName = stops[0]?.name || 'N/A';
        return bus;
    }

    const firstStopTime = validStopTimes[0].time;
    const lastStopTime = validStopTimes[validStopTimes.length - 1].time;

    let segmentFound = false;

    if (now < firstStopTime) {
        // Before the route starts, park at the first stop
        bus.currentLocation = validStopTimes[0].stop.location;
        bus.nextStopIndex = 0; // It's at the first stop
        bus.status = "Not Started";
        bus.eta = "Route has not started";
        bus.nextStopName = 'N/A';
    } else if (now > lastStopTime) {
        // After the route ends, park at the last stop
        bus.currentLocation = validStopTimes[validStopTimes.length - 1].stop.location;
        bus.nextStopIndex = stops.length; // No next stop
        bus.status = "Finished";
        bus.eta = "Route has finished";
        bus.nextStopName = 'End of Route';
    } else {
        // Find the current segment of the route
        for (let i = 0; i < validStopTimes.length - 1; i++) {
            const fromTime = validStopTimes[i].time;
            const toTime = validStopTimes[i+1].time;

             // Update history if bus just "arrived"
            if (now >= toTime && (bus.nextStopIndex <= validStopTimes[i+1].originalIndex)) {
                updateTripHistory(bus.id, validStopTimes[i+1].originalIndex, toTime);
            }

            if (now >= fromTime && now <= toTime) {
                const fromStop = validStopTimes[i].stop;
                const toStop = validStopTimes[i+1].stop;
                
                const timeInSegment = toTime.getTime() - fromTime.getTime();
                const timeElapsed = now.getTime() - fromTime.getTime();
                const progress = timeInSegment > 0 ? timeElapsed / timeInSegment : 0;

                bus.currentLocation = {
                    lat: fromStop.location.lat + (toStop.location.lat - fromStop.location.lat) * progress,
                    lng: fromStop.location.lng + (toStop.location.lng - fromStop.location.lng) * progress,
                };
                
                bus.nextStopIndex = validStopTimes[i+1].originalIndex;
                
                const etaMillis = toTime.getTime() - now.getTime();
                const etaMinutes = Math.round(etaMillis / 60000);
                bus.eta = `${Math.max(0, etaMinutes)} min`;

                segmentFound = true;
                break;
            }
        }
        if (!segmentFound) {
           // If in a layover period, park at the last departed stop
           let lastDepartedIndex = validStopTimes.findIndex(item => item.time > now) - 1;
           if (lastDepartedIndex < 0) lastDepartedIndex = validStopTimes.length - 1;

           const lastDepartedStopInfo = validStopTimes[lastDepartedIndex];
           bus.currentLocation = lastDepartedStopInfo.stop.location;
           
           bus.nextStopIndex = lastDepartedStopInfo.originalIndex + 1;
           bus.eta = "At Stop";
        }
        
        bus.nextStopName = stops[bus.nextStopIndex]?.name || 'End of Route';
        const randomStatus = Math.random();
        if (randomStatus < 0.1) bus.status = 'Delayed';
        else if (randomStatus > 0.9) bus.status = 'Early';
        else bus.status = 'On Time';
    }
    
    return bus;
  });
}
