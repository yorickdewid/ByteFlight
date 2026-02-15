import { Compass, LocateFixed, Map as MapIcon, MousePointer2, Plus, ZoomIn, ZoomOut } from 'lucide-react';
import mapboxgl from 'mapbox-gl';
import React, { useEffect, useRef, useState } from 'react';
import { MAPBOX_TOKEN } from '../../../lib/config';
import { FlightPlan, NavPoint, Waypoint } from '../../../types';

// Import mapbox-gl CSS inline for proper styling
import 'mapbox-gl/dist/mapbox-gl.css';

interface VectorMapProps {
  flightPlan: FlightPlan;
  airports: NavPoint[];
  onWaypointMove: (index: number | 'DEP' | 'ARR', lat: number, lon: number) => void;
  onWaypointUpdate: (index: number, updates: Partial<Waypoint>) => void;
  onAddWaypoint: (lat: number, lon: number) => void;
  onSelectMetarStation: (point: NavPoint, tab?: 'INFO' | 'WX' | 'NOTAM') => void;
  onUpdateMetarStations: (bounds: { center: { lat: number; lon: number }; zoom: number }) => void;
}

export const VectorMap: React.FC<VectorMapProps> = ({
  flightPlan,
  airports,
  onWaypointMove,
  onWaypointUpdate,
  onAddWaypoint,
  onSelectMetarStation,
  onUpdateMetarStations
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draggedPoint = useRef<{ type: string, index: number } | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      if (!MAPBOX_TOKEN) {
        setMapError('Mapbox token not configured. Set VITE_MAPBOX_TOKEN in .env.local');
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (!mapboxgl.supported()) {
        setMapError('WebGL not supported');
        return;
      }

      // Restore last map position, or default to departure airport
      const savedPosition = (() => {
        try {
          const raw = localStorage.getItem('byteflight_map_position');
          if (!raw) return null;
          const { center, zoom } = JSON.parse(raw);
          if (Array.isArray(center) && center.length === 2 && typeof zoom === 'number') {
            return { center: center as [number, number], zoom };
          }
        } catch { /* corrupt data, ignore */ }
        return null;
      })();

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: savedPosition?.center ?? [flightPlan.departure.lon, flightPlan.departure.lat],
        zoom: savedPosition?.zoom ?? 9,
        attributionControl: false,
      });

      const m = map.current;

      m.on('load', () => {
        // --- Sources ---
        m.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        m.addSource('waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

        // Source for METAR Stations
        m.addSource('metar-stations', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });

        // --- Layers ---

        // 1. Route Line (Aviation magenta)
        m.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#E946EF', 'line-width': 3, 'line-dasharray': [2, 1] }
        });

        // 2. Waypoint Circles (On top of route)
        m.addLayer({
          id: 'waypoints-circle',
          type: 'circle',
          source: 'waypoints',
          paint: {
            'circle-radius': 6,
            'circle-color': [
              'match',
              ['get', 'type'],
              'DEP', '#10b981',
              'ARR', '#ef4444',
              '#38bdf8'
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#0f172a'
          }
        });

        // 3. Waypoint Labels
        m.addLayer({
          id: 'waypoints-label',
          type: 'symbol',
          source: 'waypoints',
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#e2e8f0',
            'text-halo-color': '#0f172a',
            'text-halo-width': 2
          }
        });

        // 4. METAR Dots (Circles) — on top so weather is always visible
        // Green (VFR), Blue (MVFR), Yellow (IFR), Purple (LIFR)
        m.addLayer({
          id: 'metar-dots-circle',
          type: 'circle',
          source: 'metar-stations',
          paint: {
            'circle-radius': 9,
            'circle-color': [
              'match',
              ['get', 'category'],
              'VFR', '#22c55e',
              'MVFR', '#3b82f6',
              'IFR', '#eab308',
              'LIFR', '#a855f7',
              '#64748b' // Default
            ],
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff'
          }
        });

        // 5. METAR Dots (Text Symbols V, M, I, L)
        m.addLayer({
          id: 'metar-dots-label',
          type: 'symbol',
          source: 'metar-stations',
          layout: {
            'text-field': [
              'match',
              ['get', 'category'],
              'VFR', 'V',
              'MVFR', 'M',
              'IFR', 'I',
              'LIFR', 'L',
              '?'
            ],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 11,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#ffffff'
          }
        });

        // --- Interaction: Dragging ---
        m.on('mouseenter', 'waypoints-circle', (e) => {
          const features = m.queryRenderedFeatures(e.point, { layers: ['waypoints-circle'] });
          const isDraggable = features.length > 0 && features[0].properties?.draggable;
          m.getCanvas().style.cursor = isDraggable ? 'move' : 'pointer';
        });
        m.on('mouseleave', 'waypoints-circle', () => m.getCanvas().style.cursor = '');

        m.on('mouseenter', 'metar-dots-circle', () => m.getCanvas().style.cursor = 'pointer');
        m.on('mouseleave', 'metar-dots-circle', () => m.getCanvas().style.cursor = '');

        m.on('mousedown', 'waypoints-circle', (e) => {
          const features = m.queryRenderedFeatures(e.point, { layers: ['waypoints-circle'] });
          if (features.length) {
            const feature = features[0];
            const props = feature.properties as { type: string, index: number, draggable: boolean };
            if (!props.draggable) return; // Named waypoint — don't allow drag
            e.preventDefault();
            m.dragPan.disable();
            draggedPoint.current = { type: props.type, index: props.index };
          }
        });

        m.on('mousemove', (e) => {
          if (!draggedPoint.current) return;
          const lngLat = e.lngLat;
          const source: any = m.getSource('waypoints');
          const data = source._data;

          if (data && data.features) {
            const feature = data.features.find((f: any) => {
              const p = f.properties;
              return p.type === draggedPoint.current?.type && p.index === draggedPoint.current?.index;
            });

            if (feature) {
              feature.geometry.coordinates = [lngLat.lng, lngLat.lat];
              source.setData(data);
              const routeSource: any = m.getSource('route');
              const routeData = routeSource._data;
              if (routeData && routeData.features[0]) {
                let coordIndex = 0;
                if (draggedPoint.current.type === 'DEP') coordIndex = 0;
                else if (draggedPoint.current.type === 'ARR') coordIndex = routeData.features[0].geometry.coordinates.length - 1;
                else coordIndex = draggedPoint.current.index + 1;
                routeData.features[0].geometry.coordinates[coordIndex] = [lngLat.lng, lngLat.lat];
                routeSource.setData(routeData);
              }
            }
          }
        });

        m.on('mouseup', (e) => {
          if (draggedPoint.current) {
            m.dragPan.enable();
            const { type, index } = draggedPoint.current;
            const { lng, lat } = e.lngLat;
            const targetIndex = type === 'DEP' ? 'DEP' : (type === 'ARR' ? 'ARR' : index);
            onWaypointMove(targetIndex, lat, lng);
            draggedPoint.current = null;
          }
        });

        // --- Interaction: Click (waypoints and METAR) ---
        m.on('click', (e) => {
          if (draggedPoint.current) return;

          // 1. Check Waypoints
          const wpFeatures = m.queryRenderedFeatures(e.point, { layers: ['waypoints-circle'] });
          if (wpFeatures.length > 0) {
            const f = wpFeatures[0];
            const props = f.properties as any;
            if (props.type === 'WP') {
              const div = document.createElement('div');
              div.innerHTML = `
                                <div class="flex flex-col gap-2 min-w-[150px]">
                                    <label class="text-xs font-bold text-slate-400">WAYPOINT</label>
                                    <input id="popup-name" value="${props.name}" class="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-500" />
                                    <div class="flex items-center gap-2">
                                        <input id="popup-alt" type="text" value="${props.alt}" class="w-24 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-sky-500" placeholder="ALT/FL" />
                                        <span class="text-xs text-slate-500">FT</span>
                                    </div>
                                    <button id="popup-save" class="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-1 px-2 rounded mt-1">Update</button>
                                </div>
                            `;
              if (f.geometry.type === 'Point') {
                const popup = new mapboxgl.Popup({ closeButton: false, offset: 10 }).setLngLat(f.geometry.coordinates as [number, number]).setDOMContent(div).addTo(m);
                div.querySelector('#popup-save')?.addEventListener('click', () => {
                const newName = (div.querySelector('#popup-name') as HTMLInputElement).value;
                const altStr = (div.querySelector('#popup-alt') as HTMLInputElement).value;
                let newAlt = 0;
                const clean = altStr.toUpperCase().replace(/\s/g, '');
                if (clean.startsWith('FL')) {
                  const fl = parseInt(clean.replace('FL', ''), 10);
                  newAlt = isNaN(fl) ? 0 : fl * 100;
                } else { newAlt = parseInt(clean, 10) || 0; }
                onWaypointUpdate(props.index, { name: newName, alt: newAlt });
                popup.remove();
              });
              }
            }
            return;
          }

          // 2. Check METAR Dots
          const metarFeatures = m.queryRenderedFeatures(e.point, { layers: ['metar-dots-circle'] });
          if (metarFeatures.length > 0) {
            const f = metarFeatures[0];
            const props = f.properties as any;
            const metar = props.metar;
            const cat = props.category;

            // Update sidebar with selected METAR station
            if (f.geometry.type === 'Point') {
              const coords = f.geometry.coordinates as [number, number];
              const station: NavPoint = {
                type: 'AIRPORT',
                id: props.name,
                name: props.name,
                lat: coords[1],
                lon: coords[0],
                metar: metar
              };
              onSelectMetarStation(station, 'WX');
            }

            // Also show quick popup
            const colorClass = cat === 'VFR' ? 'text-emerald-400' : cat === 'MVFR' ? 'text-blue-400' : cat === 'IFR' ? 'text-yellow-400' : 'text-purple-400';

            if (f.geometry.type === 'Point') {
              new mapboxgl.Popup({ closeButton: false, offset: 10, className: 'metar-popup' })
                .setLngLat(f.geometry.coordinates as [number, number])
                .setHTML(`
                                <div class="max-w-[200px]">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="font-bold text-white text-sm">${props.name}</span>
                                        <span class="text-xs font-bold ${colorClass}">${cat}</span>
                                    </div>
                                    <p class="text-[10px] text-slate-400 font-mono leading-tight">${metar}</p>
                                </div>
                            `)
                .addTo(m);
            }
            return;
          }
        });

        // --- Interaction: Double-click to add waypoint ---
        m.on('dblclick', (e) => {
          if (draggedPoint.current) return;

          // Don't add waypoint if clicking on existing features
          const wpFeatures = m.queryRenderedFeatures(e.point, { layers: ['waypoints-circle'] });
          const metarFeatures = m.queryRenderedFeatures(e.point, { layers: ['metar-dots-circle'] });

          if (wpFeatures.length > 0 || metarFeatures.length > 0) {
            return; // Don't add waypoint on feature double-click
          }

          // Add waypoint at double-click location
          onAddWaypoint(e.lngLat.lat, e.lngLat.lng);
        });

        // Signal that map is ready for data
        setMapLoaded(true);

        // Initial METAR station load
        const center = m.getCenter();
        const zoom = m.getZoom();
        onUpdateMetarStations({ center: { lat: center.lat, lon: center.lng }, zoom });
      });

      // Update METAR stations when map moves/zooms + persist position
      m.on('moveend', () => {
        if (!m) return;
        const center = m.getCenter();
        const zoom = m.getZoom();
        onUpdateMetarStations({ center: { lat: center.lat, lon: center.lng }, zoom });
        localStorage.setItem('byteflight_map_position', JSON.stringify({
          center: [center.lng, center.lat],
          zoom,
        }));
      });

      m.on('error', (e) => {
        console.error("Mapbox error:", e);
      });

    } catch (err) {
      console.error("Failed to initialize map:", err);
      setMapError(err instanceof Error ? err.message : 'Map failed to load');
    }

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Sources
  useEffect(() => {
    // Wait for mapLoaded (set after on('load') fires) - style is guaranteed loaded then
    if (!map.current || !mapLoaded) return;

    // Route & Waypoints
    const pts = [flightPlan.departure, ...flightPlan.waypoints, flightPlan.arrival];
    const routeCoords = pts.map(p => [p.lon, p.lat]);

    const routeSource = map.current.getSource('route') as mapboxgl.GeoJSONSource;
    if (routeSource) {
      routeSource.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeCoords }
        }]
      });
    }

    // User-placed waypoints (wp-map-*, wp-sidebar-*) are draggable; named navaids are not
    const isUserWaypoint = (id: string) => id.startsWith('wp-');

    const pointFeatures = pts.map((p, i) => {
      let type = 'WP';
      let index = -1;
      let draggable = false;
      if (i === 0) type = 'DEP';
      else if (i === pts.length - 1) type = 'ARR';
      else { type = 'WP'; index = i - 1; draggable = isUserWaypoint(p.id); }
      return {
        type: 'Feature',
        properties: { type, index, name: p.id, alt: (p as Waypoint).alt || 0, draggable },
        geometry: { type: 'Point', coordinates: [p.lon, p.lat] }
      };
    });

    const wpSource = map.current.getSource('waypoints') as mapboxgl.GeoJSONSource;
    if (wpSource) {
      wpSource.setData({
        type: 'FeatureCollection',
        features: pointFeatures as any
      });
    }

    // Update METAR Stations
    const stationFeatures = airports
      .filter(a => a.flightCategory)
      .map(a => ({
        type: 'Feature',
        properties: {
          name: a.id,
          metar: a.metar,
          category: a.flightCategory,
        },
        geometry: {
          type: 'Point',
          coordinates: [a.lon, a.lat],
        },
      }));

    const metarSource = map.current.getSource('metar-stations') as mapboxgl.GeoJSONSource;
    if (metarSource) {
      metarSource.setData({
        type: 'FeatureCollection',
        features: stationFeatures as any
      });
    }

  }, [flightPlan, airports, mapLoaded]);

  // Camera centering removed - re-center button calls flyTo directly

  if (mapError) {
    return (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center text-red-400">
        <p>Map Error: {mapError}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="w-full h-full bg-slate-900" />

      <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-30">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-1.5 flex flex-col gap-1 shadow-xl">
          <button onClick={() => map.current?.zoomIn()} className="p-2.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors" title="Zoom in"><ZoomIn size={18} /></button>
          <button onClick={() => map.current?.zoomOut()} className="p-2.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors" title="Zoom out"><ZoomOut size={18} /></button>
          <div className="h-px bg-slate-700/50 my-1 mx-2"></div>
          <button
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (pos) => map.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 10 }),
                () => { /* user denied or unavailable — silently ignore */ }
              );
            }}
            className="p-2.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors"
            title="My location"
          >
            <LocateFixed size={18} />
          </button>
          <button onClick={() => map.current?.flyTo({ center: [flightPlan.departure.lon, flightPlan.departure.lat], zoom: 9 })} className="p-2.5 hover:bg-slate-700 text-sky-400 hover:text-sky-300 rounded-lg transition-colors" title="Re-center on departure"><Compass size={18} /></button>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-full px-4 py-1.5 text-xs font-medium text-slate-400 z-30 shadow-lg flex items-center gap-2">
        <MapIcon size={14} className="text-sky-500" />
        <span>Mapbox VFR (Mock)</span>
      </div>

      <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-lg p-2 text-xs text-slate-400 z-30 shadow-lg max-w-[200px]">
        <p className="flex items-center gap-2 mb-1"><MousePointer2 size={12} className="text-sky-500" /> Drag points to move</p>
        <p className="flex items-center gap-2"><Plus size={12} className="text-emerald-500" /> Double-click map to add WP</p>
      </div>
    </div>
  );
};

