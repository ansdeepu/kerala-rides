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
