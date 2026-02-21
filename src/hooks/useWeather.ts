import { useState } from 'react';

export function useWeather() {
  const [showRadar, setShowRadar] = useState(false);
  const [showTurb, setShowTurb] = useState(false);

  const toggleRadar = () => setShowRadar(!showRadar);
  const toggleTurb = () => setShowTurb(!showTurb);

  return {
    showRadar,
    showTurb,
    toggleRadar,
    toggleTurb,
  };
}
