import { useState, useEffect, useMemo } from 'react';
import { Plane, Loader2 } from 'lucide-react';

import { mockInitialFlightPlan, mockNavData } from './constants';
import { AircraftProfile, FlightPlan, NavPoint, Notam, WeatherCell, Waypoint } from './types';
import { calculateDistance, fetchMockWeather } from './utils';
import { ApiService } from './services/api';

import Header from './components/Header';
import FlightPlanSidebar from './components/FlightPlanSidebar';
import MapView from './components/MapView';
import IntelligencePanel from './components/IntelligencePanel';
import { NavLogModal, WeightBalanceModal, AircraftManagerModal, SettingsModal, ChangePasswordModal } from './components/Modals';
import { SystemAlert } from './components/UI';

export default function App() {
  // --- Application State ---
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [aircraftProfiles, setAircraftProfiles] = useState<AircraftProfile[]>([]);

  const [flightPlan, setFlightPlan] = useState<FlightPlan>(() => {
    try {
      const saved = localStorage.getItem('byteflight_plan');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration/Safety check: Ensure aircraft object exists if we have data from older version
        if (!parsed.aircraft || !parsed.aircraft.fuelBurn) {
          return mockInitialFlightPlan;
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse saved plan", e);
    }
    return mockInitialFlightPlan;
  });

  // UI State
  const [selectedPoint, setSelectedPoint] = useState<NavPoint | null>(null);
  const [selectedPointMetar, setSelectedPointMetar] = useState<string | null>(null);
  const [selectedPointNotams, setSelectedPointNotams] = useState<Notam[]>([]);
  const [sidebarTab, setSidebarTab] = useState<'INFO' | 'WX' | 'NOTAM'>('INFO');

  // Modals
  const [isNavLogOpen, setIsNavLogOpen] = useState(false);
  const [isWbOpen, setIsWbOpen] = useState(false);
  const [isAircraftManagerOpen, setIsAircraftManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isLogoutAlertOpen, setIsLogoutAlertOpen] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NavPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // System
  const [time, setTime] = useState(new Date());
  const [favorites, setFavorites] = useState(['EHRD']);

  // Weather Layers
  const [weatherLayers, setWeatherLayers] = useState<WeatherCell[]>([]);
  const [showRadar, setShowRadar] = useState(false);
  const [showTurb, setShowTurb] = useState(false);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [centerMapTrigger, setCenterMapTrigger] = useState(0);

  // --- Effects ---

  // Initial Load
  useEffect(() => {
    const init = async () => {
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

        // Load initial data for default selected point if any
        // For beta we hardcode loading EHRD details initially to show something
        const initialPoint = await ApiService.getNavPointDetail('EHRD');
        if (initialPoint) {
          setSelectedPoint(initialPoint);
          refreshPointData(initialPoint.id);
        }

      } catch (e) {
        console.error("Failed to initialize app", e);
      } finally {
        setIsAppLoading(false);
      }
    };
    init();
  }, []);

  // Persistence (Plan only - Fleet is now managed via API)
  useEffect(() => { localStorage.setItem('byteflight_plan', JSON.stringify(flightPlan)); }, [flightPlan]);

  // Clock
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // Weather Fetching Loop
  useEffect(() => {
    if (showRadar || showTurb) {
      const fetchWx = async () => {
        setIsWeatherLoading(true);
        const data = await fetchMockWeather(flightPlan.departure.lat, flightPlan.departure.lon);
        setWeatherLayers(data);
        setIsWeatherLoading(false);
      };
      fetchWx();
      const interval = setInterval(fetchWx, 10000);
      return () => clearInterval(interval);
    } else {
      setWeatherLayers([]);
    }
  }, [showRadar, showTurb, flightPlan.departure]);

  // --- Helpers ---

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
    setSearchResults([]);
    setSearchQuery('');

    // Fetch dynamic data
    refreshPointData(fullPoint.id);
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  const routeDist = useMemo(() => {
    let d = 0;
    const pts = [flightPlan.departure, ...flightPlan.waypoints, flightPlan.arrival].filter(p => p.lat);
    for (let i = 0; i < pts.length - 1; i++) d += calculateDistance(pts[i].lat, pts[i].lon, pts[i + 1].lat, pts[i + 1].lon);
    return d;
  }, [flightPlan]);

  const routeTime = Math.round((routeDist / flightPlan.aircraft.cruiseSpeed) * 60);

  const fuelCalcs = useMemo(() => {
    const trip = Math.round((routeTime / 60) * flightPlan.aircraft.fuelBurn);
    const cont = Math.ceil(trip * 0.05);
    const reserveMins = flightPlan.reserveType === 'VFR_NIGHT' ? 45 : 30;
    const res = Math.round((reserveMins / 60) * flightPlan.aircraft.fuelBurn);
    const taxi = 4;
    return { trip, cont, res, total: trip + cont + res + taxi };
  }, [routeTime, flightPlan.aircraft, flightPlan.reserveType]);

  // Get all airports with METAR from mock data for the map
  const metarStations = useMemo(() => {
    return Object.values(mockNavData).filter(p => p.type === 'AIRPORT' && p.metar);
  }, []);

  // --- Handlers ---

  const handlePointChange = async (type: 'departure' | 'arrival' | 'alternate', val: string) => {
    const icao = val.toUpperCase();
    // Optimistic update
    setFlightPlan(p => ({ ...p, [type]: { ...p[type], icao } }));

    // Async lookup to fill coordinates
    if (icao.length >= 3) {
      const pt = await ApiService.getNavPointDetail(icao);
      if (pt) {
        setFlightPlan(p => ({ ...p, [type]: pt }));
        setCenterMapTrigger(prev => prev + 1);
      }
    }
  };

  const handleAddWaypoint = (point: NavPoint) => {
    setFlightPlan(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, {
        ...point,
        id: `wp-${Date.now()}`,
        name: point.id,
        lat: point.lat,
        lon: point.lon,
        type: point.type,
        alt: prev.cruiseAltitude
      }]
    }));
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toUpperCase();
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }

    setIsSearching(true);
    const results = await ApiService.lookupNavPoint(q);
    setSearchResults(results);
    setIsSearching(false);
  };

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

  const handleSignOut = () => {
    // In a real app, clear tokens, context, etc.
    // For mock: just refresh or alert
    window.location.reload();
  };

  // Map Interaction Handlers
  const handleMapWaypointMove = (index: number | 'DEP' | 'ARR', lat: number, lon: number) => {
    setFlightPlan(prev => {
      if (index === 'DEP') {
        return { ...prev, departure: { ...prev.departure, lat, lon } };
      } else if (index === 'ARR') {
        return { ...prev, arrival: { ...prev.arrival, lat, lon } };
      } else {
        const newWps = [...prev.waypoints];
        if (newWps[index]) {
          newWps[index] = { ...newWps[index], lat, lon };
          return { ...prev, waypoints: newWps };
        }
        return prev;
      }
    });
  };

  const handleMapWaypointUpdate = (index: number, updates: Partial<Waypoint>) => {
    setFlightPlan(prev => {
      const newWps = [...prev.waypoints];
      if (newWps[index]) {
        newWps[index] = { ...newWps[index], ...updates };
      }
      return { ...prev, waypoints: newWps };
    });
  };

  const handleMapAddWaypoint = (lat: number, lon: number) => {
    setFlightPlan(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, {
        id: `wp-map-${Date.now()}`,
        name: 'USER WP',
        lat, lon,
        type: 'WAYPOINT',
        alt: prev.cruiseAltitude
      }]
    }));
  };


  if (isAppLoading) {
    return (
      <div className="h-screen w-full bg-slate-950 flex items-center justify-center flex-col gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-900/20 shadow-lg animate-bounce">
          <Plane size={24} className="text-white fill-current" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <div className="flex items-center gap-2 text-sky-500 font-mono text-sm">
          <Loader2 className="animate-spin" size={16} /> Initializing Systems...
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden selection:bg-sky-500/30 selection:text-sky-100">
      <Header
        searchQuery={searchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        time={time}
        onSearchChange={handleSearch}
        onSelectPoint={handleSelectPoint}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenPasswordModal={() => setIsPasswordModalOpen(true)}
        onOpenLogoutAlert={() => setIsLogoutAlertOpen(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        <FlightPlanSidebar
          flightPlan={flightPlan}
          aircraftProfiles={aircraftProfiles}
          onUpdateFlightPlan={setFlightPlan}
          onPointChange={handlePointChange}
          onOpenNavLog={() => setIsNavLogOpen(true)}
          onOpenAircraftManager={() => setIsAircraftManagerOpen(true)}
        />

        <MapView
          flightPlan={flightPlan}
          selectedPoint={selectedPoint}
          weatherLayers={weatherLayers}
          metarStations={metarStations}
          routeDist={routeDist}
          routeTime={routeTime}
          fuelTotal={fuelCalcs.total}
          isWeatherLoading={isWeatherLoading}
          onCenterMap={() => setCenterMapTrigger(t => t + 1)}
          onWaypointMove={handleMapWaypointMove}
          onWaypointUpdate={handleMapWaypointUpdate}
          onAddWaypoint={handleMapAddWaypoint}
          onToggleRadar={() => setShowRadar(!showRadar)}
          onToggleTurb={() => setShowTurb(!showTurb)}
          showRadar={showRadar}
          showTurb={showTurb}
        />

        <IntelligencePanel
          selectedPoint={selectedPoint}
          selectedPointMetar={selectedPointMetar}
          selectedPointNotams={selectedPointNotams}
          favorites={favorites}
          onAddWaypoint={handleAddWaypoint}
          onToggleFavorite={toggleFavorite}
        />
      </div>

      <SystemAlert
        isOpen={isLogoutAlertOpen}
        type="warning"
        title="Sign Out"
        message="Are you sure you want to sign out? Your current flight plan will be saved locally."
        onConfirm={handleSignOut}
        onCancel={() => setIsLogoutAlertOpen(false)}
        confirmLabel="Sign Out"
      />

      {isNavLogOpen && <NavLogModal flightPlan={flightPlan} aircraft={flightPlan.aircraft} onClose={() => setIsNavLogOpen(false)} />}
      {isWbOpen && <WeightBalanceModal aircraft={flightPlan.aircraft} payload={flightPlan.payload} onClose={() => setIsWbOpen(false)} onUpdatePayload={(pl) => setFlightPlan(p => ({ ...p, payload: pl }))} />}
      {isAircraftManagerOpen && <AircraftManagerModal isOpen={isAircraftManagerOpen} aircraftList={aircraftProfiles} onClose={() => setIsAircraftManagerOpen(false)} onSave={handleSaveAircraft} onDelete={handleDeleteAircraft} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} fuelPolicy={flightPlan.reserveType} onSetFuelPolicy={(type) => setFlightPlan(p => ({ ...p, reserveType: type }))} />}
      {isPasswordModalOpen && <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} />}
    </div>
  );
}
