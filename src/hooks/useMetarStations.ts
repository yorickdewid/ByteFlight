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
   * Fetch METAR data for a list of aerodromes
   * Batches requests with slight delays to avoid rate limiting
   */
  const fetchMetarsForAerodromes = async (aerodromes: NavPoint[]): Promise<NavPoint[]> => {
    // Fetch METARs in parallel but with rate limiting awareness
    const metarPromises = aerodromes.map(async (aerodrome, index) => {
      // Stagger requests slightly to avoid rate limiting (10 req/min limit)
      await new Promise(resolve => setTimeout(resolve, index * 100));

      try {
        const metarData = await ApiService.getMetar(aerodrome.id);
        if (metarData && metarData.metar) {
          return {
            ...aerodrome,
            metar: metarData.metar.raw,
            // Store decoded data if needed
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch METAR for ${aerodrome.id}`);
      }
      return null;
    });

    const results = await Promise.all(metarPromises);
    return results.filter((station) => station !== null && station?.metar !== undefined) as NavPoint[];
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

      try {
        // Fetch nearby aerodromes
        const aerodromes = await ApiService.getNearbyAerodromes(
          center.lat,
          center.lon,
          radius
        );

        // Limit to prevent excessive METAR fetches (max 20 stations)
        const limitedAerodromes = aerodromes.slice(0, 20);

        // Fetch METARs for each aerodrome
        const stationsWithMetar = await fetchMetarsForAerodromes(limitedAerodromes);

        setMetarStations(stationsWithMetar);
      } catch (error) {
        console.error('Failed to update METAR stations:', error);
        setMetarStations([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    metarStations,
    isLoading,
    updateStations,
  };
}
