export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  createdAt: any; // Can be a Date object or a Firestore Timestamp
}

export interface Stop {
  name: string;
  arrivalTime: string;
  location: {
    lat: number;
    lng: number;
  };
}

export interface Route {
  id: string;
  name: string;
  stops: Stop[];
}

export interface Bus {
  id: string;
  number: string;
  routeId: string;
  routeName?: string; // Will be added dynamically
  currentLocation: { lat: number; lng: number };
  status: 'On Time' | 'Delayed' | 'Early';
  eta?: string;
  stops?: Stop[];
  nextStopIndex: number;
  nextStopName?: string;
  direction: 'forward' | 'backward';
  updatedAt: any;
}
