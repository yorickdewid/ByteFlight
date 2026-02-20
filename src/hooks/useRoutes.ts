import { useCallback, useEffect, useRef, useState } from 'react';
import { defaultAircraftProfiles } from '../lib/config';
import { FlightPlan, SavedRoute } from '../types';

const ROUTES_KEY = 'byteflight_routes';
const ACTIVE_ROUTE_KEY = 'byteflight_active_route_id';
const LEGACY_PLAN_KEY = 'byteflight_plan';

function generateRouteName(plan: FlightPlan): string {
  const dep = plan.departure?.id || '????';
  const arr = plan.arrival?.id || '????';
  if (!dep && !arr) return 'New Route';
  return `${dep || '????'} → ${arr || '????'}`;
}

function createBlankFlightPlan(): FlightPlan {
  const aircraft = defaultAircraftProfiles[0];
  return {
    departure: { id: '', name: '', lat: 0, lon: 0, type: 'DEP' },
    arrival: { id: '', name: '', lat: 0, lon: 0, type: 'ARR' },
    alternate: null,
    cruiseAltitude: 1500,
    waypoints: [],
    dateTime: new Date().toISOString().substring(0, 16),
    payload: { pilot: 85, pax: 0, baggage: 10, fuel: 80 },
    reserveType: 'VFR_DAY',
    aircraftId: aircraft.id,
    aircraft,
  };
}

function loadRoutes(): SavedRoute[] {
  try {
    const stored = localStorage.getItem(ROUTES_KEY);
    if (stored) return JSON.parse(stored) as SavedRoute[];
  } catch (e) {
    console.error('Failed to parse saved routes', e);
  }
  return [];
}

function loadActiveRouteId(): string | null {
  return localStorage.getItem(ACTIVE_ROUTE_KEY);
}

/** Migrate legacy single-plan localStorage into the routes system */
function migrateLegacyPlan(): SavedRoute | null {
  try {
    const legacy = localStorage.getItem(LEGACY_PLAN_KEY);
    if (!legacy) return null;
    const plan = JSON.parse(legacy) as FlightPlan;
    // Validate it has minimum structure
    if (!plan.aircraft || !plan.aircraft.fuelBurn) return null;
    const route: SavedRoute = {
      id: crypto.randomUUID(),
      name: generateRouteName(plan),
      flightPlan: plan,
      updatedAt: new Date().toISOString(),
    };
    // Clean up legacy key after migration
    localStorage.removeItem(LEGACY_PLAN_KEY);
    return route;
  } catch {
    return null;
  }
}

export function useRoutes(
  flightPlan: FlightPlan,
  setFlightPlan: React.Dispatch<React.SetStateAction<FlightPlan>>,
) {
  const [routes, setRoutes] = useState<SavedRoute[]>(() => {
    const existing = loadRoutes();
    if (existing.length > 0) return existing;

    // First-time migration from legacy single plan
    const migrated = migrateLegacyPlan();
    if (migrated) return [migrated];

    // No data at all — start with a blank route
    const blank: SavedRoute = {
      id: crypto.randomUUID(),
      name: 'New Route',
      flightPlan: createBlankFlightPlan(),
      updatedAt: new Date().toISOString(),
    };
    return [blank];
  });

  const [activeRouteId, setActiveRouteId] = useState<string>(() => {
    const existing = loadRoutes();
    const savedId = loadActiveRouteId();

    // If we have a saved active ID that exists in routes, use it
    if (savedId && existing.find(r => r.id === savedId)) return savedId;

    // Migration case — pick the first route
    const migrated = migrateLegacyPlan();
    if (existing.length > 0) return existing[0].id;
    if (migrated) return migrated.id;

    // Will be set after first render from routes state
    return '';
  });

  // Ref to track whether the user manually renamed the route
  const userRenamedRef = useRef<Set<string>>(new Set());

  // On mount: set the active route's flight plan into the editor
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const active = routes.find(r => r.id === activeRouteId);
    if (active) {
      setFlightPlan(active.flightPlan);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fix up activeRouteId if it's empty (first run with blank route)
  useEffect(() => {
    if (!activeRouteId && routes.length > 0) {
      setActiveRouteId(routes[0].id);
    }
  }, [activeRouteId, routes]);

  // Persist routes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(ROUTES_KEY, JSON.stringify(routes));
  }, [routes]);

  // Persist active route ID
  useEffect(() => {
    if (activeRouteId) {
      localStorage.setItem(ACTIVE_ROUTE_KEY, activeRouteId);
    }
  }, [activeRouteId]);

  // Auto-save current flight plan into the active route (debounced to avoid thrashing)
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!activeRouteId) return;

    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setRoutes(prev => prev.map(r => {
        if (r.id !== activeRouteId) return r;

        // Auto-generate name from DEP/ARR unless user manually renamed
        const autoName = userRenamedRef.current.has(r.id)
          ? r.name
          : generateRouteName(flightPlan);

        return {
          ...r,
          name: autoName,
          flightPlan,
          updatedAt: new Date().toISOString(),
        };
      }));
    }, 300);

    return () => clearTimeout(saveTimer.current);
  }, [flightPlan, activeRouteId]);

  const createRoute = useCallback(() => {
    const newRoute: SavedRoute = {
      id: crypto.randomUUID(),
      name: 'New Route',
      flightPlan: createBlankFlightPlan(),
      updatedAt: new Date().toISOString(),
    };

    setRoutes(prev => [newRoute, ...prev]);
    setActiveRouteId(newRoute.id);
    setFlightPlan(newRoute.flightPlan);

    return newRoute.id;
  }, [setFlightPlan]);

  const switchRoute = useCallback((id: string) => {
    // Save current state first
    setRoutes(prev => prev.map(r =>
      r.id === activeRouteId
        ? { ...r, flightPlan, updatedAt: new Date().toISOString() }
        : r
    ));

    // Load target route
    setRoutes(prev => {
      const target = prev.find(r => r.id === id);
      if (target) {
        setFlightPlan(target.flightPlan);
        setActiveRouteId(id);
      }
      return prev;
    });
  }, [activeRouteId, flightPlan, setFlightPlan]);

  const deleteRoute = useCallback((id: string) => {
    setRoutes(prev => {
      const filtered = prev.filter(r => r.id !== id);

      if (filtered.length === 0) {
        // Always keep at least one route
        const blank: SavedRoute = {
          id: crypto.randomUUID(),
          name: 'New Route',
          flightPlan: createBlankFlightPlan(),
          updatedAt: new Date().toISOString(),
        };
        setActiveRouteId(blank.id);
        setFlightPlan(blank.flightPlan);
        return [blank];
      }

      // If we deleted the active route, switch to the first remaining
      if (id === activeRouteId) {
        const next = filtered[0];
        setActiveRouteId(next.id);
        setFlightPlan(next.flightPlan);
      }

      return filtered;
    });

    userRenamedRef.current.delete(id);
  }, [activeRouteId, setFlightPlan]);

  const renameRoute = useCallback((id: string, name: string) => {
    userRenamedRef.current.add(id);
    setRoutes(prev => prev.map(r =>
      r.id === id ? { ...r, name } : r
    ));
  }, []);

  // Sort by updatedAt desc for display
  const sortedRoutes = [...routes].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return {
    routes: sortedRoutes,
    activeRouteId,
    createRoute,
    switchRoute,
    deleteRoute,
    renameRoute,
  };
}
