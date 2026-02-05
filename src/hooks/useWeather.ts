import { useState, useEffect, useRef } from 'react';
import { WeatherCell, NavPoint } from '../types';
import { fetchMockWeather } from '../lib/utils';

export function useWeather(departure: NavPoint) {
  const [weatherLayers, setWeatherLayers] = useState<WeatherCell[]>([]);
  const [showRadar, setShowRadar] = useState(false);
  const [showTurb, setShowTurb] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      setIsWeatherLoading(true);
      const data = await fetchMockWeather(lat, lon);
      setWeatherLayers(data);
    } catch (error) {
      console.error('Weather fetch failed:', error);
      setWeatherLayers([]);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (showRadar || showTurb) {
      // Immediate fetch
      fetchWeatherData(departure.lat, departure.lon);
      
      // Set up interval for updates
      intervalRef.current = setInterval(() => {
        fetchWeatherData(departure.lat, departure.lon);
      }, 30000); // Increased to 30 seconds to reduce requests
    } else {
      setWeatherLayers([]);
      setIsWeatherLoading(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [showRadar, showTurb, departure.lat, departure.lon]);

  const toggleRadar = () => setShowRadar(!showRadar);
  const toggleTurb = () => setShowTurb(!showTurb);

  return {
    weatherLayers,
    showRadar,
    showTurb,
    isWeatherLoading,
    toggleRadar,
    toggleTurb,
  };
}