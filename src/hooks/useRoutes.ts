import { useCallback, useEffect, useRef, useState } from 'react';
import { mockInitialFlightPlan } from '../lib/mock-data';
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

function loadStoredRoutes(): SavedRoute[] {
  try {
    const stored = localStorage.getItem(ROUTES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as SavedRoute[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved routes', e);
  }
  return [];
}

interface RoutesBootstrap {
  routes: SavedRoute[];
  activeRouteId: string;
}

// Resolved once per page load. useState initializers may run more than once
// (StrictMode double-invokes them), and useFlightPlan needs the same answer —
// so all callers share this cache instead of re-reading/migrating localStorage.
let bootstrapCache: RoutesBootstrap | null = null;

function bootstrap(): RoutesBootstrap {
  if (bootstrapCache) return bootstrapCache;

  let routes = loadStoredRoutes();

  // One-time migration of the legacy single-plan key into the routes system
  if (routes.length === 0) {
    try {
      const legacy = localStorage.getItem(LEGACY_PLAN_KEY);
      if (legacy) {
        const plan = JSON.parse(legacy) as FlightPlan;
        if (plan.aircraft && plan.aircraft.fuelBurn) {
          routes = [{
            id: crypto.randomUUID(),
            name: generateRouteName(plan),
            flightPlan: plan,
            updatedAt: new Date().toISOString(),
          }];
        }
        localStorage.removeItem(LEGACY_PLAN_KEY);
      }
    } catch { /* corrupt legacy plan — ignore */ }
  }

  // Brand-new user — seed with the demo route so the app shows something
  if (routes.length === 0) {
    routes = [{
      id: crypto.randomUUID(),
      name: generateRouteName(mockInitialFlightPlan),
      flightPlan: mockInitialFlightPlan,
      updatedAt: new Date().toISOString(),
    }];
  }

  const savedId = localStorage.getItem(ACTIVE_ROUTE_KEY);
  const activeRouteId = savedId && routes.some(r => r.id === savedId)
    ? savedId
    : routes[0].id;

  bootstrapCache = { routes, activeRouteId };
  return bootstrapCache;
}

/** Flight plan of the active saved route — useFlightPlan uses this as its initial state. */
export function loadActiveFlightPlan(): FlightPlan {
  const { routes, activeRouteId } = bootstrap();
  return routes.find(r => r.id === activeRouteId)?.flightPlan ?? mockInitialFlightPlan;
}

export function useRoutes(
  flightPlan: FlightPlan,
  setFlightPlan: React.Dispatch<React.SetStateAction<FlightPlan>>,
) {
  const [routes, setRoutes] = useState<SavedRoute[]>(() => bootstrap().routes);
  const [activeRouteId, setActiveRouteId] = useState<string>(() => bootstrap().activeRouteId);

  // Every route id this session has seen (including ones we deleted). Storage
  // writes never drop routes created by another tab: unknown ids are merged in
  // rather than overwritten, while ids we knowingly deleted stay deleted.
  const knownIdsRef = useRef<Set<string>>(new Set(bootstrap().routes.map(r => r.id)));

  // Ref to track whether the user manually renamed the route
  const userRenamedRef = useRef<Set<string>>(new Set());

  // Persist routes, merging in routes another tab saved since our last read
  useEffect(() => {
    const known = knownIdsRef.current;
    routes.forEach(r => known.add(r.id));

    const foreign = loadStoredRoutes().filter(s => !known.has(s.id));
    localStorage.setItem(ROUTES_KEY, JSON.stringify([...routes, ...foreign]));

    if (foreign.length > 0) {
      foreign.forEach(f => known.add(f.id));
      setRoutes(prev => [...prev, ...foreign]);
    }
  }, [routes]);

  // Adopt routes created in other tabs as they appear
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== ROUTES_KEY || !e.newValue) return;
      try {
        const incoming = JSON.parse(e.newValue) as SavedRoute[];
        if (!Array.isArray(incoming)) return;
        setRoutes(prev => {
          const known = knownIdsRef.current;
          const foreign = incoming.filter(s => !known.has(s.id));
          if (foreign.length === 0) return prev;
          foreign.forEach(f => known.add(f.id));
          return [...prev, ...foreign];
        });
      } catch { /* malformed write from elsewhere — ignore */ }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
      setRoutes(prev => {
        const idx = prev.findIndex(r => r.id === activeRouteId);
        if (idx === -1 || prev[idx].flightPlan === flightPlan) return prev;

        // Auto-generate name from DEP/ARR unless user manually renamed
        const autoName = userRenamedRef.current.has(prev[idx].id)
          ? prev[idx].name
          : generateRouteName(flightPlan);

        const next = [...prev];
        next[idx] = {
          ...prev[idx],
          name: autoName,
          flightPlan,
          updatedAt: new Date().toISOString(),
        };
        return next;
      });
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
    if (id === activeRouteId) return;
    const target = routes.find(r => r.id === id);
    if (!target) return;

    // Flush the current plan into the outgoing route before switching
    clearTimeout(saveTimer.current);
    setRoutes(prev => prev.map(r =>
      r.id === activeRouteId && r.flightPlan !== flightPlan
        ? { ...r, flightPlan, updatedAt: new Date().toISOString() }
        : r
    ));

    setActiveRouteId(id);
    setFlightPlan(target.flightPlan);
  }, [routes, activeRouteId, flightPlan, setFlightPlan]);

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

  const clearRoute = useCallback(() => {
    const blank = createBlankFlightPlan();
    setFlightPlan(blank);
    userRenamedRef.current.delete(activeRouteId);
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
    clearRoute,
    renameRoute,
  };
}
