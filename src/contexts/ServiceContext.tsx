import React, { createContext, useContext, ReactNode } from 'react';
import { AerodromeService } from '../services/aerodrome';
import { WeatherService } from 'flight-planner';
import SunCalcService from '../services/SunCalcService';
import { useWeatherData } from '../hooks/useWeatherData';

interface ServiceContextType {
  aerodromeService: AerodromeService;
  weatherService: WeatherService;
  sunService: SunCalcService;
}

const ServiceContext = createContext<ServiceContextType | null>(null);

export const ServiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const aerodromeService = new AerodromeService();
  const sunService = new SunCalcService();

  const { weatherService } = useWeatherData();

  if (!weatherService) {
    throw new Error('Weather service not initialized');
  }

  return (
    <ServiceContext.Provider
      value={{
        aerodromeService,
        weatherService,
        sunService,
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};