import { useRef, useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
// import * as turf from '@turf/turf';
// import { AerodromeService } from '../services/aerodrome';

interface UseMapOptions {
  initialLocation?: { lat: number; lon: number; zoom: number };
  onMoveEnd?: (map: mapboxgl.Map) => void;
}

export const useMap = ({
  initialLocation = { lat: 51.926517, lon: 4.462456, zoom: 7 },
  onMoveEnd
}: UseMapOptions = {}) => {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  const [currentLocation, setCurrentLocation] = useState(() => {
    const savedLocation = localStorage.getItem('currentLocation');
    if (savedLocation) {
      try {
        return JSON.parse(savedLocation);
      } catch (error) {
        console.error('Failed to parse saved location:', error);
      }
    }
    return initialLocation;
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [currentLocation.lon, currentLocation.lat],
      zoom: currentLocation.zoom,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.on('load', () => {
      setIsMapLoaded(true);
    });

    if (onMoveEnd) {
      map.on('moveend', () => {
        const center = map.getCenter();
        const zoom = map.getZoom();

        const newLocation = {
          lat: center.lat,
          lon: center.lng,
          zoom: zoom
        };

        localStorage.setItem('currentLocation', JSON.stringify(newLocation));
        setCurrentLocation(newLocation);

        onMoveEnd(map);
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  };

  const updateMapSource = (
    sourceName: string,
    featureCollection: GeoJSON.FeatureCollection
  ) => {
    if (!mapRef.current || !isMapLoaded) return;

    const source = mapRef.current.getSource(sourceName) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(featureCollection);
    }
  };

  return {
    mapRef,
    mapContainerRef,
    popupRef,
    currentLocation,
    setCurrentLocation,
    isMapLoaded,
    initializeMap,
    updateMapSource
  };
};