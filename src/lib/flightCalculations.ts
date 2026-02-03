import { FlightPlan, NavPoint } from '../types';
import { calculateDistance } from './utils';

export function calculateRouteDistance(flightPlan: FlightPlan): number {
  let distance = 0;
  const points = [flightPlan.departure, ...flightPlan.waypoints, flightPlan.arrival].filter(p => p.lat);

  for (let i = 0; i < points.length - 1; i++) {
    distance += calculateDistance(
      points[i].lat,
      points[i].lon,
      points[i + 1].lat,
      points[i + 1].lon
    );
  }

  return distance;
}

export function calculateRouteTime(routeDistance: number, cruiseSpeed: number): number {
  return Math.round((routeDistance / cruiseSpeed) * 60);
}

export interface FuelCalculations {
  trip: number;
  cont: number;
  res: number;
  total: number;
}

export function calculateFuelRequirements(
  routeTime: number,
  fuelBurn: number,
  reserveType: 'VFR_DAY' | 'VFR_NIGHT' | 'IFR'
): FuelCalculations {
  const trip = Math.round((routeTime / 60) * fuelBurn);
  const cont = Math.ceil(trip * 0.05);
  const reserveMins = reserveType === 'VFR_NIGHT' ? 45 : 30;
  const res = Math.round((reserveMins / 60) * fuelBurn);
  const taxi = 4;

  return {
    trip,
    cont,
    res,
    total: trip + cont + res + taxi
  };
}

export function getMetarStations(navData: Record<string, NavPoint>): NavPoint[] {
  return Object.values(navData).filter(p => p.type === 'AIRPORT' && p.metar);
}
