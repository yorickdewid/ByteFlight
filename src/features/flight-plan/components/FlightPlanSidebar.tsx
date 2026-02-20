import { FileText, Pencil, Plus, PlusCircle, RotateCcw, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { AltitudeInput, Button, Input, PanelBox, WaypointInput } from '../../../components/ui';
import { AircraftProfile, FlightPlan, NavPoint, SavedRoute } from '../../../types';

interface FlightPlanSidebarProps {
  flightPlan: FlightPlan;
  aircraftProfiles: AircraftProfile[];
  routes: SavedRoute[];
  activeRouteId: string;
  onUpdateFlightPlan: (updater: (prev: FlightPlan) => FlightPlan) => void;
  onPointChange: (type: 'departure' | 'arrival' | 'alternate', val: string) => void;
  onOpenNavLog: () => void;
  onOpenAircraftManager: () => void;
  onCreateRoute: () => void;
  onSwitchRoute: (id: string) => void;
  onDeleteRoute: (id: string) => void;
  onClearRoute: () => void;
  onRenameRoute: (id: string, name: string) => void;
}

export default function FlightPlanSidebar({
  flightPlan,
  aircraftProfiles,
  routes,
  activeRouteId,
  onUpdateFlightPlan,
  onPointChange,
  onOpenNavLog,
  onOpenAircraftManager,
  onCreateRoute,
  onSwitchRoute,
  onDeleteRoute,
  onClearRoute,
  onRenameRoute,
}: FlightPlanSidebarProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeRoute = routes.find(r => r.id === activeRouteId);

  const startRename = () => {
    if (!activeRoute) return;
    setRenameValue(activeRoute.name);
    setIsRenaming(true);
    // Focus after render
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const commitRename = () => {
    if (renameValue.trim() && activeRoute) {
      onRenameRoute(activeRoute.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  return (
    <aside className="w-80 bg-slate-900/50 border-r border-slate-800/50 flex flex-col z-20 backdrop-blur-sm">
      {/* Route Management Bar */}
      <div className="p-3 border-b border-slate-800/50">
        <div className="flex items-center gap-2">
          <select
            className="flex-1 bg-slate-800/50 border border-slate-700/50 text-slate-200 text-xs py-1.5 px-2 rounded-md focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow truncate"
            value={activeRouteId}
            onChange={e => onSwitchRoute(e.target.value)}
          >
            {routes.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>

          <button
            onClick={onCreateRoute}
            title="New Route"
            className="p-1.5 text-sky-500 hover:text-sky-400 hover:bg-sky-500/10 rounded-md transition-colors"
          >
            <Plus size={14} />
          </button>

          <button
            onClick={onClearRoute}
            title="Clear Route"
            className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={() => activeRoute && onDeleteRoute(activeRoute.id)}
            title="Delete Route"
            disabled={routes.length <= 1}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-slate-500 disabled:hover:bg-transparent"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* Editable route name */}
        <div className="mt-1.5 flex items-center gap-1.5 min-h-[24px]">
          {isRenaming ? (
            <input
              ref={renameInputRef}
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setIsRenaming(false);
              }}
              className="flex-1 bg-slate-800 border border-sky-500/50 text-slate-200 text-xs py-0.5 px-1.5 rounded focus:outline-none font-medium"
            />
          ) : (
            <button
              onClick={startRename}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors group"
              title="Rename route"
            >
              <span className="font-medium truncate max-w-[220px]">{activeRoute?.name || 'Untitled'}</span>
              <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>
      </div>

      <PanelBox title="Flight Parameters" className="flex-shrink-0 border-x-0 border-t-0 rounded-none bg-transparent">
        <div className="space-y-5">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">Aircraft</label>
              <button onClick={onOpenAircraftManager} className="text-[10px] text-sky-500 hover:text-sky-400 font-bold uppercase tracking-wider transition-colors">Manage Fleet</button>
            </div>
            <select
              className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm py-2 px-3 rounded-lg focus:ring-1 focus:ring-sky-500 focus:border-sky-500 outline-none transition-shadow"
              value={flightPlan.aircraftId}
              onChange={e => {
                const ac = aircraftProfiles.find(p => p.id === e.target.value);
                if (ac) onUpdateFlightPlan(prev => ({ ...prev, aircraftId: e.target.value, aircraft: ac }));
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
              onChange={e => onUpdateFlightPlan(p => ({ ...p, dateTime: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700/50 text-slate-200 text-sm rounded-lg p-2 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <Input label="Cruise Altitude (ft)" value={flightPlan.cruiseAltitude} type="number" onChange={e => onUpdateFlightPlan(p => ({ ...p, cruiseAltitude: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </PanelBox>

      <PanelBox title="Route Points" className="flex-1 border-x-0 border-t-0 rounded-none bg-transparent pt-0">
        <div className="space-y-4 relative">
          <div className="absolute left-[15px] top-8 bottom-8 w-px border-l border-dashed border-slate-700/50"></div>

          <div className="relative pl-8">
            <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-slate-900 z-10 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <Input placeholder="ICAO" value={flightPlan.departure.id} onChange={e => onPointChange('departure', e.target.value)} />
          </div>

          {flightPlan.waypoints.map((wp, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 relative pl-8 group">
              <div className="absolute left-[10px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-600 z-10 group-hover:bg-sky-400 group-hover:scale-125 transition-all"></div>

              <div className="flex-1 flex bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden group-focus-within:border-sky-500/50 transition-colors">
                <WaypointInput
                  value={wp.id?.startsWith('wp-') ? (wp.name || '') : wp.id}
                  onChange={text => onUpdateFlightPlan(p => ({ ...p, waypoints: p.waypoints.map((w, j) => j === i ? { ...w, name: text, id: text } : w) }))}
                  onResolve={(point: NavPoint) => onUpdateFlightPlan(p => ({
                    ...p,
                    waypoints: p.waypoints.map((w, j) => j === i ? { ...point, alt: w.alt, type: point.type || 'WAYPOINT' } : w),
                  }))}
                />

                <div className="w-px bg-slate-700/30"></div>

                <AltitudeInput
                  value={wp.alt}
                  onChange={(newAlt) => onUpdateFlightPlan(p => ({ ...p, waypoints: p.waypoints.map((w, j) => j === i ? { ...w, alt: newAlt } : w) }))}
                  className="w-16 bg-transparent text-right text-xs font-mono text-sky-400 focus:outline-none placeholder-slate-700 py-1.5 px-2"
                  placeholder="ALT/FL"
                />
              </div>

              <button onClick={() => onUpdateFlightPlan(p => ({ ...p, waypoints: p.waypoints.filter((_, j) => j !== i) }))} className="text-slate-600 hover:text-red-400 ml-1 transition-colors p-1.5 hover:bg-slate-800 rounded-md"><Trash2 size={14} /></button>
            </div>
          ))}

          <div className="pl-8">
            <button
              onClick={() => onUpdateFlightPlan(p => {
                // Interpolate midpoint between last route point and arrival
                const lastPoint = p.waypoints.length > 0 ? p.waypoints[p.waypoints.length - 1] : p.departure;
                const nextPoint = p.arrival;
                const lat = (lastPoint.lat + nextPoint.lat) / 2;
                const lon = (lastPoint.lon + nextPoint.lon) / 2;
                return { ...p, waypoints: [...p.waypoints, { id: `wp-sidebar-${Date.now()}`, name: '', lat, lon, alt: p.cruiseAltitude || 1500, type: 'WAYPOINT' as const }] };
              })}
              className="text-[10px] flex items-center gap-1.5 text-sky-500 hover:text-sky-400 font-bold transition-all uppercase tracking-wide py-1 px-2 rounded hover:bg-sky-500/10 -ml-2"
            >
              <PlusCircle size={14} /> Add Waypoint
            </button>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-slate-900 z-10 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <Input placeholder="ICAO" value={flightPlan.arrival.id} onChange={e => onPointChange('arrival', e.target.value)} />
          </div>

          <div className="relative pl-8 pt-4 mt-2 border-t border-slate-800/30">
            <div className="absolute left-[11px] top-8 w-1.5 h-1.5 rotate-45 border border-slate-500 z-10"></div>
            <Input label="Alternate" placeholder="ICAO" value={flightPlan.alternate?.id || ''} onChange={e => onPointChange('alternate', e.target.value)} />
          </div>
        </div>
      </PanelBox>

      <div className="p-4 bg-slate-900/80 mt-auto border-t border-slate-800/50 backdrop-blur-md">
        <Button className="w-full py-2.5 text-sm font-bold shadow-sky-900/20 shadow-lg" variant="active" icon={FileText} onClick={onOpenNavLog}>View NavLog</Button>
      </div>
    </aside>
  );
}
