import { useState, useEffect } from 'react';
import { WeatherCell, NavPoint } from '../types';
import { fetchMockWeather } from '../lib/utils';

export function useWeather(departure: NavPoint) {
  const [weatherLayers, setWeatherLayers] = useState<WeatherCell[]>([]);
  const [showRadar, setShowRadar] = useState(false);
  const [showTurb, setShowTurb] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  useEffect(() => {
    if (showRadar || showTurb) {
      const fetchWx = async () => {
        setIsWeatherLoading(true);
        const data = await fetchMockWeather(departure.lat, departure.lon);
        setWeatherLayers(data);
        setIsWeatherLoading(false);
      };
      fetchWx();
      const interval = setInterval(fetchWx, 10000);
      return () => clearInterval(interval);
    } else {
      setWeatherLayers([]);
    }
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
