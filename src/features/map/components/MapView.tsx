import { FlightPlan, NavPoint, Waypoint } from '../../../types';
import { PerformanceStrip, VectorMap } from './Visualizers';

interface MapViewProps {
  flightPlan: FlightPlan;
  focusPoint: { lat: number; lon: number; token: number } | null;
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
}

export default function MapView({
  flightPlan,
  focusPoint,
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
          focusPoint={focusPoint}
          airports={metarStations}
          onWaypointMove={onWaypointMove}
          onWaypointUpdate={onWaypointUpdate}
          onAddWaypoint={onAddWaypoint}
          onSelectMetarStation={onSelectMetarStation}
          onUpdateMetarStations={onUpdateMetarStations}
        />

      </div>
    </main>
  );
}
