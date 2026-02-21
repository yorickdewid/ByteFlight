import { useCallback, useEffect, useRef, useState } from 'react';
import { NavPoint } from '../types';
import { ApiService } from '../lib/api';

const MAX_STATIONS = 1000;
const STORAGE_KEY = 'byteflight_metar_stations';
const MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes — METAR data goes stale

interface MapBounds {
  center: { lat: number; lon: number };
  zoom: number;
}

interface StationEntry {
  station: NavPoint;
  lastSeen: number; // Timestamp — used for LRU eviction
}

interface StoredCache {
  timestamp: number;
  entries: [string, StationEntry][];
}

/**
 * Restore station cache from localStorage if it exists and isn't stale.
 */
function loadCachedStations(): Map<string, StationEntry> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored: StoredCache = JSON.parse(raw);
    if (Date.now() - stored.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return new Map(stored.entries);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Persist station cache to localStorage.
 */
function saveCachedStations(cache: Map<string, StationEntry>) {
  try {
    const stored: StoredCache = {
      timestamp: Date.now(),
      entries: [...cache.entries()],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Hook to manage METAR stations based on map viewport.
 *
 * Stations accumulate as the user pans — new stations are added,
 * existing stations get their METAR data refreshed, and the oldest
 * (least recently seen) stations are evicted when the cache exceeds
 * MAX_STATIONS. This avoids the visual flicker of stations appearing
 * and disappearing on every pan and reduces redundant API calls.
 */
export function useMetarStations() {
  const [metarStations, setMetarStations] = useState<NavPoint[]>(() => {
    const cached = loadCachedStations();
    return cached ? [...cached.values()].map(e => e.station) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>('');
  const lastBoundsRef = useRef<MapBounds | null>(null);
  const stationCache = useRef<Map<string, StationEntry>>(loadCachedStations() ?? new Map());

  /**
   * Merge incoming stations into the accumulator.
   * - Existing stations: update METAR data + lastSeen timestamp
   * - New stations: add to cache
   * - Over cap: evict least recently seen stations
   */
  const mergeStations = useCallback((incoming: NavPoint[]) => {
    const now = Date.now();
    const cache = stationCache.current;

    for (const station of incoming) {
      cache.set(station.id, { station, lastSeen: now });
    }

    // Evict oldest stations if over cap
    if (cache.size > MAX_STATIONS) {
      const entries = [...cache.entries()];
      entries.sort((a, b) => a[1].lastSeen - b[1].lastSeen);

      const toEvict = cache.size - MAX_STATIONS;
      for (let i = 0; i < toEvict; i++) {
        cache.delete(entries[i][0]);
      }
    }

    // Derive array for React consumers
    const stations = [...cache.values()].map(entry => entry.station);
    setMetarStations(stations);

    // Persist to localStorage for instant restore on next load
    saveCachedStations(cache);
  }, []);

  /**
   * Calculate search radius based on zoom level.
   * Higher zoom = smaller radius (more focused view).
   */
  const getRadiusFromZoom = (zoom: number): number => {
    if (zoom >= 12) return 30;   // Very zoomed in — 30 NM
    if (zoom >= 10) return 50;   // City level — 50 NM
    if (zoom >= 8) return 100;   // Regional — 100 NM
    if (zoom >= 6) return 200;   // Country level — 200 NM
    return 400;                  // Continent level — 400 NM
  };

  /**
   * Fetch and merge METAR stations for the given map bounds.
   * Debounced (500ms) to prevent excessive API calls during panning.
   */
  const updateStations = useCallback((bounds: MapBounds) => {
    const { center, zoom } = bounds;
    const radius = getRadiusFromZoom(zoom);

    // Cache key prevents re-fetching the exact same viewport
    const cacheKey = `${center.lat.toFixed(2)},${center.lon.toFixed(2)},${radius}`;
    if (lastFetchRef.current === cacheKey) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      lastFetchRef.current = cacheKey;
      lastBoundsRef.current = bounds;

      try {
        const stations = await ApiService.getNearbyMetars(
          center.lat,
          center.lon,
          radius
        );
        mergeStations(stations);
      } catch (error) {
        console.error('Failed to update METAR stations:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, [mergeStations]);

  // Periodic refresh — re-fetch current viewport every 5 minutes
  // to keep METAR data (flight categories, wind, vis) current.
  // Clears cache key to bypass dedup, mergeStations handles the rest.
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastBoundsRef.current) return;
      lastFetchRef.current = '';
      updateStations(lastBoundsRef.current);
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(interval);
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [updateStations]);

  return {
    metarStations,
    isLoading,
    updateStations,
  };
}
