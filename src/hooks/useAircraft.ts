import { useState, useEffect } from 'react';
import { AircraftProfile, FlightPlan } from '../types';
import { ApiService } from '../lib/api';

export function useAircraft(flightPlan: FlightPlan, setFlightPlan: React.Dispatch<React.SetStateAction<FlightPlan>>) {
  const [aircraftProfiles, setAircraftProfiles] = useState<AircraftProfile[]>([]);

  useEffect(() => {
    const loadAircraft = async () => {
      try {
        const fleet = await ApiService.getAircraft();
        setAircraftProfiles(fleet);

        // Ensure flight plan has valid aircraft reference if generic or missing
        setFlightPlan(prev => {
          if (prev.aircraftId && fleet.length > 0) {
            const ac = fleet.find(f => f.id === prev.aircraftId);
            // Only update if we found the aircraft, otherwise fallback to first
            if (ac) return { ...prev, aircraft: ac };
            else return { ...prev, aircraftId: fleet[0].id, aircraft: fleet[0] };
          }
          // If no aircraft ID set, default to first
          if (fleet.length > 0) return { ...prev, aircraftId: fleet[0].id, aircraft: fleet[0] };
          return prev;
        });
      } catch (e) {
        console.error("Failed to load aircraft", e);
      }
    };
    loadAircraft();
  }, [setFlightPlan]);

  const handleSaveAircraft = async (ac: AircraftProfile, isNew: boolean) => {
    await ApiService.saveAircraft(ac, isNew);
    const fleet = await ApiService.getAircraft();
    setAircraftProfiles(fleet);
    if (ac.id === flightPlan.aircraftId) {
      setFlightPlan(p => ({ ...p, aircraft: ac }));
    }
  };

  const handleDeleteAircraft = async (id: string) => {
    await ApiService.deleteAircraft(id);
    const fleet = await ApiService.getAircraft();
    setAircraftProfiles(fleet);
    if (flightPlan.aircraftId === id && fleet.length > 0) {
      setFlightPlan(p => ({ ...p, aircraftId: fleet[0].id, aircraft: fleet[0] }));
    }
  };

  return {
    aircraftProfiles,
    handleSaveAircraft,
    handleDeleteAircraft,
  };
}
