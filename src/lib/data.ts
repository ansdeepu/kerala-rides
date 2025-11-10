export type Bus = {
  id: string;
  number: string;
  routeName: string;
  stops: { name: string; lat: number; lng: number }[];
  currentLocation: { lat: number; lng: number };
  status: "On Time" | "Delayed" | "Early";
  nextStopIndex: number;
  nextStopName: string;
  eta: string;
};

const routes = {
  "tvm-ekm": {
    name: "Trivandrum -> Ernakulam",
    stops: [
      { name: "Trivandrum", lat: 8.5241, lng: 76.9366 },
      { name: "Kollam", lat: 8.8932, lng: 76.6141 },
      { name: "Alappuzha", lat: 9.4981, lng: 76.3388 },
      { name: "Ernakulam", lat: 9.9816, lng: 76.2996 },
    ],
  },
  "ekm-kkd": {
    name: "Ernakulam -> Kozhikode",
    stops: [
      { name: "Ernakulam", lat: 9.9816, lng: 76.2996 },
      { name: "Thrissur", lat: 10.5276, lng: 76.2144 },
      { name: "Malappuram", lat: 11.051, lng: 76.0712 },
      { name: "Kozhikode", lat: 11.2588, lng: 75.7804 },
    ],
  },
  "tvm-kym": {
    name: "Trivandrum -> Kottayam",
    stops: [
        { name: "Trivandrum", lat: 8.5241, lng: 76.9366 },
        { name: "Kottarakkara", lat: 9.0069, lng: 76.7725 },
        { name: "Adoor", lat: 9.1611, lng: 76.7366 },
        { name: "Kottayam", lat: 9.5914, lng: 76.5222 },
    ]
  }
};

export const initialBuses: Bus[] = [
  {
    id: "1",
    number: "KL-15 A 1234",
    routeName: routes["tvm-ekm"].name,
    stops: routes["tvm-ekm"].stops,
    currentLocation: { lat: 8.70865, lng: 76.74485 },
    status: "On Time",
    nextStopIndex: 1,
    nextStopName: "Kollam",
    eta: "25 min",
  },
  {
    id: "2",
    number: "KL-15 A 5678",
    routeName: routes["ekm-kkd"].name,
    stops: routes["ekm-kkd"].stops,
    currentLocation: { lat: 10.2547, lng: 76.2558 },
    status: "Delayed",
    nextStopIndex: 1,
    nextStopName: "Thrissur",
    eta: "45 min",
  },
  {
    id: "3",
    number: "KL-15 A 9012",
    routeName: routes["tvm-kym"].name,
    stops: routes["tvm-kym"].stops,
    currentLocation: { lat: 9.0840, lng: 76.7546 },
    status: "On Time",
    nextStopIndex: 2,
    nextStopName: "Adoor",
    eta: "15 min",
  },
  {
    id: "4",
    number: "KL-15 B 3456",
    routeName: routes["tvm-ekm"].name,
    stops: routes["tvm-ekm"].stops,
    currentLocation: { lat: 9.25, lng: 76.45 },
    status: "Early",
    nextStopIndex: 2,
    nextStopName: "Alappuzha",
    eta: "30 min",
  },
];

export function moveBuses(buses: Bus[]): Bus[] {
    return buses.map(bus => {
        const nextStop = bus.stops[bus.nextStopIndex];
        if (!nextStop) return bus; // End of route

        const latDiff = nextStop.lat - bus.currentLocation.lat;
        const lngDiff = nextStop.lng - bus.currentLocation.lng;

        const distance = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff);

        // If close to next stop, advance to the one after
        if (distance < 0.05) {
            const newNextStopIndex = bus.nextStopIndex + 1;
            if (newNextStopIndex >= bus.stops.length) {
                return {
                    ...bus,
                    status: "On Time",
                    nextStopName: "Destination Reached",
                    eta: "0 min",
                };
            }
            return {
                ...bus,
                nextStopIndex: newNextStopIndex,
                nextStopName: bus.stops[newNextStopIndex].name,
                eta: `${Math.floor(Math.random() * 30) + 15} min`,
            }
        }
        
        // Move a small fraction towards the next stop
        const moveFactor = 0.1 + (Math.random() - 0.5) * 0.05;
        const newLat = bus.currentLocation.lat + latDiff * moveFactor;
        const newLng = bus.currentLocation.lng + lngDiff * moveFactor;
        
        const newEta = Math.max(0, parseInt(bus.eta) - 2 + Math.floor(Math.random() * 2));
        const newStatus = newEta > 40 ? "Delayed" : (newEta < 10 ? "Early" : "On Time");


        return {
            ...bus,
            currentLocation: { lat: newLat, lng: newLng },
            eta: `${newEta} min`,
            status: newStatus
        };
    });
}
