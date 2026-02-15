import { FlightPlan, NavPoint } from '../types';
import { defaultAircraftProfiles } from './config';

export const mockNavData: Record<string, NavPoint> = {
  EHRD: {
    type: 'AIRPORT',
    id: 'EHRD',
    name: 'Rotterdam The Hague',
    lat: 51.9525, lon: 4.4347,
    metar: 'EHRD 191525Z AUTO 21008KT 9999 SCT035 BKN045 18/12 Q1015 NOSIG',
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
    metar: 'EHAM 191525Z 24012KT 9999 FEW030 SCT040 19/11 Q1014 NOSIG',
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
    metar: 'EHLE 191525Z 22010KT 7000 BKN025 17/10 Q1014',
    elevation: -1,
    magVar: 1,
    vfrAllowed: true
  },
  EHBK: {
    type: 'AIRPORT',
    id: 'EHBK',
    name: 'Maastricht Aachen',
    lat: 50.9117, lon: 5.7708,
    metar: 'EHBK 191525Z 20005KT 3000 BR OVC008 15/14 Q1016',
    elevation: 374,
    magVar: 1,
    vfrAllowed: false
  },
  EHGG: {
    type: 'AIRPORT',
    id: 'EHGG',
    name: 'Groningen Eelde',
    lat: 53.1194, lon: 6.5817,
    metar: 'EHGG 191525Z 19015KT 1200 +RA OVC003 14/13 Q1012',
    elevation: 17,
    magVar: 1,
    vfrAllowed: false
  },
  EHEH: {
    type: 'AIRPORT',
    id: 'EHEH',
    name: 'Eindhoven',
    lat: 51.4500, lon: 5.3744,
    metar: 'EHEH 191525Z 23011KT 6000 BKN015 18/11 Q1015',
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

export const mockInitialFlightPlan: FlightPlan = {
  departure: { ...mockNavData.EHRD, type: 'DEP' },
  arrival: { ...mockNavData.EHAM, type: 'ARR' },
  alternate: null,
  cruiseAltitude: 1500,
  waypoints: [
    { id: 'GDA', name: 'GDA', lat: 52.0166, lon: 4.7166, type: 'VOR', alt: 1500, elevation: 0, magVar: 1 },
    { id: 'SUGOL', name: 'SUGOL', lat: 52.2000, lon: 4.5000, type: 'FIX', alt: 2000, elevation: null, magVar: 1 },
  ],
  dateTime: new Date().toISOString().substring(0, 16),
  payload: { pilot: 85, pax: 0, baggage: 10, fuel: 80 },
  reserveType: 'VFR_DAY',
  aircraftId: defaultAircraftProfiles[0].id,
  aircraft: defaultAircraftProfiles[0]
};
