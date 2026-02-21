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
  flightCategory?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  nearestMetarStation?: string;
  sunset?: string;
  runways?: Runway[];
  frequencies?: Frequency[];
  vfrAllowed?: boolean;
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

// Backend METAR response structure
export interface MetarResponse {
  station: string;
  metar: {
    station: string;
    observationTime: string;
    raw: string;
    wind: {
      direction: number;
      directionMin?: number;
      directionMax?: number;
      speed: number;
      gust?: number;
    };
    temperature: number;
    dewpoint: number;
    visibility: number;
    qnh: number;
    clouds: {
      quantity: string;
      height: number;
    }[];
    flightCategory?: 'VFR' | 'MVFR' | 'IFR' | 'LIFR';
  };
  tafRaw?: string;
  coords: [number, number];
}

// Runway wind analysis response
export interface RunwayWindAnalysis {
  wind: {
    direction: number;
    directionMin?: number;
    directionMax?: number;
    speed: number;
    gust?: number;
  };
  runways: {
    designator: string;
    windAngle: number;
    headwind: number;
    crosswind: number;
    favored: boolean;
  }[];
}

export interface Notam {
  id: string;
  text: string;
}

export interface WindVector {
  dir: number;
  spd: number;
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

export interface SavedRoute {
  id: string;
  name: string;
  flightPlan: FlightPlan;
  updatedAt: string;
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
