import { MetarStation, parseMetar, fromIMetar, normalizeICAO } from "flight-planner";
import * as turf from '@turf/turf';
import { Aircraft } from "flight-planner/dist/aircraft";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Gets a value from the cache
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if cache entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Sets a value in the cache with an optional TTL (time to live)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs
    };
    this.cache.set(key, entry);
  }

  /**
   * Clears all cache entries or specific one by key
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

// Create a singleton cache instance
const apiCache = new ApiCache();

/**
 * Base API service with error handling and caching
 */
async function fetchFromApi<T>(url: string, options: RequestInit = {}, cacheTtl?: number): Promise<T> {
  try {
    // Check cache first if cacheTtl is specified
    if (cacheTtl) {
      const cachedData = apiCache.get<T>(url);
      if (cachedData) return cachedData;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Cache the response if cacheTtl is specified
    if (cacheTtl) {
      apiCache.set<T>(url, data, cacheTtl);
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${url}:`, error);
    throw error;
  }
}

/**
 * Fetches a list of aircraft from the ByteFlight API.
 * 
 * @async
 * @function fetchAircraft
 * @returns {Promise<Aircraft[]>} A promise that resolves to an array of Aircraft objects
 * @throws {Error} If the network response is not ok
 */
export async function fetchAircraft(): Promise<Aircraft[]> {
  // Cache aircraft data for 1 hour (rarely changes)
  return fetchFromApi<Aircraft[]>(
    'https://byteflight-worker.ydewid.workers.dev/api/aircraft',
    {},
    60 * 60 * 1000 // 1 hour cache
  );
}

/**
 * Fetches METAR station data based on a search string or bounding box.
 * 
 * @param search - Either a string containing station ID(s) or a GeoJSON.BBox containing coordinates
 * @returns A promise that resolves to an array of MetarStation objects
 * 
 * @example
 * // Fetch by station ID
 * const stations = await fetchMetarStation('KJFK');
 * 
 * @example
 * // Fetch by bounding box
 * const bbox: GeoJSON.BBox = [-74.2, 40.6, -73.7, 40.9];
 * const stations = await fetchMetarStation(bbox);
 */
export async function fetchMetarStation(search: string | GeoJSON.BBox): Promise<MetarStation[]> {
  let url: string;

  if (typeof search === 'string') {
    url = `https://byteflight-worker.ydewid.workers.dev/api/metar?ids=${search}&format=json&taf=true`;
  } else {
    // Format bbox coordinates and round to 2 decimal places for better caching
    const bboxReversed = [
      parseFloat(search[1].toFixed(2)),
      parseFloat(search[0].toFixed(2)),
      parseFloat(search[3].toFixed(2)),
      parseFloat(search[2].toFixed(2))
    ];
    url = `https://byteflight-worker.ydewid.workers.dev/api/metar?bbox=${bboxReversed.join(',')}&format=json&taf=true`;
  }

  try {
    const data = await fetchFromApi<any[]>(url, {}, 2 * 60 * 1000); // 2 minutes cache for station search

    return data.map((metar: any) => ({
      station: normalizeICAO(metar.icaoId),
      metarData: fromIMetar(parseMetar(metar.rawOb)),
      location: turf.point([metar.lon, metar.lat]),
    }));
  } catch (error) {
    console.error('Error fetching METAR data:', error);
    return [];
  }
}
