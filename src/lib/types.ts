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
  actualArrivalTime?: string; // New optional field
  location: {
    lat: number;
    lng: number;
  };
}

// A "Bus" is now just a Route with live tracking data.
export interface Bus {
  id: string;
  name: string;
  stops: Stop[];
  currentLocation: { lat: number; lng: number } | null;
  status: 'On Time' | 'Delayed' | 'Early' | 'Not Started' | 'Finished';
  eta?: string;
  nextStopIndex: number;
  nextStopName?: string;
  direction: 'forward' | 'backward';
  updatedAt?: any;
}

// Represents a single day's run of a route
export interface Trip {
  id: string;
  date: string; // YYYY-MM-DD
  stops: Stop[];
}
