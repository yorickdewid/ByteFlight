import { useEffect, useRef, useState } from 'react';
import { Calendar, Clock, List, Loader, Navigation, Plane, Sunrise, Sunset } from 'lucide-react';

import { WeatherService, RouteTrip, colorizeFlightRules, routeTripWaypoints } from 'flight-planner';

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import AerodromeService from '@/services/aerodrome';
import SunCalcService from '@/services/SunCalcService';
import RouteService, { RouteFormData } from '@/services/RouteService';

import AerodromeCard from '@/components/ui/Aerodrome';
import RouteLogTable from '@/components/RouteLogTable';

import * as turf from '@turf/turf';
import { fetchAircraft, fetchMetarStation } from '@/services/api';
import { Aircraft } from 'flight-planner/dist/aircraft';

const FlightPlanner = () => {
  const weatherStationRepositoryRef = useRef<WeatherService | null>(null);

  if (!weatherStationRepositoryRef.current) {
    weatherStationRepositoryRef.current = new WeatherService();
    weatherStationRepositoryRef.current.fetchFunction = fetchMetarStation;
  }

  const sunService = new SunCalcService();
  const airportRepository = new AerodromeService();

  const routeService = new RouteService(airportRepository, weatherStationRepositoryRef.current);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [routeTrip, setRouteTrip] = useState<RouteTrip>();
  const [showRouteLog, setShowRouteLog] = useState(false);
  const [departureDate, setDepartureDate] = useState<string>(''); // TODO: Remove
  const [departureTime, setDepartureTime] = useState<string>(''); // TODO: Remove
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [routeForm, setRouteForm] = useState<RouteFormData>({
    aircraft: '',
    departure: '',
    arrival: '',
    alternate: '',
    via: ''
  });

  const contextMenuRef = useRef<HTMLDivElement | null>(null);
  const rightClickCoordsRef = useRef<{ lng: number; lat: number } | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const now = new Date();
    const localDate = now.toISOString().split('T')[0];
    const localTimeHours = String(now.getUTCHours()).padStart(2, '0');
    const localTimeMinutes = String(now.getUTCMinutes()).padStart(2, '0');
    const localTime = `${localTimeHours}:${localTimeMinutes}`;

    setDepartureDate(localDate);
    setDepartureTime(localTime);
  }, []);

  useEffect(() => {
    const loadAircraft = async () => {
      try {
        const data = await fetchAircraft();
        setAircraft(data);
      } catch (error) {
        console.error('Error fetching aircraft data:', error);
        setAircraft([]);
      }
    };
    loadAircraft();
  }, []);

  useEffect(() => {
    const initialRouteParams = RouteService.getRouteParamsFromUrl();
    setRouteForm(initialRouteParams);
  }, []);

  const [currentLocation, setCurrentLocation] = useState(() => {
    const savedLocation = localStorage.getItem('currentLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        if (parsedLocation &&
          typeof parsedLocation.lat === 'number' &&
          typeof parsedLocation.lon === 'number') {
          return {
            lat: parsedLocation.lat,
            lon: parsedLocation.lon,
            zoom: parsedLocation.zoom || 7
          };
        }
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    }
    return { lat: 51.926517, lon: 4.462456, zoom: 7 };
  });

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.on('moveend', () => {
        const center = mapRef.current?.getCenter();
        const zoom = mapRef.current?.getZoom();
        if (center && zoom !== undefined) {
          const newLocation = {
            lat: center.lat,
            lon: center.lng,
            zoom: zoom
          };
          setCurrentLocation(newLocation);
          localStorage.setItem('currentLocation', JSON.stringify(newLocation));
        }
      });
    }
  }, [mapRef.current]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await refreshMetarData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const metarFeatureCollection = () => {
    if (!weatherStationRepositoryRef.current) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(weatherStationRepositoryRef.current.stations.map(station => {
      return turf.point(station.location.geometry.coordinates, {
        name: station.station,
        color: colorizeFlightRules(station.metarData.flightRules)
      });
    }));
  }

  const aerodromeFeatureCollection = () => {
    return turf.featureCollection(airportRepository.aerodromesList.map(aerodrome => {
      return turf.point(aerodrome.location.geometry.coordinates, {
        icao: aerodrome.ICAO,
        name: aerodrome.name,
      });
    }));
  }

  const refreshMetarData = async () => {
    if (!mapRef.current) return;

    if (weatherStationRepositoryRef.current) {
      const bounds = mapRef.current.getBounds();
      if (!bounds) return;

      const bbox: GeoJSON.BBox = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];

      await weatherStationRepositoryRef.current.fetchAndUpdateStations(bbox);

      const metarSource = mapRef.current.getSource('metar') as mapboxgl.GeoJSONSource | undefined;
      if (metarSource) metarSource.setData(metarFeatureCollection());
    }
  };

  const refreshAerodomeData = async () => {
    if (!mapRef.current) return;

    const center = mapRef.current?.getCenter();
    if (center) {
      const centerPoint = turf.point([center.lng, center.lat]);
      await airportRepository.refreshByRadius(centerPoint.geometry.coordinates, 250);

      const aerodromeSource = mapRef.current.getSource('aerodrome') as mapboxgl.GeoJSONSource | undefined;
      if (aerodromeSource) aerodromeSource.setData(aerodromeFeatureCollection());
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [currentLocation.lon, currentLocation.lat],
        zoom: currentLocation.zoom,
        style: 'mapbox://styles/mapbox/light-v11'
      });

      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'metar-popup'
      });

      mapRef.current.on('contextmenu', (e) => {
        e.preventDefault();

        rightClickCoordsRef.current = {
          lng: e.lngLat.lng,
          lat: e.lngLat.lat
        };

        setContextMenuPos({
          left: e.point.x,
          top: e.point.y
        });
        setShowContextMenu(true);
      });

      mapRef.current.on('click', () => {
        setShowContextMenu(false);
      });
    }

    refreshTimerRef.current = setInterval(refreshMetarData, 1_000 * 60 * 2);

    mapRef.current?.on('moveend', async () => {
      await Promise.all([
        refreshMetarData(),
        refreshAerodomeData()
      ]);
    });

    mapRef.current?.on('load', async () => {
      mapRef.current?.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        }), 'bottom-right');
      mapRef.current?.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

      // mapRef.current?.addSource('png-tiles', {
      //   'type': 'raster',
      //   'tiles': [
      //     'https://nwy-tiles-api.prod.newaydata.com/tiles/{z}/{x}/{y}.png?path=2413/aero/latest'
      //   ],
      //   'tileSize': 256
      // });

      // mapRef.current?.addLayer({
      //   'id': 'png-tile-layer',
      //   'type': 'raster',
      //   'source': 'png-tiles',
      //   'paint': {
      //     'raster-opacity': 1.0
      //   }
      // });

      mapRef.current?.addSource('route', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapRef.current?.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#FF00FF',
          'line-width': 4
        }
      });

      mapRef.current?.addLayer({
        id: 'route-label',
        type: 'symbol',
        source: 'route',
        layout: {
          'symbol-placement': 'line-center',
          'text-field': [
            'concat',
            ['to-string', ['coalesce', ['get', 'heading'], ['get', 'trueTrack']]],
            '°'
          ],
          'text-size': 14,
          'text-font': ['Open Sans Bold'],
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'symbol-spacing': 500
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 3,
        }
      });

      mapRef.current?.addSource('waypoint', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapRef.current?.addLayer({
        id: 'waypoint',
        type: 'circle',
        source: 'waypoint',
        paint: {
          'circle-radius': 6,
          'circle-color': '#FF00FF'
        }
      });

      mapRef.current?.addSource('metar', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapRef.current?.addLayer({
        id: 'metar',
        type: 'circle',
        source: 'metar',
        paint: {
          'circle-radius': 10,
          'circle-color': [
            'match',
            ['get', 'color'],
            'red', '#ef4444',
            'green', '#22c55e',
            'blue', '#3b82f6',
            'purple', '#a855f7',
            '#000000'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.5)',
          'circle-translate': [1, 1],
          'circle-translate-anchor': 'viewport',
          'circle-blur': 0.2
        }
      });

      mapRef.current?.addSource('aerodrome', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      mapRef.current?.addLayer({
        id: 'aerodrome',
        type: 'symbol',
        source: 'aerodrome',
        layout: {
          'icon-image': 'airport',
          'icon-size': 1.5,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      mapRef.current?.addLayer({
        id: 'aerodrome-label',
        type: 'symbol',
        source: 'aerodrome',
        layout: {
          'text-field': ['get', 'icao'],
          'text-font': ['Open Sans Regular'],
          'text-size': 12,
          'text-offset': [0, 1.5],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2
        }
      });

      mapRef.current?.on('mouseenter', 'aerodrome', () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        }
      });

      mapRef.current?.on('mouseleave', 'aerodrome', () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      });

      mapRef.current?.addLayer({
        id: 'metar-hover',
        type: 'circle',
        source: 'metar',
        paint: {
          'circle-radius': 12,
          'circle-color': [
            'match',
            ['get', 'color'],
            'red', '#ef4444',
            'green', '#22c55e',
            'blue', '#3b82f6',
            'purple', '#a855f7',
            '#000000'
          ],
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(255, 255, 255, 0.5)',
          'circle-translate': [1, 1],
          'circle-translate-anchor': 'viewport',
          'circle-blur': 0.2
        },
        filter: ['==', 'station', '']
      });

      mapRef.current?.on('mouseenter', 'metar', () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = 'pointer';
        }
      });

      mapRef.current?.on('mouseleave', 'metar', () => {
        if (mapRef.current) {
          mapRef.current.getCanvas().style.cursor = '';
        }
      });

      mapRef.current?.on('mousemove', 'metar', (e) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];

          const geometry = feature.geometry as GeoJSON.Point;
          const coordinates = geometry.coordinates.slice() as [number, number];
          const stationName = feature.properties?.name;

          const station = weatherStationRepositoryRef.current?.findByICAO(stationName);

          let popupContent = `<strong>${stationName}</strong>`;
          if (station) {
            popupContent += `<p>Flight Rules: ${station.metarData.flightRules}</p>`;
            if (station.metarData.raw) {
              popupContent += `<p class="text-xs text-gray-600">${station.metarData.raw}</p>`;
            }
          }

          if (mapRef.current) {
            popupRef.current?.setLngLat(coordinates)
              .setHTML(popupContent)
              .addTo(mapRef.current);
          }
        }
      });

      mapRef.current?.on('mouseleave', 'metar', () => {
        popupRef.current?.remove();
      });

      mapRef.current?.on('click', 'metar', (e) => {
        if (e.features && e.features.length > 0 && weatherStationRepositoryRef.current) {
          // TODO: Do something with the METAR station
        }
      });

      await Promise.all([
        refreshMetarData(),
        refreshAerodomeData()
      ]);
    });

    const handleDocumentClick = () => {
      setShowContextMenu(false);
    };

    document.addEventListener('click', handleDocumentClick);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      mapRef.current?.remove()
      document.removeEventListener('click', handleDocumentClick);
    }
  }, []);

  const addWaypointToRoute = async () => {
    if (rightClickCoordsRef.current) {
      const { lng, lat } = rightClickCoordsRef.current;

      const newVia = RouteService.addWaypointToVia(routeForm, lng, lat);
      const updatedForm = { ...routeForm, via: newVia };

      setRouteForm(updatedForm);
      setShowContextMenu(false);
    }
  };

  const handleCreateRoute = async () => {
    setIsRouteLoading(true);

    try {
      RouteService.updateUrlWithRouteParams(routeForm);

      const routeTripResult = await routeService.createRoute(
        routeForm,
        departureDate,
        departureTime,
        aircraft
      );

      setRouteTrip(routeTripResult);
      setShowRouteLog(true);

      //
      // Update the map with the route and waypoints
      //

      if (mapRef.current?.isStyleLoaded() && routeTripResult !== undefined) {
        const routeSource = mapRef.current.getSource('route') as mapboxgl.GeoJSONSource | undefined;
        if (routeSource) {
          const routePlanGeoJSON = turf.featureCollection(routeTripResult.route.map(leg => {
            return turf.lineString([leg.start.location.geometry.coordinates, leg.end.location.geometry.coordinates], {
              start: leg.start.name,
              end: leg.end.name,
              distance: Math.round(leg.distance),
              trueTrack: Math.round(leg.trueTrack),
              heading: leg.performance ? Math.round(leg.performance.heading || 0) : null,
              duration: leg.performance ? Math.floor(leg.performance.duration) : 0,
            });
          }));
          routeSource.setData(routePlanGeoJSON);
        }

        const routeWaypointGeoJSON = turf.featureCollection(routeTripWaypoints(routeTripResult).map(waypoint => {
          return turf.point(waypoint.location.geometry.coordinates, {
            name: waypoint.toString(),
          });
        }));

        const waypointSource = mapRef.current.getSource('waypoint') as mapboxgl.GeoJSONSource | undefined;
        if (waypointSource) waypointSource.setData(routeWaypointGeoJSON);

        const geobbox = turf.bbox(routeWaypointGeoJSON).slice(0, 4) as [number, number, number, number];

        mapRef.current?.fitBounds(geobbox, {
          padding: {
            left: 50,
            top: 50,
            right: 50,
            bottom: 50
          }
        });
      }
    } catch (error) {
      console.error("Error creating route:", error);
    } finally {
      setIsRouteLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full">

      {/* Left Sidebar - Flight Planning Form */}
      <div className="w-80 h-full p-4 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-2">
            <Plane className="w-6 h-6 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Flight Plan</h2>
          </div>

          {/* Form */}
          <div className="space-y-4">

            {/* Aircraft Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-1">
                  <Plane className="w-4 h-4" />
                  <span>Aircraft</span>
                </div>
              </label>
              <select
                value={routeForm.aircraft}
                onChange={(e) => setRouteForm({ ...routeForm, aircraft: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Select aircraft...</option>
                {aircraft.map((aircraft, index) => (
                  <option key={index} value={aircraft.registration}>
                    {aircraft.registration} ({aircraft.manufacturer} {aircraft.model})
                  </option>
                ))}
              </select>
            </div>

            {/* Departure and Arrival */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Departure
                </label>
                <input
                  type="text"
                  value={routeForm.departure}
                  onChange={(e) => setRouteForm({ ...routeForm, departure: e.target.value })}
                  placeholder="ICAO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Arrival
                </label>
                <input
                  type="text"
                  value={routeForm.arrival}
                  onChange={(e) => setRouteForm({ ...routeForm, arrival: e.target.value })}
                  placeholder="ICAO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Alternate
                </label>
                <input
                  type="text"
                  value={routeForm.alternate}
                  onChange={(e) => setRouteForm({ ...routeForm, alternate: e.target.value })}
                  placeholder="ICAO"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Date</span>
                  </div>
                </label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>Time UTC</span>
                  </div>
                </label>
                <input
                  type="time"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Route */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <div className="flex items-center space-x-1">
                  <Navigation className="w-4 h-4" />
                  <span>Via Waypoints</span>
                </div>
              </label>
              <textarea
                placeholder="Enter waypoints (comma-separated)"
                value={routeForm.via}
                onChange={(e) => setRouteForm({ ...routeForm, via: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateRoute}
              type="submit"
              className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${routeForm.departure && routeForm.arrival && !isRouteLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              disabled={!routeForm.departure || !routeForm.arrival || isRouteLoading}
            >
              {isRouteLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  <span>Calculating...</span>
                </>
              ) : (
                routeTrip ? "Update Route" : "Calculate Route"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Page Area */}
      <div className="flex-1 h-full flex flex-col">

        {/* Stats Header */}
        <div className="p-2 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between">

            {/* Route Stats */}
            <div className="flex items-center space-x-8">
              <div>
                <span className="text-sm text-gray-500">Total Distance</span>
                <div className="text-lg font-semibold">{routeTrip?.totalDistance ? `${Math.round(routeTrip?.totalDistance)} NM` : '-'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Est. Duration</span>
                <div className="text-lg font-semibold">{routeTrip?.totalDuration ? `${Math.round(routeTrip?.totalDuration)} min` : '-'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-6">

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* Sun Times */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Sunrise className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-gray-600">{sunService.getSunTimes(currentLocation).sunrise.time} LT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sunset className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-gray-600">{sunService.getSunTimes(currentLocation).sunset.time} LT</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* Route Log Button */}
              <button
                onClick={() => setShowRouteLog(!showRouteLog)}
                className="flex items-center space-x-1 text-sm"
              >
                <List className="w-5 h-5" />
                <span>Route Log</span>
              </button>

            </div>

          </div>
        </div>

        {/* Main Map Area */}
        <div className="flex-1 h-full relative">
          <div className="h-full">
            <div id='map-container' ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

            {/* Context Menu */}
            {showContextMenu && (
              <div
                ref={contextMenuRef}
                className="absolute bg-white shadow-md rounded py-1 z-10 border border-gray-200"
                style={{
                  left: contextMenuPos.left,
                  top: contextMenuPos.top
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center"
                  onClick={addWaypointToRoute}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Add to Route
                </button>
              </div>
            )}
          </div>

          {/* Route Log Overlay */}
          {showRouteLog && (
            <RouteLogTable routeTrip={routeTrip} onClose={() => setShowRouteLog(false)} />
          )}
        </div>

      </div>

      {/* Right Sidebar - Weather Info */}
      <div className="w-80 h-full p-2 shrink-0 border-l border-gray-200 overflow-y-auto">
        <div className="space-y-2">
          {RouteService.getAerodromesFromRoute(routeTrip).map((aerodrome) => (
            <AerodromeCard key={aerodrome.ICAO} data={aerodrome} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FlightPlanner;
