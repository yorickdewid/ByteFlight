import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import { Aircraft, RouteFormData, RouteTrip } from 'flight-planner';

import { useMap } from '../hooks/useMap';
import { useWeatherData } from '../hooks/useWeatherData';
import { useServices } from '../contexts/ServiceContext';
import { RouteProvider, useRoute } from '../contexts/RouteContext';
import RouteLogTable from '../components/RouteLogTable';

const FlightPlannerContent: React.FC = () => {
  // Get services and hooks
  const { aerodromeService, weatherService, sunService } = useServices();
  const {
    aircraft, setAircraft,
    routeTrip, setRouteTrip,
    routeForm, setRouteForm,
    isRouteLoading, setIsRouteLoading,
    handleCreateRoute
  } = useRoute();

  // Map related state and refs
  const {
    mapRef, mapContainerRef, popupRef,
    currentLocation, initializeMap,
    isMapLoaded
  } = useMap({
    onMoveEnd: (map) => {
      refreshMetarData(map);
      refreshAerodromeData();
    }
  });

  const {
    refreshMetarData,
    metarFeatureCollection
  } = useWeatherData({
    autoRefresh: true,
    refreshInterval: 120000 // 2 minutes
  });

  // UI state
  const [showRouteLog, setShowRouteLog] = useState(false);
  const [departureDate, setDepartureDate] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');

  // Context menu state
  const contextMenuRef = React.useRef<HTMLDivElement | null>(null);
  const rightClickCoordsRef = React.useRef<{ lng: number; lat: number } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ left: 0, top: 0 });

  // Initialize current date/time
  useEffect(() => {
    const now = new Date();
    const localDate = now.toISOString().split('T')[0];
    const localTimeHours = String(now.getUTCHours()).padStart(2, '0');
    const localTimeMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    const localTime = `${localTimeHours}:${localTimeMinutes}`;

    setDepartureDate(localDate);
    setDepartureTime(localTime);
  }, []);

  // Load aircraft data
  useEffect(() => {
    const loadAircraft = async () => {
      try {
        // Load aircraft data from API or local storage
        const loadedAircraft: Aircraft[] = []; // Replace with actual loading logic
        setAircraft(loadedAircraft);
      } catch (error) {
        console.error('Error loading aircraft:', error);
      }
    };
    loadAircraft();
  }, [setAircraft]);

  // Initialize map
  useEffect(() => {
    const cleanup = initializeMap();

    // Setup context menu handling
    const handleDocumentClick = () => {
      if (showContextMenu) setShowContextMenu(false);
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      if (cleanup) cleanup();
    };
  }, [initializeMap, showContextMenu]);

  // Handle visibility changes (refresh data when tab becomes visible)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && mapRef.current) {
        await refreshMetarData(mapRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshMetarData, mapRef]);

  const aerodromeFeatureCollection = () => {
    return turf.featureCollection(aerodromeService.aerodromesList.map(aerodrome => {
      return turf.point(aerodrome.location.geometry.coordinates, {
        icao: aerodrome.ICAO,
        name: aerodrome.name,
      });
    }));
  };

  const refreshAerodromeData = async () => {
    if (!mapRef.current) return;

    const center = mapRef.current.getCenter();
    if (center) {
      const centerPoint = turf.point([center.lng, center.lat]);
      await aerodromeService.refreshByRadius(centerPoint.geometry.coordinates, 250);

      const aerodromeSource = mapRef.current.getSource('aerodrome') as mapboxgl.GeoJSONSource | undefined;
      if (aerodromeSource) {
        aerodromeSource.setData(aerodromeFeatureCollection());
      }
    }
  };

  const addWaypointToRoute = async () => {
    if (rightClickCoordsRef.current) {
      // Implementation for adding waypoints
      console.log('Adding waypoint at', rightClickCoordsRef.current);
    }
  };

  return (
    <div className="flex h-screen w-full">
      {/* Main content */}
      <div className="relative flex-1">
        {/* Map container */}
        <div ref={mapContainerRef} className="h-full w-full" />

        {/* Route log overlay */}
        {showRouteLog && routeTrip && (
          <RouteLogTable routeTrip={routeTrip} onClose={() => setShowRouteLog(false)} />
        )}

        {/* Context menu */}
        {showContextMenu && (
          <div
            ref={contextMenuRef}
            className="absolute bg-white rounded-md shadow-md border border-gray-200 z-50 py-1"
            style={{ left: contextMenuPos.left, top: contextMenuPos.top }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100"
              onClick={addWaypointToRoute}
            >
              Add waypoint here
            </button>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        {/* Route form */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Route Planning</h2>

          {/* Form fields */}
          {/* Aircraft selection, departure/arrival inputs, etc. */}

          <button
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
            onClick={async () => {
              await handleCreateRoute();
              setShowRouteLog(true);
            }}
            disabled={isRouteLoading}
          >
            {isRouteLoading ? 'Calculating...' : 'Create Route'}
          </button>

          {routeTrip && (
            <button
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors"
              onClick={() => setShowRouteLog(!showRouteLog)}
            >
              {showRouteLog ? 'Hide Route Details' : 'Show Route Details'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const FlightPlanner: React.FC = () => {
  return (
    <ServiceProvider>
      <RouteProvider>
        <FlightPlannerContent />
      </RouteProvider>
    </ServiceProvider>
  );
};

export default FlightPlanner;