interface RunwayVisualizerProps {
  runwayHeading: number;
  windDir: number;
  windSpeed: number;
  runwayId: string;
}

export const RunwayVisualizer: React.FC<RunwayVisualizerProps> = ({ runwayHeading, windDir, windSpeed, runwayId }) => {
  if (windDir === undefined || runwayHeading === undefined || windSpeed === undefined) return null;
  const angleDiffRad = (windDir - runwayHeading) * (Math.PI / 180);
  const headwind = Math.round(windSpeed * Math.cos(angleDiffRad));
  const crosswind = Math.round(windSpeed * Math.sin(angleDiffRad));

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative w-40 h-40 my-2">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {/* Compass Rose - Cleaner */}
          <circle cx="100" cy="100" r="95" fill="#1e293b" stroke="#334155" strokeWidth="1" />
          {/* Ticks */}
          {Array.from({ length: 36 }).map((_, i) => {
            const angle = i * 10;
            const rad = (angle - 90) * (Math.PI / 180);
            const isMajor = i % 9 === 0;
            const len = isMajor ? 12 : 6;
            const x1 = 100 + (95 - len) * Math.cos(rad);
            const y1 = 100 + (95 - len) * Math.sin(rad);
            const x2 = 100 + 95 * Math.cos(rad);
            const y2 = 100 + 95 * Math.sin(rad);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? "#94a3b8" : "#475569"} strokeWidth={isMajor ? 2 : 1} />
          })}
          {['N', 'E', 'S', 'W'].map((t, i) => {
            const angle = i * 90;
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 100 + 70 * Math.cos(rad);
            const y = 100 + 70 * Math.sin(rad);
            return <text key={t} x={x} y={y + 5} textAnchor="middle" fill={i === 0 ? "#38bdf8" : "#94a3b8"} fontSize="14" fontWeight="600">{t}</text>
          })}
          {/* Runway - Softer rounded rect */}
          <g transform={`rotate(${runwayHeading}, 100, 100)`}>
            <rect x="86" y="30" width="28" height="140" rx="4" fill="#475569" stroke="#334155" strokeWidth="1" />
            <line x1="100" y1="35" x2="100" y2="165" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="8 6" />
            <text x="100" y="52" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" transform={`rotate(${-runwayHeading}, 100, 52)`}>{runwayId}</text>
          </g>
          {/* Wind Vector - Arrow style */}
          <g transform={`rotate(${windDir}, 100, 100)`}>
            <line x1="100" y1="35" x2="100" y2="195" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
            <path d="M100 65 L92 40 L108 40 Z" fill="#0ea5e9" stroke="#0ea5e9" strokeWidth="1" />
            <rect x="98.5" y="10" width="3" height="30" fill="#0ea5e9" rx="1" />
          </g>
          <circle cx="100" cy="100" r="4" fill="#e2e8f0" stroke="#1e293b" strokeWidth="2" />
        </svg>
      </div>
      <div className="grid grid-cols-2 gap-x-6 w-full text-[11px] mt-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
        <div className="text-slate-400 font-medium">Headwind</div>
        <div className={`text-right font-mono font-bold ${headwind < 0 ? 'text-red-400' : 'text-emerald-400'}`}>{headwind} KT</div>
        <div className="text-slate-400 font-medium">Crosswind</div>
        <div className={`text-right font-mono font-bold ${Math.abs(crosswind) > 15 ? 'text-red-400' : 'text-slate-200'}`}>{Math.abs(crosswind)} KT</div>
      </div>
    </div>
  );
};

