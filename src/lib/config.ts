import { AircraftProfile } from '../types';

export const APP_VERSION = "v4.14-BETA-RC3";

// Mapbox token: set VITE_MAPBOX_TOKEN in .env.local
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

export const defaultAircraftProfiles: AircraftProfile[] = [
  {
    id: 'PH-VCR',
    name: 'Robin DR400/140B',
    cruiseSpeed: 110,
    fuelBurn: 35,
    usableFuel: 110,
    emptyWeight: 600,
    maxTakeoffMass: 1000,
    cgMin: 0.2, cgMax: 0.8,
    armPilot: 0.4, armPax: 0.4, armBaggage: 1.1, armFuel: 0.8
  },
  {
    id: 'PH-XYZ',
    name: 'Piper PA-28-181',
    cruiseSpeed: 105,
    fuelBurn: 38,
    usableFuel: 136,
    emptyWeight: 710,
    maxTakeoffMass: 1157,
    cgMin: 2.1, cgMax: 2.4,
    armPilot: 2.1, armPax: 3.0, armBaggage: 3.6, armFuel: 2.4
  },
];
