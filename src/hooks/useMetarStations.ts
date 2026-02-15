import { useCallback, useEffect, useRef, useState } from 'react';
import { NavPoint } from '../types';
import { ApiService } from '../lib/api';

interface MapBounds {
  center: { lat: number; lon: number };
  zoom: number;
}

/**
 * Hook to manage METAR stations based on map viewport
 * Fetches nearby aerodromes when map moves, then fetches METAR data for each
 */
export function useMetarStations() {
  const [metarStations, setMetarStations] = useState<NavPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<string>(''); // Prevent duplicate fetches
  const lastBoundsRef = useRef<MapBounds | null>(null); // For periodic refresh

  /**
   * Calculate appropriate search radius based on zoom level
   * Higher zoom = smaller radius (more focused view)
   * Lower zoom = larger radius (wider view)
   */
  const getRadiusFromZoom = (zoom: number): number => {
    // Zoom levels: 0-22 (Mapbox)
    // Radius in NM
    if (zoom >= 12) return 15;   // Very zoomed in - 15 NM
    if (zoom >= 10) return 25;   // City level - 25 NM
    if (zoom >= 8) return 50;    // Regional - 50 NM
    if (zoom >= 6) return 100;   // Country level - 100 NM
    return 200;                  // Continent level - 200 NM
  };

  /**
   * Update METAR stations based on map bounds
   * Debounced to prevent excessive API calls during map movement
   */
  const updateStations = useCallback(async (bounds: MapBounds) => {
    const { center, zoom } = bounds;
    const radius = getRadiusFromZoom(zoom);

    // Create cache key to prevent duplicate fetches
    const cacheKey = `${center.lat.toFixed(2)},${center.lon.toFixed(2)},${radius}`;
    if (lastFetchRef.current === cacheKey) {
      return; // Already fetched this area
    }

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce: Wait 500ms after map stops moving
    debounceTimer.current = setTimeout(async () => {
      setIsLoading(true);
      lastFetchRef.current = cacheKey;
      lastBoundsRef.current = bounds;

      try {
        // Fetch nearby METAR stations in ONE API call (much faster!)
        const stations = await ApiService.getNearbyMetars(
          center.lat,
          center.lon,
          radius
        );

        // Stations already include METAR data from backend
        setMetarStations(stations);
      } catch (error) {
        console.error('Failed to update METAR stations:', error);
        setMetarStations([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce
  }, []);

  // Periodic refresh for weather data staleness (METAR changes frequently)
  // Bypasses the cache key so it always re-fetches current viewport
  useEffect(() => {
    const interval = setInterval(() => {
      if (!lastBoundsRef.current) return;
      lastFetchRef.current = ''; // Clear cache to force re-fetch
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
