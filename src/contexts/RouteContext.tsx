import React, { createContext, useState, useContext, useRef, ReactNode } from 'react';
import { RouteService } from '../services/RouteService';
import { AerodromeService } from '../services/aerodrome';
import { WeatherService } from 'flight-planner';
import { Aircraft, RouteFormData, RouteTrip } from 'flight-planner';

interface RouteContextType {
  routeService: RouteService;
  aircraft: Aircraft[];
  isRouteLoading: boolean;
  routeTrip?: RouteTrip;
  routeForm: RouteFormData;
  setAircraft: (aircraft: Aircraft[]) => void;
  setRouteTrip: (routeTrip?: RouteTrip) => void;
  setRouteForm: (routeForm: RouteFormData) => void;
  setIsRouteLoading: (isLoading: boolean) => void;
  handleCreateRoute: () => Promise<void>;
  addWaypointToRoute: (coordinates: { lng: number; lat: number }) => Promise<void>;
}

interface RouteProviderProps {
  children: ReactNode;
  aerodromeService: AerodromeService;
  weatherService: WeatherService;
}

const RouteContext = createContext<RouteContextType | null>(null);

export const RouteProvider: React.FC<RouteProviderProps> = ({ 
  children, 
  aerodromeService,
  weatherService 
}) => {
  const routeService = useRef<RouteService>(new RouteService(aerodromeService, weatherService));
  
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [routeTrip, setRouteTrip] = useState<RouteTrip | undefined>();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeForm, setRouteForm] = useState<RouteFormData>(() => {
    const initialRouteParams = RouteService.getRouteParamsFromUrl();
    return initialRouteParams;
  });

  const handleCreateRoute = async () => {
    setIsRouteLoading(true);

    try {
      const selectedAircraft = aircraft.find(a => a.id === routeForm.aircraft);
      if (!selectedAircraft) throw new Error('No aircraft selected');
      
      const calculatedRoute = await routeService.current.createRoute({
        departure: routeForm.departure,
        arrival: routeForm.arrival,
        alternate: routeForm.alternate,
        via: routeForm.via,
        aircraft: selectedAircraft
      });

      setRouteTrip(calculatedRoute);
      return calculatedRoute;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    } finally {
      setIsRouteLoading(false);
    }
  };

  const addWaypointToRoute = async (coordinates: { lng: number; lat: number }) => {
    try {
      // Implementation depends on how you want to add waypoints
      // This is a placeholder
      console.log('Adding waypoint at coordinates:', coordinates);
    } catch (error) {
      console.error('Error adding waypoint:', error);
    }
  };

  return (
    <RouteContext.Provider
      value={{
        routeService: routeService.current,
        aircraft,
        routeTrip,
        isRouteLoading,
        routeForm,
        setAircraft,
        setRouteTrip,
        setIsRouteLoading,
        setRouteForm,
        handleCreateRoute,
        addWaypointToRoute
      }}
    >
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (!context) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};