export const PerformanceStrip: React.FC<{ dist: number; ete: string; fuel: number; reserve: string; lastUpdated?: Date | null }> = ({ dist, ete, fuel, reserve, lastUpdated }) => {
  // Relative freshness — re-computed each render (useClock in App.tsx ticks every 1s)
  const freshness = (() => {
    if (!lastUpdated) return null;
    const mins = Math.floor((Date.now() - lastUpdated.getTime()) / 60_000);
    if (mins < 1) return 'just now';
    return `${mins}m ago`;
  })();

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-full shadow-2xl p-1">
      <div className="px-5 py-2 flex flex-col items-center min-w-[90px] rounded-l-full hover:bg-white/5 transition-colors">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distance</span>
        <span className="text-base font-bold text-white">{dist} <span className="text-[10px] text-slate-500 font-medium">NM</span></span>
      </div>
      <div className="w-px bg-slate-700/50 h-8"></div>
      <div className="px-5 py-2 flex flex-col items-center min-w-[90px] hover:bg-white/5 transition-colors">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ETE</span>
        <span className="text-base font-bold text-white">{ete}</span>
      </div>
      <div className="w-px bg-slate-700/50 h-8"></div>
      <div className="px-5 py-2 flex flex-col items-center min-w-[90px] hover:bg-white/5 transition-colors">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Fuel</span>
        <div className="flex flex-col items-center">
          <span className="text-base font-bold text-sky-400">{fuel} <span className="text-[10px] text-sky-600 font-medium">L</span></span>
        </div>
      </div>
      <div className="w-px bg-slate-700/50 h-8"></div>
      <div className="px-4 py-2 flex flex-col items-center min-w-[70px] bg-slate-900/40 rounded-r-full">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reserve</span>
        <span className="text-xs font-semibold text-slate-300">{reserve}</span>
      </div>
      {freshness && (
        <>
          <div className="w-px bg-slate-700/50 h-8"></div>
          <div className="px-4 py-2 flex flex-col items-center min-w-[60px] rounded-r-full">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Updated</span>
            <span className="text-xs font-semibold text-slate-400">{freshness}</span>
          </div>
        </>
      )}
    </div>
  );
};
