import { CloudRain, Waves, RefreshCw, MapPin } from 'lucide-react';
import { FlightPlan, NavPoint, WeatherCell, Waypoint } from '../../../types';
import { PerformanceStrip, VectorMap } from './Visualizers';

interface MapViewProps {
  flightPlan: FlightPlan;
  selectedPoint: NavPoint | null;
  weatherLayers: WeatherCell[];
  metarStations: NavPoint[];
  routeDist: number;
  routeTime: number;
  fuelTotal: number;
  isWeatherLoading: boolean;
  onWaypointMove: (index: number | 'DEP' | 'ARR', lat: number, lon: number) => void;
  onWaypointUpdate: (index: number, updates: Partial<Waypoint>) => void;
  onAddWaypoint: (lat: number, lon: number) => void;
  onToggleRadar: () => void;
  onToggleTurb: () => void;
  showRadar: boolean;
  showTurb: boolean;
}

export default function MapView({
  flightPlan,
  selectedPoint,
  weatherLayers,
  metarStations,
  routeDist,
  routeTime,
  fuelTotal,
  isWeatherLoading,
  onWaypointMove,
  onWaypointUpdate,
  onAddWaypoint,
  onToggleRadar,
  onToggleTurb,
  showRadar,
  showTurb,
}: MapViewProps) {
  return (
    <main className="flex-1 relative bg-[#0f172a] flex flex-col overflow-hidden">
      <PerformanceStrip
        dist={routeDist}
        ete={`${Math.floor(routeTime / 60)}:${(routeTime % 60).toString().padStart(2, '0')}`}
        fuel={fuelTotal}
        reserve={flightPlan.reserveType.replace('_', ' ')}
      />

      <div className="flex-1 relative z-10">
        <VectorMap
          flightPlan={flightPlan}
          selectedPoint={selectedPoint}
          weatherLayers={weatherLayers}
          airports={metarStations}
          showRadar={showRadar}
          showTurb={showTurb}
          onWaypointMove={onWaypointMove}
          onWaypointUpdate={onWaypointUpdate}
          onAddWaypoint={onAddWaypoint}
        />

        <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-700/50 rounded-xl p-2 flex flex-col gap-2 shadow-2xl">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-2 py-1">Overlays</div>

            <button
              onClick={onToggleRadar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${showRadar ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-800'}`}
            >
              <CloudRain size={16} className={showRadar ? "text-emerald-400" : "text-slate-500"} />
              <span>Weather Radar</span>
              {isWeatherLoading && showRadar && <RefreshCw size={12} className="animate-spin ml-auto text-emerald-500" />}
            </button>

            <button
              onClick={onToggleTurb}
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
  );
}
