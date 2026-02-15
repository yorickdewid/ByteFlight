import { useEffect, useState } from 'react';
import { ApiService } from '../lib/api';
import { mockInitialFlightPlan } from '../lib/mock-data';
import { FlightPlan, NavPoint, Waypoint } from '../types';

export function useFlightPlan() {
  const [flightPlan, setFlightPlan] = useState<FlightPlan>(() => {
    try {
      const saved = localStorage.getItem('byteflight_plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration/Safety check: Ensure aircraft object exists if we have data from older version
        if (!parsed.aircraft || !parsed.aircraft.fuelBurn) {
          return mockInitialFlightPlan;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse saved plan", e);
    }
    return mockInitialFlightPlan;
  });

  // Persistence
  useEffect(() => {
    localStorage.setItem('byteflight_plan', JSON.stringify(flightPlan));
  }, [flightPlan]);

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
