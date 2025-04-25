import { useRef, useEffect } from 'react';
import * as turf from '@turf/turf';
import { WeatherService } from 'flight-planner';
import { fetchMetarStation } from '../services/api';

interface UseWeatherDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export const useWeatherData = ({
  autoRefresh = true,
  refreshInterval = 120000 // 2 minutes default
}: UseWeatherDataOptions = {}) => {
  const weatherServiceRef = useRef<WeatherService | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!weatherServiceRef.current) {
      weatherServiceRef.current = new WeatherService();
      weatherServiceRef.current.fetchFunction = fetchMetarStation;
    }

    if (autoRefresh) {
      refreshTimerRef.current = setInterval(() => {
        refreshMetarData();
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const refreshMetarData = async (mapInstance?: mapboxgl.Map) => {
    if (!weatherServiceRef.current) return;

    if (mapInstance) {
      const bounds = mapInstance.getBounds();
      if (!bounds) return;

      const bbox: GeoJSON.BBox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];

      await weatherServiceRef.current.fetchAndUpdateStations(bbox);
    }

    return weatherServiceRef.current;
  };

  const metarFeatureCollection = () => {
    if (!weatherServiceRef.current) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(weatherServiceRef.current.stations.map(station => {
      return turf.point(station.location.geometry.coordinates, {
        name: station.station,
        color: station.metarData.flightRules ? colorizeFlightRules(station.metarData.flightRules) : 'gray'
      });
    }));
  };

  // Note: This function should be imported from flight-planner if available
  const colorizeFlightRules = (flightRules: string): string => {
    switch (flightRules) {
      case 'VFR':
        return 'green';
      case 'MVFR':
        return 'blue';
      case 'IFR':
        return 'red';
      case 'LIFR':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return {
    weatherService: weatherServiceRef.current,
    refreshMetarData,
    metarFeatureCollection
  };
};