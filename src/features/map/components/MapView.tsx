import { CloudRain, Waves } from 'lucide-react';
import { FlightPlan, NavPoint, Waypoint } from '../../../types';
import { PerformanceStrip, VectorMap } from './Visualizers';

interface MapViewProps {
  flightPlan: FlightPlan;
  metarStations: NavPoint[];
  routeDist: number;
  routeTime: number;
  fuelTotal: number;
  navLogUpdated: Date | null;
  onWaypointMove: (index: number | 'DEP' | 'ARR', lat: number, lon: number) => void;
  onWaypointUpdate: (index: number, updates: Partial<Waypoint>) => void;
  onAddWaypoint: (lat: number, lon: number) => void;
  onSelectMetarStation: (point: NavPoint, tab?: 'INFO' | 'WX' | 'NOTAM') => void;
  onUpdateMetarStations: (bounds: { center: { lat: number; lon: number }; zoom: number }) => void;
  onToggleRadar: () => void;
  onToggleTurb: () => void;
  showRadar: boolean;
  showTurb: boolean;
}

export default function MapView({
  flightPlan,
  metarStations,
  routeDist,
  routeTime,
  fuelTotal,
  navLogUpdated,
  onWaypointMove,
  onWaypointUpdate,
  onAddWaypoint,
  onSelectMetarStation,
  onUpdateMetarStations,
  onToggleRadar,
  onToggleTurb,
  showRadar,
  showTurb,
}: MapViewProps) {
  return (
    <main className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
      <PerformanceStrip
        dist={routeDist}
        ete={`${Math.floor(routeTime / 60)}:${(routeTime % 60).toString().padStart(2, '0')}`}
        fuel={fuelTotal}
        reserve={flightPlan.reserveType.replace('_', ' ')}
        lastUpdated={navLogUpdated}
      />

      <div className="flex-1 relative z-10">
        <VectorMap
          flightPlan={flightPlan}
          airports={metarStations}
          onWaypointMove={onWaypointMove}
          onWaypointUpdate={onWaypointUpdate}
          onAddWaypoint={onAddWaypoint}
          onSelectMetarStation={onSelectMetarStation}
          onUpdateMetarStations={onUpdateMetarStations}
        />

        <div className="absolute top-3 right-3 z-20">
          <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl shadow-xl overflow-hidden">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Overlays</div>

            <button
              onClick={onToggleRadar}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${showRadar ? 'text-emerald-400 bg-slate-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <CloudRain size={14} />
              <span>Weather Radar</span>
            </button>

            <button
              onClick={onToggleTurb}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${showTurb ? 'text-amber-400 bg-slate-800' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Waves size={14} />
              <span>Turbulence</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
