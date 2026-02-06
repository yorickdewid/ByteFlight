export interface AircraftProfile {
  id: string;
  name: string;
  cruiseSpeed: number;
  fuelBurn: number;
  usableFuel: number;
  emptyWeight: number;
  maxTakeoffMass: number;
  cgMin: number;
  cgMax: number;
  armPilot: number;
  armPax: number;
  armBaggage: number;
  armFuel: number;
}

export interface Frequency {
  type: string;
  frequency: string;
}

export interface Runway {
  id: string;
  length: number;
  width: number;
  surface: string;
  trueHeading: number;
}

export interface NavPoint {
  type: 'AIRPORT' | 'VOR' | 'WAYPOINT' | 'FIX' | 'DEP' | 'ARR';
  id: string;
  name: string;
  lat: number;
  lon: number;
  elevation?: number | null;
  magVar?: number;
  metar?: string;
  nearestMetarStation?: string;
  sunset?: string;
  runways?: Runway[];
  frequencies?: Frequency[];
  vfrAllowed?: boolean;
  icao?: string; // Optional alias for id in some contexts
}

export interface Waypoint extends NavPoint {
  alt: number;
}

export interface Payload {
  pilot: number;
  pax: number;
  baggage: number;
  fuel: number;
}

export interface FlightPlan {
  departure: NavPoint;
  arrival: NavPoint;
  alternate: NavPoint | null;
  cruiseAltitude: number;
  waypoints: Waypoint[];
  dateTime: string;
  payload: Payload;
  reserveType: 'VFR_DAY' | 'VFR_NIGHT';
  aircraftId: string;
  aircraft: AircraftProfile;
}

export interface ParsedMetar {
  raw: string;
  wind: { dir: number; speed: number; gust: number | null; vrb: boolean };
  vis: number;
  temp: number | string;
  dew: number | string;
  qnh: string;
  ceiling: { type: string; altitude: number };
  clouds: { type: string; alt: number }[];
  timestamp: Date | null;
  category: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
}

export interface Notam {
  id: string;
  text: string;
}

export interface WindVector {
  dir: number;
  spd: number;
}

export interface WeatherCell {
  id: string;
  type: 'PRECIP' | 'TURB';
  intensity: 'LIGHT' | 'MODERATE' | 'SEVERE';
  polygons: { lat: number; lon: number }[];
  timestamp: number;
}

// --- Nav Log Types (from backend flight-planner) ---

export interface RouteLegPerformance {
  headWind: number;
  crossWind: number;
  trueAirspeed: number;
  windCorrectionAngle: number;
  trueHeading: number;
  magneticHeading: number;
  groundSpeed: number;
  duration: number;
  fuelConsumption?: number;
}

export interface RouteSegmentWaypoint {
  icao?: string;
  name?: string;
  coords: [number, number]; // [lon, lat]
  elevation?: number;
}

export interface RouteSegment {
  waypoint: RouteSegmentWaypoint;
  altitude?: number;
}

export interface RouteLeg {
  start: RouteSegment;
  end: RouteSegment;
  course: {
    distance: number;
    track: number;
    magneticTrack: number;
  };
  wind?: {
    direction: number;
    speed: number;
    gust?: number;
  };
  arrivalDate?: string;
  performance?: RouteLegPerformance;
}

export interface NavLog {
  route: RouteLeg[];
  routeAlternate?: RouteLeg;
  totalDistance: number;
  totalDuration: number;
  totalTripFuel?: number;
  fuelBreakdown?: {
    trip: number;
    reserve: number;
    takeoff?: number;
    landing?: number;
    taxi?: number;
    alternate?: number;
  };
  departureDate?: string;
  arrivalDate?: string;
  generatedAt: string;
  remarks?: string;
}

export interface FlightPlanRequest {
  route: string;
  alternate?: string;
  aircraftRegistration: string;
  departureDate?: string;
  defaultAltitude?: number;
  taxiFuel?: number;
  takeoffFuel?: number;
  landingFuel?: number;
}
