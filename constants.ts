import { AircraftProfile, NavPoint, Notam, FlightPlan } from './types';

export const APP_VERSION = "v4.14-BETA-RC3";
// TODO: Replace with your own Mapbox Access Token
export const MAPBOX_TOKEN = "pk.eyJ1IjoiZGVtb3VzZXIiLCJhIjoiY2x4b3F4ZmY5MGRwbzJqcXl6bnF6bXF6NyJ9.P1-uV5u2qQ_eWzd-lq6b5w";

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

export const mockNavData: Record<string, NavPoint> = {
  EHRD: {
    type: 'AIRPORT',
    id: 'EHRD',
    name: 'Rotterdam The Hague',
    lat: 51.9525, lon: 4.4347,
    metar: 'EHRD 191525Z AUTO 21008KT 9999 SCT035 BKN045 18/12 Q1015 NOSIG', // VFR
    sunset: '19:45',
    magVar: 1,
    runways: [
      { id: '06', length: 2200, width: 45, surface: 'Asphalt', trueHeading: 59 },
      { id: '24', length: 2200, width: 45, surface: 'Asphalt', trueHeading: 239 }
    ],
    frequencies: [
      { type: 'TWR', frequency: '118.205' },
      { type: 'ATIS', frequency: '131.355' },
      { type: 'GND', frequency: '121.905' }
    ],
    elevation: -4,
    vfrAllowed: true,
  },
  EHAM: {
    type: 'AIRPORT',
    id: 'EHAM',
    name: 'Amsterdam Schiphol',
    lat: 52.3086, lon: 4.7639,
    metar: 'EHAM 191525Z 24012KT 9999 FEW030 SCT040 19/11 Q1014 NOSIG', // VFR
    sunset: '19:48',
    magVar: 1,
    runways: [
      { id: '18R', length: 3800, width: 60, surface: 'Asphalt', trueHeading: 182 },
      { id: '36L', length: 3800, width: 60, surface: 'Asphalt', trueHeading: 2 },
      { id: '27', length: 3800, width: 60, surface: 'Asphalt', trueHeading: 270 }
    ],
    frequencies: [{ type: 'TWR', frequency: '119.050' }, { type: 'ATIS', frequency: '132.975' }],
    elevation: -3,
    vfrAllowed: true,
  },
  EHLE: {
    type: 'AIRPORT',
    id: 'EHLE',
    name: 'Lelystad Airport',
    lat: 52.4603, lon: 5.5272,
    metar: 'EHLE 191525Z 22010KT 7000 BKN025 17/10 Q1014', // MVFR (BKN025)
    elevation: -1,
    magVar: 1,
    vfrAllowed: true
  },
  EHBK: {
    type: 'AIRPORT',
    id: 'EHBK',
    name: 'Maastricht Aachen',
    lat: 50.9117, lon: 5.7708,
    metar: 'EHBK 191525Z 20005KT 3000 BR OVC008 15/14 Q1016', // IFR (Vis 3000, OVC008)
    elevation: 374,
    magVar: 1,
    vfrAllowed: false
  },
  EHGG: {
    type: 'AIRPORT',
    id: 'EHGG',
    name: 'Groningen Eelde',
    lat: 53.1194, lon: 6.5817,
    metar: 'EHGG 191525Z 19015KT 1200 +RA OVC003 14/13 Q1012', // LIFR (Vis 1200, OVC003)
    elevation: 17,
    magVar: 1,
    vfrAllowed: false
  },
  EHEH: {
    type: 'AIRPORT',
    id: 'EHEH',
    name: 'Eindhoven',
    lat: 51.4500, lon: 5.3744,
    metar: 'EHEH 191525Z 23011KT 9999 SCT025 BKN035 18/11 Q1015', // MVFR (SCT025 - technically VFR but borderline, let's make it MVFR for demo: BKN020)
    // Adjusted for demo:
    // metar: 'EHEH 191525Z 23011KT 6000 BKN020 18/11 Q1015',
    elevation: 74,
    magVar: 1,
    vfrAllowed: true
  },
  GDA: {
    type: 'VOR',
    id: 'GDA',
    name: 'Gouda VOR-DME',
    lat: 52.0166, lon: 4.7166,
    frequencies: [{ type: 'NAV', frequency: '113.60' }],
    elevation: 0,
    magVar: 1,
    nearestMetarStation: 'EHRD'
  },
  SUGOL: {
    type: 'WAYPOINT',
    id: 'SUGOL',
    name: 'SUGOL Intersection',
    lat: 52.2000, lon: 4.5000,
    elevation: null,
    magVar: 1,
    nearestMetarStation: 'EHAM'
  }
};

// Adjust EHEH to be MVFR for visual variety in this constant block
mockNavData.EHEH.metar = 'EHEH 191525Z 23011KT 6000 BKN015 18/11 Q1015';

export const mockInitialFlightPlan: FlightPlan = {
  departure: { ...mockNavData.EHRD, type: 'DEP' },
  arrival: { ...mockNavData.EHAM, type: 'ARR' },
  alternate: null,
  cruiseAltitude: 1500,
  waypoints: [
    { id: 'wp1', name: 'GDA', lat: 52.0166, lon: 4.7166, type: 'VOR', alt: 1500, elevation: 0, magVar: 1 },
    { id: 'wp2', name: 'SUGOL', lat: 52.2000, lon: 4.5000, type: 'FIX', alt: 2000, elevation: null, magVar: 1 },
  ],
  dateTime: new Date().toISOString().substring(0, 16),
  payload: { pilot: 85, pax: 0, baggage: 10, fuel: 80 },
  reserveType: 'VFR_DAY',
  aircraftId: defaultAircraftProfiles[0].id,
  aircraft: defaultAircraftProfiles[0]
};

export const mockNotams: Notam[] = [
  { id: 'B0123/25', text: 'B0123/25 NOTAMN Q) EHAA/QMRXX/IV/NBO/A/000/999/5157N00426E005 A) EHRD B) 2505140800 C) 2508141700 EST E) RUNWAY 06/24 WIP. EXPECT DELAYS.' },
  { id: 'D0444/25', text: 'D0444/25 NOTAMN Q) EHAA/QWPLW/IV/M/W/000/030/5152N00427E002 A) EHRD B) 2505140500 C) 2505142100 E) PJE WILL TAKE PLACE AT ROTTERDAM/THE HAGUE AP. RADIUS 2NM CENTER 5157N00426E. ACT SUBJ ATC.' },
  { id: 'A1234/25', text: 'A1234/25 NOTAMN Q) EHAA/QFAXX/IV/NBO/A/000/999/5157N00426E005 A) EHRD B) 2505140000 C) PERM E) EASA COMPLIANCE: AD REF CODE 4C.' },
];
