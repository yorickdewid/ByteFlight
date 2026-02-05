import { useState, useEffect } from 'react';
import { NavPoint } from '../types';
import { ApiService } from '../lib/api';

export function useAppInit(
  onSetSelectedPoint: (point: NavPoint) => void,
  onRefreshPointData: (icao: string) => void
) {
  const [isAppLoading, setIsAppLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // Load initial data for default selected point
        // For beta we hardcode loading EHRD details initially to show something
        const initialPoint = await ApiService.getNavPointDetail('EHRD');
        if (initialPoint) {
          onSetSelectedPoint(initialPoint);
          onRefreshPointData(initialPoint.id);
        }
      } catch (e) {
        console.error("Failed to initialize app", e);
      } finally {
        setIsAppLoading(false);
      }
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  return { isAppLoading };
}