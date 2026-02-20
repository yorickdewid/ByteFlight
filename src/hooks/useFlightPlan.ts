import { useState } from 'react';
import { ApiService } from '../lib/api';
import { mockInitialFlightPlan } from '../lib/mock-data';
import { FlightPlan, NavPoint, Waypoint } from '../types';

/**
 * Core flight plan editor state.
 *
 * Persistence is handled externally by `useRoutes`, which auto-saves
 * the flight plan into the active route on every change. This hook
 * only manages the in-memory editing state and handlers.
 */
export function useFlightPlan() {
  const [flightPlan, setFlightPlan] = useState<FlightPlan>(mockInitialFlightPlan);

  const handlePointChange = async (type: 'departure' | 'arrival' | 'alternate', val: string) => {
    const id = val.toUpperCase();
    // Optimistic update — set id so the sidebar input reflects the typed value immediately
    setFlightPlan(p => ({ ...p, [type]: { ...p[type], id } }));

    // Async lookup to fill coordinates
    if (id.length >= 3) {
      const pt = await ApiService.getNavPointDetail(id);
      if (pt) {
        setFlightPlan(p => ({ ...p, [type]: pt }));
      }
    }
  };

  const handleAddWaypoint = (point: NavPoint) => {
    setFlightPlan(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, {
        ...point,
        alt: prev.cruiseAltitude
      }]
    }));
  };

  const handleMapWaypointMove = (index: number | 'DEP' | 'ARR', lat: number, lon: number) => {
    setFlightPlan(prev => {
      if (index === 'DEP') {
        return { ...prev, departure: { ...prev.departure, lat, lon } };
      } else if (index === 'ARR') {
        return { ...prev, arrival: { ...prev.arrival, lat, lon } };
      } else {
        const newWps = [...prev.waypoints];
        if (newWps[index]) {
          newWps[index] = { ...newWps[index], lat, lon };
          return { ...prev, waypoints: newWps };
        }
        return prev;
      }
    });
  };

  const handleMapWaypointUpdate = (index: number, updates: Partial<Waypoint>) => {
    setFlightPlan(prev => {
      const newWps = [...prev.waypoints];
      if (newWps[index]) {
        newWps[index] = { ...newWps[index], ...updates };
      }
      return { ...prev, waypoints: newWps };
    });
  };

  const handleMapAddWaypoint = (lat: number, lon: number) => {
    setFlightPlan(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, {
        id: `wp-map-${Date.now()}`,
        name: 'USER WP',
        lat, lon,
        type: 'WAYPOINT',
        alt: prev.cruiseAltitude
      }]
    }));
  };

  return {
    flightPlan,
    setFlightPlan,
    handlePointChange,
    handleAddWaypoint,
    handleMapWaypointMove,
    handleMapWaypointUpdate,
    handleMapAddWaypoint,
  };
}
