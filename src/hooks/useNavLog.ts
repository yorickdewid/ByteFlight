import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiService } from '../lib/api';
import { FlightPlan, NavLog } from '../types';

interface UseNavLogResult {
  navLog: NavLog | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  // Computed values for quick access
  totalDistance: number;
  totalDuration: number;
  totalFuel: number;
}

export function useNavLog(flightPlan: FlightPlan): UseNavLogResult {
  const [navLog, setNavLog] = useState<NavLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track last request to avoid stale responses
  const requestIdRef = useRef(0);

  const fetchNavLog = useCallback(async () => {
    // Need at least departure, arrival, and aircraft
    if (!flightPlan.departure?.id || !flightPlan.arrival?.id || !flightPlan.aircraft?.id) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const routeString = ApiService.buildRouteString(
        flightPlan.departure,
        flightPlan.waypoints,
        flightPlan.arrival
      );

      const result = await ApiService.createFlightPlan({
        route: routeString,
        aircraftRegistration: flightPlan.aircraft.id,
        departureDate: flightPlan.dateTime,
        defaultAltitude: flightPlan.cruiseAltitude,
      });

      // Only update if this is still the latest request
      if (requestId === requestIdRef.current) {
        setNavLog(result);
        setError(null);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to calculate flight plan';
        setError(message);
        console.error('NavLog error:', err);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    flightPlan.departure?.id,
    flightPlan.arrival?.id,
    flightPlan.aircraft?.id,
    flightPlan.waypoints,
    flightPlan.dateTime,
    flightPlan.cruiseAltitude,
  ]);

  // Debounced fetch when flight plan changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce 500ms to avoid hammering API during rapid edits
    debounceRef.current = setTimeout(() => {
      fetchNavLog();
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchNavLog]);

  // Manual refresh
  const refresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    fetchNavLog();
  }, [fetchNavLog]);

  return {
    navLog,
    isLoading,
    error,
    refresh,
    // Computed values (fall back to 0 if no nav log)
    totalDistance: navLog?.totalDistance ?? 0,
    totalDuration: navLog?.totalDuration ?? 0,
    totalFuel: navLog?.totalTripFuel ?? 0,
  };
}
