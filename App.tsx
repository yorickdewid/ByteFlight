import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plane, Clock, Search, MapPin, Trash2, PlusCircle, FileText, Scale, Star,
  Wind, Eye, Cloud, Gauge, Activity, CloudDrizzle, Signal, AlertTriangle, ChevronDown,
  CloudRain, Waves, RefreshCw, Loader2, User, LogOut, Key, Sliders, Info, FileWarning
} from 'lucide-react';

import { mockInitialFlightPlan, mockNavData, APP_VERSION } from './constants';
import { AircraftProfile, FlightPlan, NavPoint, Notam, WeatherCell, Waypoint } from './types';
import { calculateDistance, parseMetar, fetchMockWeather } from './utils';
import { ApiService } from './services/api';

import { Button, Input, PanelBox, MetarTile, AltitudeInput, SystemAlert } from './components/UI';
import { VectorMap, PerformanceStrip, RunwayVisualizer } from './components/Visualizers';
import { AircraftManagerModal, WeightBalanceModal, NavLogModal, SettingsModal, ChangePasswordModal } from './components/Modals';

const ActiveRunway: React.FC<{ airport: NavPoint, metar: string | null }> = ({ airport, metar }) => {
  if (!airport || !metar) return null;
  const m = parseMetar(metar);
  if (!m.wind.dir && m.wind.dir !== 0) return <div className="text-xs italic text-slate-500 p-2">Wind Calm/Unknown</div>;

  let best = null, minDiff = 180;
  if (airport.runways) {
    airport.runways.forEach(r => {
      const diff = Math.abs(m.wind.dir - r.trueHeading);
      const norm = diff > 180 ? 360 - diff : diff;
      if (norm < minDiff) { minDiff = norm; best = r; }
    });
  }

  if (!best) return null;
  return (
    <div className="bg-slate-800/40 p-4 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-colors">
      <div className="flex justify-between items-center mb-3 px-1 border-b border-slate-700/50 pb-3">
        <div>
          <span className="text-base font-bold text-white block tracking-tight">RWY {best.id}</span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-900/20 px-1.5 py-0.5 rounded-full border border-emerald-900/30">Active</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-300 block font-medium">{best.length}m</span>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">{best.surface}</span>
        </div>
      </div>
      <RunwayVisualizer runwayHeading={best.trueHeading} windDir={m.wind.dir} windSpeed={m.wind.speed} runwayId={best.id} />
    </div>
  )
};

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

  // Menus
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  // Close profile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

      {/* 1. Header */}
      <header className="h-16 bg-slate-900/95 border-b border-slate-800/60 flex items-center px-6 shrink-0 relative z-30 shadow-lg backdrop-blur-sm">
        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-900/20 shadow-lg">
            <Plane size={18} className="text-white fill-current" style={{ transform: 'rotate(-45deg)' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white tracking-tight leading-none">ByteFlight</span>
            <span className="text-[10px] text-sky-500 font-medium uppercase tracking-wider leading-none mt-1">Flight Planning {APP_VERSION}</span>
          </div>
        </div>

        <div className="flex justify-center w-full max-w-md">
          <div className="relative w-full">
            <div className="absolute left-3 top-2.5 flex items-center pointer-events-none">
              {isSearching ? <Loader2 className="text-sky-500 animate-spin w-4 h-4" /> : <Search className="text-slate-400 w-4 h-4" />}
            </div>
            <input
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search Airport, VOR, or Waypoint..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 placeholder-slate-500 transition-all shadow-inner"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 shadow-2xl z-50 rounded-xl overflow-hidden p-1">
                {searchResults.map(a => (
                  <div key={a.id} onClick={() => handleSelectPoint(a)} className="p-3 hover:bg-slate-700/50 cursor-pointer flex justify-between text-sm rounded-lg transition-colors group">
                    <span className="font-bold text-sky-400 font-mono group-hover:text-sky-300">{a.id}</span>
                    <span className="text-slate-400 group-hover:text-slate-200">{a.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-end gap-5">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
            <Clock size={14} className="text-sky-500" />
            <span className="text-slate-200 font-mono font-bold text-sm tracking-tight">{time.toISOString().substring(11, 16)} <span className="text-[10px] text-slate-500">UTC</span></span>
          </div>

          {/* Profile Menu Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer transition-all select-none
                        ${isProfileMenuOpen
                  ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/30'
                  : 'bg-sky-900/30 text-sky-500 border-sky-500/20 hover:bg-sky-500 hover:text-white'
                }`}
            >
              YW
            </div>

            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-800/20">
                  <p className="text-sm font-bold text-white">Yorick de Wid</p>
                  <p className="text-xs text-slate-500 truncate">pilot@byteflight.app</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setIsSettingsOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                  >
                    <Sliders size={16} className="text-slate-400" /> Preferences
                  </button>
                  <button
                    onClick={() => { setIsPasswordModalOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                  >
                    <Key size={16} className="text-slate-400" /> Change Password
                  </button>
                </div>
                <div className="border-t border-slate-800/50 py-1">
                  <button
                    onClick={() => { setIsLogoutAlertOpen(true); setIsProfileMenuOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Main Workbench */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANE: Flight Plan */}
        <aside className="w-80 bg-slate-900/50 border-r border-slate-800/50 flex flex-col z-20 backdrop-blur-sm">
          <PanelBox title="Flight Parameters" className="flex-shrink-0 border-x-0 border-t-0 rounded-none bg-transparent">
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-400">Aircraft</label>
                  <button onClick={() => setIsAircraftManagerOpen(true)} className="text-[10px] text-sky-500 hover:text-sky-400 font-bold uppercase tracking-wider transition-colors">Manage Fleet</button>
                </div>
                <select
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm py-2 px-3 rounded-lg focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
                  value={flightPlan.aircraftId}
                  onChange={e => {
                    const ac = aircraftProfiles.find(p => p.id === e.target.value);
                    if (ac) setFlightPlan(prev => ({ ...prev, aircraftId: e.target.value, aircraft: ac }));
                  }}
                >
                  {aircraftProfiles.length === 0 && <option>Loading Fleet...</option>}
                  {aircraftProfiles.map(p => <option key={p.id} value={p.id}>{p.id} - {p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">Block Off Time (Z)</label>
                <input
                  type="datetime-local"
                  value={flightPlan.dateTime}
                  onChange={e => setFlightPlan(p => ({ ...p, dateTime: e.target.value }))}
                  className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <Input label="Cruise Altitude (ft)" value={flightPlan.cruiseAltitude} type="number" onChange={e => setFlightPlan(p => ({ ...p, cruiseAltitude: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
          </PanelBox>

          <PanelBox title="Route Points" className="flex-1 border-x-0 border-t-0 rounded-none bg-transparent pt-0">
            <div className="space-y-4 relative">
              {/* Dashed route line */}
              <div className="absolute left-[15px] top-8 bottom-8 w-px border-l border-dashed border-slate-700/50"></div>

              <div className="relative pl-8">
                <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-slate-900 z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                <Input placeholder="ICAO" value={flightPlan.departure.icao} onChange={e => handlePointChange('departure', e.target.value)} />
              </div>

              {flightPlan.waypoints.map(wp => (
                <div key={wp.id} className="flex items-center gap-2 mb-2 relative pl-8 group">
                  <div className="absolute left-[10px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-600 z-10 group-hover:bg-sky-400 group-hover:scale-125 transition-all"></div>

                  <div className="flex-1 flex bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden group-focus-within:border-sky-500/50 transition-colors">
                    <input
                      value={wp.name}
                      onChange={e => setFlightPlan(p => ({ ...p, waypoints: p.waypoints.map(w => w.id === wp.id ? { ...w, name: e.target.value } : w) }))}
                      className="flex-1 bg-transparent text-sm py-1.5 px-3 text-slate-200 focus:outline-none placeholder-slate-600 font-medium"
                      placeholder="WAYPOINT"
                    />

                    <div className="w-px bg-slate-700/30"></div>

                    <AltitudeInput
                      value={wp.alt}
                      onChange={(newAlt) => setFlightPlan(p => ({ ...p, waypoints: p.waypoints.map(w => w.id === wp.id ? { ...w, alt: newAlt } : w) }))}
                      className="w-16 bg-transparent text-right text-xs font-mono text-sky-400 focus:outline-none placeholder-slate-700 py-1.5 px-2"
                      placeholder="ALT/FL"
                    />
                  </div>

                  <button onClick={() => setFlightPlan(p => ({ ...p, waypoints: p.waypoints.filter(w => w.id !== wp.id) }))} className="text-slate-600 hover:text-red-400 ml-1 transition-colors p-1.5 hover:bg-slate-800 rounded-md"><Trash2 size={14} /></button>
                </div>
              ))}

              <div className="pl-8">
                <button
                  onClick={() => setFlightPlan(p => ({ ...p, waypoints: [...p.waypoints, { id: Date.now().toString(), name: 'NEW WP', lat: 0, lon: 0, alt: 1500, type: 'WAYPOINT' }] }))}
                  className="text-[10px] flex items-center gap-1.5 text-sky-500 hover:text-sky-400 font-bold transition-all uppercase tracking-wide py-1 px-2 rounded hover:bg-sky-500/10 -ml-2"
                >
                  <PlusCircle size={14} /> Add Waypoint
                </button>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-slate-900 z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                <Input placeholder="ICAO" value={flightPlan.arrival.icao} onChange={e => handlePointChange('arrival', e.target.value)} />
              </div>

              <div className="relative pl-8 pt-4 mt-2 border-t border-slate-800/30">
                <div className="absolute left-[11px] top-8 w-1.5 h-1.5 rotate-45 border border-slate-500 z-10"></div>
                <Input label="Alternate" placeholder="ICAO" value={flightPlan.alternate?.icao || ''} onChange={e => handlePointChange('alternate', e.target.value)} />
              </div>
            </div>
          </PanelBox>

          <div className="p-4 bg-slate-900/80 mt-auto border-t border-slate-800/50 backdrop-blur-md">
            <Button className="w-full py-2.5 text-sm font-bold shadow-sky-900/20 shadow-lg" variant="active" icon={FileText} onClick={() => setIsNavLogOpen(true)}>Generate NavLog</Button>
          </div>
        </aside>

        {/* CENTER PANE: MAP */}
        <main className="flex-1 relative bg-[#0f172a] flex flex-col overflow-hidden">
          <PerformanceStrip
            dist={routeDist}
            ete={`${Math.floor(routeTime / 60)}:${(routeTime % 60).toString().padStart(2, '0')}`}
            fuel={fuelCalcs.total}
            reserve={flightPlan.reserveType.replace('_', ' ')}
          />

          {/* VECTOR MAP ENGINE */}
          <div className="flex-1 relative z-10">
            <VectorMap
              flightPlan={flightPlan}
              selectedPoint={selectedPoint}
              weatherLayers={weatherLayers}
              airports={metarStations}
              showRadar={showRadar}
              showTurb={showTurb}
              onCenterMap={() => setCenterMapTrigger(t => t + 1)}
              onWaypointMove={handleMapWaypointMove}
              onWaypointUpdate={handleMapWaypointUpdate}
              onAddWaypoint={handleMapAddWaypoint}
            />

            {/* Layer Controls - Improved look */}
            <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-2 flex flex-col gap-2 shadow-2xl">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1">Overlays</div>

                <button
                  onClick={() => setShowRadar(!showRadar)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${showRadar ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}
                >
                  <CloudRain size={16} className={showRadar ? "text-emerald-400" : "text-slate-500"} />
                  <span>Weather Radar</span>
                  {isWeatherLoading && showRadar && <RefreshCw size={12} className="animate-spin ml-auto text-emerald-500" />}
                </button>

                <button
                  onClick={() => setShowTurb(!showTurb)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${showTurb ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}
                >
                  <Waves size={16} className={showTurb ? "text-amber-400" : "text-slate-500"} />
                  <span>Turbulence</span>
                  {isWeatherLoading && showTurb && <RefreshCw size={12} className="animate-spin ml-auto text-amber-500" />}
                </button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 bg-slate-900/80 border border-slate-700/50 px-3 py-1.5 rounded-full text-[10px] font-mono font-medium text-slate-400 flex gap-4 z-20 backdrop-blur-sm shadow-lg">
            <span className="flex items-center gap-2"><MapPin size={12} className="text-sky-500" /> 51.9525 N</span>
            <span className="flex items-center gap-2"><MapPin size={12} className="text-sky-500" /> 004.4347 E</span>
          </div>
        </main>

        {/* RIGHT PANE: INTELLIGENCE */}
        <aside className="w-96 bg-slate-900/50 border-l border-slate-800/50 flex flex-col z-20 backdrop-blur-sm">
          {selectedPoint ? (
            <>
              {/* Fixed Header */}
              <div className="p-5 border-b border-slate-800/50 bg-slate-800/20 shrink-0">
                <div className="flex justify-between items-start mb-1">
                  <h1 className="text-3xl font-bold text-white tracking-tight font-sans">{selectedPoint.id}</h1>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddWaypoint(selectedPoint)}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-sky-500/20 flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors"
                      title="Add to Route"
                    >
                      <PlusCircle size={18} />
                    </button>
                    <button
                      onClick={() => toggleFavorite(selectedPoint.id)}
                      className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                    >
                      <Star size={18} className={favorites.includes(selectedPoint.id) ? "fill-amber-400 text-amber-400" : "text-slate-400 hover:text-amber-400"} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-slate-400 font-medium truncate mb-4">{selectedPoint.name}</p>

                {/* Tab Navigation */}
                <div className="grid grid-cols-3 gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800/50">
                  {['INFO', 'WX', 'NOTAM'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setSidebarTab(tab as any)}
                      className={`text-[10px] font-bold py-1.5 rounded-md transition-all uppercase tracking-wide ${sidebarTab === tab
                        ? 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">

                {/* TAB: INFO */}
                {sidebarTab === 'INFO' && (
                  <>
                    {/* General Data */}
                    <div className="flex justify-between items-center text-[11px] font-medium bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                      {selectedPoint.elevation !== null ? (
                        <span className="text-slate-400 flex items-center gap-2"><ChevronDown size={14} className="text-slate-500" /> ELEV <span className="text-white font-mono">{selectedPoint.elevation}</span> FT</span>
                      ) : (
                        <span className="text-slate-500 italic">Elevation Unknown</span>
                      )}

                      {selectedPoint.type === 'AIRPORT' && selectedPoint.sunset && (
                        <span className="text-amber-500 flex items-center gap-2"><Clock size={14} /> SUNSET {selectedPoint.sunset}Z</span>
                      )}
                    </div>

                    {/* Active Runway */}
                    {selectedPoint.type === 'AIRPORT' && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1"><Activity size={14} className="text-emerald-500" /> Active Runway</h4>
                        <ActiveRunway airport={selectedPoint} metar={selectedPointMetar} />
                      </div>
                    )}

                    {/* Comms / Frequencies */}
                    {selectedPoint.frequencies && selectedPoint.frequencies.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 pl-1"><Signal size={14} className="text-violet-500" /> {selectedPoint.type === 'VOR' ? 'NAV FREQ' : 'COMMS'}</h4>
                        <div className="flex flex-col gap-2">
                          {selectedPoint.frequencies.map(f => (
                            <div key={f.frequency} className="flex justify-between items-center px-4 py-3 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:bg-slate-800/60 transition-colors">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{f.type}</span>
                              <span className="text-sm font-mono text-white font-bold">{f.frequency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedPoint.type !== 'AIRPORT' && !selectedPoint.frequencies && (
                      <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                        No additional information available for this waypoint.
                      </div>
                    )}
                  </>
                )}

                {/* TAB: WX */}
                {sidebarTab === 'WX' && (
                  <>
                    {selectedPointMetar ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><CloudDrizzle size={14} className="text-sky-500" /> {selectedPoint.type === 'AIRPORT' ? 'METAR' : `NEAREST (${selectedPoint.nearestMetarStation})`}</h4>
                          <span className="text-[10px] text-slate-600 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">LIVE</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {(() => {
                            const m = parseMetar(selectedPointMetar);
                            return (
                              <>
                                <MetarTile label="Wind" value={`${m.wind.dir.toString().padStart(3, '0')}° / ${m.wind.speed}`} subtext="KNOTS" icon={Wind} iconColor="text-teal-400" color="slate" />
                                <MetarTile label="Visibility" value={m.vis >= 10000 ? '10+' : (m.vis / 1000).toFixed(1)} subtext="KM" icon={Eye} color={m.vis < 5000 ? 'amber' : 'slate'} iconColor="text-indigo-400" />
                                <MetarTile label="Ceiling" value={m.ceiling.type} subtext={`@ ${m.ceiling.altitude} FT`} icon={Cloud} iconColor="text-sky-400" />
                                <MetarTile label="QNH" value={m.qnh} subtext="HPA" icon={Gauge} iconColor="text-amber-400" />
                              </>
                            )
                          })()}
                        </div>
                        <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 leading-relaxed break-all shadow-inner">
                          {selectedPointMetar}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                        <CloudDrizzle size={32} className="mb-3 opacity-20" />
                        <p className="text-xs">No Weather Data Available</p>
                      </div>
                    )}
                  </>
                )}

                {/* TAB: NOTAMS */}
                {sidebarTab === 'NOTAM' && (
                  <>
                    {selectedPoint.type === 'AIRPORT' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center px-1">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14} className="text-amber-500" /> Active Notices</h4>
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-900/10 px-2 py-0.5 rounded-full border border-amber-900/30">{selectedPointNotams.length}</span>
                        </div>
                        {selectedPointNotams.length > 0 ? (
                          <div className="space-y-3">
                            {selectedPointNotams.map(n => (
                              <div key={n.id} className="p-3 bg-slate-800/40 border-l-2 border-amber-500/50 text-xs text-slate-400 leading-relaxed rounded-r-xl hover:bg-slate-800/60 transition-colors">
                                <span className="font-bold text-amber-500 block mb-1.5">{n.id}</span>
                                {n.text}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                            <Info size={24} className="mb-2 opacity-30" />
                            <p className="text-xs">No active NOTAMs found.</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <FileWarning size={32} className="mb-3 opacity-20" />
                        <p className="text-xs text-center max-w-[200px]">NOTAMs are typically only available for Aerodromes.</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                <MapPin size={32} className="text-slate-700" />
              </div>
              <h3 className="text-sm font-bold text-slate-400 mb-1">No Point Selected</h3>
              <p className="text-xs text-slate-500 max-w-[180px]">Select an airport or waypoint from the map or search to view details.</p>
            </div>
          )}
        </aside>
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
