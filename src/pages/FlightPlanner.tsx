import { useEffect, useRef, useState } from 'react';
// import { Card, CardContent } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
import { Calendar, Clock, List, Loader, Navigation, Plane, Sunrise, Sunset } from 'lucide-react';

import { WeatherService, Aerodrome, parseRouteString, routePlan, RouteTrip } from 'flight-planner';

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import AerodromeService from '@/services/aerodrome';
// import WeatherService from '@/services/weather';

import SunCalc from 'suncalc';
// import SunCard from '@/components/ui/SunCard';
// import MetarSection from '@/components/ui/Metar';
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

  const airportRepository = new AerodromeService();

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [routeTrip, setRouteTrip] = useState<RouteTrip>();
  const [showRouteLog, setShowRouteLog] = useState(false);
  const [aerodrome, setAerodrome] = useState<Aerodrome[]>([]);

  // Add state for date and time
  const [departureDate, setDepartureDate] = useState<string>('');
  const [departureTime, setDepartureTime] = useState<string>('');
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const [routeForm, setRouteForm] = useState({
    aircraft: '',
    departure: '',
    arrival: '',
    alternate: '',
    via: ''
  });

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
    const fetchAircraftData = async () => {
      try {
        const data = await fetchAircraft();
        setAircraft(data);
      } catch (error) {
        console.error('Error fetching aircraft data:', error);
        setAircraft([]);
      }
    };

    fetchAircraftData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const aircraftParam = params.get('aircraft');
    const departureParam = params.get('departure');
    const arrivalParam = params.get('arrival');
    const alternateParam = params.get('alternate');
    const viaParam = params.get('via');
    const dateParam = params.get('date');
    const timeParam = params.get('time');

    const newRouteForm = { ...routeForm };
    if (aircraftParam) newRouteForm.aircraft = aircraftParam;
    if (departureParam) newRouteForm.departure = departureParam;
    if (arrivalParam) newRouteForm.arrival = arrivalParam;
    if (alternateParam) newRouteForm.alternate = alternateParam;
    if (viaParam) newRouteForm.via = viaParam;

    setRouteForm(newRouteForm);

    if (dateParam) setDepartureDate(dateParam);
    if (timeParam) setDepartureTime(timeParam);
  }, []);

  const currentLocation = { lat: 51.926517, lon: 4.462456 };
  // const currentLocationPoint = turf.point([currentLocation.lon, currentLocation.lat]);
  // const buffered = turf.buffer(currentLocationPoint, 100, { units: 'kilometers' });
  // if (buffered) {
  //   const bbox = turf.bbox(buffered);
  //   const bboxFeature = turf.bboxPolygon(bbox);
  //   console.log('Buffered bbox feature', JSON.stringify(bboxFeature));
  //   // console.log('Buffered bbox', bbox);
  // }

  const times = SunCalc.getTimes(new Date(), currentLocation.lat, currentLocation.lon);

  var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes().toString().padStart(2, '0');
  var sunsetStr = times.sunset.getHours() + ':' + times.sunset.getMinutes().toString().padStart(2, '0');

  const timeData = {
    sunrise: { time: sunriseStr, label: 'Local' },
    sunset: { time: sunsetStr, label: 'Local' }
  };

  const metarFeatureCollection = () => {
    if (!weatherStationRepositoryRef.current) {
      return turf.featureCollection([]);
    }

    return turf.featureCollection(weatherStationRepositoryRef.current.stations.map(station => {
      let color = '';
      switch (station.metarData.flightRules) {
        case 'VFR':
          color = 'green';
          break;
        case 'MVFR':
          color = 'blue';
          break;
        case 'IFR':
          color = 'red';
          break;
        case 'LIFR':
        default:
          color = 'purple';
      }

      return turf.point(station.location.geometry.coordinates, {
        name: station.station,
        color: color
      });
    }));
  }

  const refreshMetarData = async () => {
    if (!mapRef.current) {
      return;
    }

    const center = mapRef.current?.getCenter();
    if (center && weatherStationRepositoryRef.current) {
      const centerPoint = turf.point([center.lng, center.lat]);
      await weatherStationRepositoryRef.current.refreshByRadius(centerPoint.geometry, 250);

      const metarSource = mapRef.current.getSource('metar');
      if (metarSource) {
        (metarSource as mapboxgl.GeoJSONSource).setData(metarFeatureCollection());
      }
    }
  };

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';
    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        center: [4.5, 52],
        zoom: 7,
        style: 'mapbox://styles/mapbox/light-v11'
      });

      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'metar-popup'
      });
    }

    refreshTimerRef.current = setInterval(async () => {
      await refreshMetarData();
      // await refreshAerodomeData();
    }, 60_000);

    mapRef.current?.on('moveend', refreshMetarData);

    mapRef.current?.on('load', async () => {
      mapRef.current?.addControl(new mapboxgl.NavigationControl());
      mapRef.current?.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
      );

      mapRef.current?.addSource('png-tiles', {
        'type': 'raster',
        'tiles': [
          'https://nwy-tiles-api.prod.newaydata.com/tiles/{z}/{x}/{y}.png?path=2413/aero/latest'
        ],
        'tileSize': 256
      });

      mapRef.current?.addLayer({
        'id': 'png-tile-layer',
        'type': 'raster',
        'source': 'png-tiles',
        'paint': {
          'raster-opacity': 1.0
        }
      });

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
          'text-field': ['concat', ['to-string', ['round', ['get', 'trueTrack']]], '°'],
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

          const station = weatherStationRepositoryRef.current?.stations.find(
            s => s.station === stationName
          );

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

      await refreshMetarData();
    });

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      mapRef.current?.remove()
    }
  }, []);

  const updateUrlWithRouteParams = () => {
    const queryParams = new URLSearchParams();
    if (routeForm.aircraft) queryParams.set('aircraft', routeForm.aircraft);
    if (routeForm.departure) queryParams.set('departure', routeForm.departure);
    if (routeForm.arrival) queryParams.set('arrival', routeForm.arrival);
    if (routeForm.alternate) queryParams.set('alternate', routeForm.alternate);
    if (routeForm.via) queryParams.set('via', routeForm.via);
    if (departureDate) queryParams.set('date', departureDate);
    if (departureTime) queryParams.set('time', departureTime);

    window.history.replaceState({}, '', `${window.location.pathname}?${queryParams.toString()}`);
  };

  const handleCreateRoute = async () => {
    setIsRouteLoading(true);

    try {
      const airplane = aircraft.find(aircraft => aircraft.registration === routeForm.aircraft);
      const routeWaypointDep = await parseRouteString(airportRepository, [], routeForm.departure);
      const routeWaypointArr = await parseRouteString(airportRepository, [], routeForm.arrival);
      const routeWaypointAlt = routeForm.alternate !== '' ? await parseRouteString(airportRepository, [], routeForm.alternate) : [];
      const routeWaypointVia = routeForm.via !== '' ? await parseRouteString(airportRepository, [], routeForm.via) : [];

      updateUrlWithRouteParams();

      if (weatherStationRepositoryRef.current) {
        const waypoints = [
          ...routeWaypointDep,
          ...routeWaypointVia,
          ...routeWaypointArr,
          ...routeWaypointAlt
        ]; //, weatherStationRepositoryRef.current, airplane

        for (const waypoint of waypoints) {
          if (waypoint instanceof Aerodrome) {
            const metarStation = await weatherStationRepositoryRef.current.findByICAO(waypoint.ICAO);
            if (metarStation) {
              waypoint.metarStation = metarStation;
            } else {
              const nearestStation = await weatherStationRepositoryRef.current.nearestStation(waypoint.location.geometry);
              if (nearestStation) {
                waypoint.metarStation = nearestStation;
              }
            }
          }
          // TODO: If it's a reporting point, find the nearest METAR station
          // TODO: If it's a waypoint, find the nearest METAR station
        };

        const routeOptions = {
          altitude: 1500,
          departureTime: new Date(),
          aircraft: airplane,
        };

        const rp = routePlan(waypoints, routeOptions);
        setRouteTrip(rp);
        setShowRouteLog(true);

        const aerodromes = waypoints.filter((waypoint, index, self) => waypoint instanceof Aerodrome && index === self.findIndex(w => (w as Aerodrome).ICAO === waypoint.ICAO));
        setAerodrome(aerodromes as Aerodrome[]);

        if (mapRef.current?.isStyleLoaded() && waypoints.length > 0) {
          const routeSource = mapRef.current.getSource('route');
          if (routeSource) {
            const routePlanGeoJSON = turf.featureCollection(rp.route.map(leg => {
              return turf.lineString([leg.start.location.geometry.coordinates, leg.end.location.geometry.coordinates], {
                start: leg.start.name,
                end: leg.end.name,
                distance: Math.round(leg.distance),
                trueTrack: Math.round(leg.trueTrack),
                // TODO: Add more properties
              });
            }));
            (routeSource as mapboxgl.GeoJSONSource).setData(routePlanGeoJSON);
          }

          const routeWaypointGeoJSON = turf.featureCollection(waypoints.map(waypoint => {
            return turf.point(waypoint.location.geometry.coordinates, {
              name: waypoint.toString(),
            });
          }));

          const waypointSource = mapRef.current.getSource('waypoint');
          if (waypointSource) {
            (waypointSource as mapboxgl.GeoJSONSource).setData(routeWaypointGeoJSON);
          }

          const geobbox = turf.bbox(routeWaypointGeoJSON).slice(0, 4) as [number, number, number, number];

          mapRef.current?.fitBounds(geobbox, {
            padding: {
              left: 500,
              top: 100,
              right: 100,
              bottom: 100
            }
          });
        }
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
                <div className="text-lg font-semibold">{routeTrip?.totalDuration ? `${Math.round(routeTrip?.totalDuration)}m` : '-'}</div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Fuel Consumption</span>
                <div className="text-lg font-semibold">{routeTrip?.totalFuelConsumption ? `${Math.round(routeTrip?.totalFuelConsumption)} L` : '-'}</div>
              </div>
            </div>

            <div className="flex items-center space-x-6">

              {/* Flight Times */}
              {/* <div className="flex flex-col justify-center space-y-1">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ETD: </span>
                  {new Date().toISOString().substring(11, 16)}Z
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">ETA: </span>
                  {routeTrip?.totalDuration ? `${new Date(new Date().getTime() + routeTrip.totalDuration * 60000).toISOString().substring(11, 16)}Z` : '-'}
                </div>
              </div> */}

              {/* Divider */}
              <div className="h-8 w-px bg-gray-200"></div>

              {/* Sun Times */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Sunrise className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-gray-600">{timeData.sunrise.time} LT</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sunset className="w-5 h-5 text-amber-500" />
                  <span className="text-sm text-gray-600">{timeData.sunset.time} LT</span>
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

          {aerodrome.map((aerodrome) => (
            <AerodromeCard key={aerodrome.ICAO} data={aerodrome} />
          ))}

          {/* {metarData.map((station) => (
            <StandaloneMetarCard key={station.station} data={station} />
          ))} */}
        </div>
      </div>
    </div>
  );
};

export default FlightPlanner;
