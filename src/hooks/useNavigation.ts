import { useState } from 'react';
import { NavPoint, Notam } from '../types';
import { ApiService } from '../lib/api';

export function useNavigation() {
  const [selectedPoint, setSelectedPoint] = useState<NavPoint | null>(null);
  const [selectedPointMetar, setSelectedPointMetar] = useState<string | null>(null);
  const [selectedPointNotams, setSelectedPointNotams] = useState<Notam[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'INFO' | 'WX' | 'NOTAM'>('INFO');

  const refreshPointData = async (icao: string) => {
    // Parallel fetch for speed
    const [metar, notams] = await Promise.all([
      ApiService.getMetar(icao),
      ApiService.getNotams(icao)
    ]);
    setSelectedPointMetar(metar);
    setSelectedPointNotams(notams);
  };

  const handleSelectPoint = async (point: NavPoint) => {
    // Get full detail (e.g. runways/freqs might be lightweight in search results)
    const fullPoint = await ApiService.getNavPointDetail(point.id) || point;
    setSelectedPoint(fullPoint);
    setSidebarTab('INFO'); // Reset tab on new selection

    // Fetch dynamic data
    refreshPointData(fullPoint.id);
  };

  return {
    selectedPoint,
    setSelectedPoint,
    selectedPointMetar,
    selectedPointNotams,
    sidebarTab,
    setSidebarTab,
    refreshPointData,
    handleSelectPoint,
  };
}
