import { FileText, FolderOpen, Pencil, Plus, PlusCircle, Route, SlidersHorizontal, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { AltitudeInput, Button, Input, PanelBox, WaypointInput } from '../../../components/ui';
import { AircraftProfile, FlightPlan, NavPoint, SavedRoute } from '../../../types';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function routeSummary(plan: FlightPlan): string {
  const dep = plan.departure?.id || '—';
  const arr = plan.arrival?.id || '—';
  const wps = plan.waypoints?.length || 0;
  return `${dep} → ${arr}${wps > 0 ? ` · ${wps} WPT` : ''}`;
}

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
  onRenameRoute,
}: FlightPlanSidebarProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [isRouteListOpen, setIsRouteListOpen] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const activeRoute = routes.find(r => r.id === activeRouteId);

  const startRename = () => {
    if (!activeRoute) return;
    setRenameValue(activeRoute.name);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.focus(), 0);
  };

  const commitRename = () => {
    if (renameValue.trim() && activeRoute) {
      onRenameRoute(activeRoute.id, renameValue.trim());
    }
    setIsRenaming(false);
  };

  const handleSwitchRoute = (id: string) => {
    onSwitchRoute(id);
    setIsRouteListOpen(false);
  };

  const handleCreateRoute = () => {
    onCreateRoute();
    setIsRouteListOpen(false);
  };

  return (
    <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col z-20 relative">
      {/* Active Route Header */}
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-1.5 min-h-[48px]">
        <div className="flex-1 min-w-0">
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
              className="w-full bg-slate-800/50 border border-sky-500 text-slate-200 text-sm py-0.5 px-2 rounded-lg focus:outline-none font-semibold"
            />
          ) : (
            <button
              onClick={startRename}
              className="flex items-center gap-1.5 group max-w-full"
              title="Rename route"
            >
              <span className="text-sm font-semibold text-slate-200 truncate">{activeRoute?.name || 'Untitled'}</span>
              <Pencil size={11} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          )}
        </div>

        <button
          onClick={onCreateRoute}
          title="New route"
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors flex-shrink-0"
        >
          <Plus size={15} />
        </button>

        <button
          onClick={() => setIsRouteListOpen(!isRouteListOpen)}
          title="Saved routes"
          className={`px-1.5 py-1.5 rounded-md transition-colors flex-shrink-0 flex items-center gap-1 ${
            isRouteListOpen
              ? 'text-sky-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FolderOpen size={15} />
          <span className="text-[10px] font-mono tabular-nums">{routes.length}</span>
        </button>
      </div>

      {/* Saved Routes Panel */}
      {isRouteListOpen && (
        <div className="absolute inset-0 z-30 bg-slate-900 flex flex-col">
          <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between min-h-[48px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Saved Routes <span className="text-slate-600 font-mono ml-1">{routes.length}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={handleCreateRoute}
                className="px-2 py-1 text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded-md transition-colors text-[11px] font-semibold flex items-center gap-1"
              >
                <Plus size={13} />
                New
              </button>
              <button
                onClick={() => setIsRouteListOpen(false)}
                title="Close"
                className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {routes.map(route => {
              const isActive = route.id === activeRouteId;
              return (
                <div
                  key={route.id}
                  onClick={() => !isActive && handleSwitchRoute(route.id)}
                  className={`group rounded-lg border px-3 py-2.5 transition-colors ${
                    isActive
                      ? 'border-sky-500/30 bg-sky-500/10 cursor-default'
                      : 'border-transparent hover:bg-slate-800/60 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold truncate ${isActive ? 'text-sky-300' : 'text-slate-300'}`}>
                      {route.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {formatRelativeTime(route.updatedAt)}
                      </span>
                      {!isActive && (
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteRoute(route.id);
                          }}
                          title="Delete route"
                          className="p-1 text-slate-600 hover:text-red-400 hover:bg-slate-800 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate flex items-center gap-1.5">
                    <span className="flex items-center gap-0.5 shrink-0" aria-hidden>
                      <span className="w-1.5 h-1.5 rounded-full border border-emerald-500"></span>
                      <span className="w-3 border-t border-dashed border-slate-600"></span>
                      <span className="w-1.5 h-1.5 rounded-full border border-red-500"></span>
                    </span>
                    {routeSummary(route.flightPlan)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <PanelBox title="Flight Parameters" icon={SlidersHorizontal} className="flex-shrink-0 border-x-0 border-t-0 rounded-none bg-transparent">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-baseline mb-1.5">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Aircraft</label>
              <button onClick={onOpenAircraftManager} className="text-[11px] text-sky-400 hover:text-sky-300 font-medium transition-colors">Manage fleet</button>
            </div>
            <select
              className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm py-2 px-3 rounded-lg focus:border-sky-500 outline-none transition-colors"
              value={flightPlan.aircraftId}
              onChange={e => {
                const ac = aircraftProfiles.find(p => p.id === e.target.value);
                if (ac) onUpdateFlightPlan(prev => ({ ...prev, aircraftId: e.target.value, aircraft: ac }));
              }}
            >
              {aircraftProfiles.length === 0 && <option>Loading fleet...</option>}
              {aircraftProfiles.map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Block Off Time (Z)</label>
            <input
              type="datetime-local"
              value={flightPlan.dateTime}
              onChange={e => onUpdateFlightPlan(p => ({ ...p, dateTime: e.target.value }))}
              className="w-full bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-lg p-2 focus:border-sky-500 focus:outline-none font-mono transition-colors"
            />
          </div>
          <div>
            <Input label="Cruise Altitude (ft)" mono value={flightPlan.cruiseAltitude} type="number" onChange={e => onUpdateFlightPlan(p => ({ ...p, cruiseAltitude: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
      </PanelBox>

      <PanelBox title="Route" icon={Route} className="flex-1 border-x-0 border-t-0 rounded-none bg-transparent pt-0">
        <div className="space-y-4 relative">
          <div className="absolute left-[15px] top-8 bottom-8 w-px border-l border-dashed border-slate-700"></div>

          <div className="relative pl-8">
            <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-slate-900 z-10 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <Input placeholder="ICAO" mono value={flightPlan.departure.id} onChange={e => onPointChange('departure', e.target.value)} />
          </div>

          {flightPlan.waypoints.map((wp, i) => (
            <div key={i} className="flex items-center gap-2 mb-2 relative pl-8 group">
              <div className="absolute left-[10px] top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-600 z-10 group-hover:bg-sky-400 transition-colors"></div>

              <div className="flex-1 flex bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden group-focus-within:border-sky-500 transition-colors">
                <WaypointInput
                  value={wp.id?.startsWith('wp-') ? (wp.name || '') : wp.id}
                  onChange={text => onUpdateFlightPlan(p => ({ ...p, waypoints: p.waypoints.map((w, j) => j === i ? { ...w, name: text, id: text } : w) }))}
                  onResolve={(point: NavPoint) => onUpdateFlightPlan(p => ({
                    ...p,
                    waypoints: p.waypoints.map((w, j) => j === i ? { ...point, alt: w.alt, type: point.type || 'WAYPOINT' } : w),
                  }))}
                />

                <div className="w-px bg-slate-800"></div>

                <AltitudeInput
                  value={wp.alt}
                  onChange={(newAlt) => onUpdateFlightPlan(p => ({ ...p, waypoints: p.waypoints.map((w, j) => j === i ? { ...w, alt: newAlt } : w) }))}
                  className="w-16 bg-transparent text-right text-xs font-mono text-sky-400 focus:outline-none placeholder-slate-700 py-1.5 px-2"
                  placeholder="ALT/FL"
                />
              </div>

              <button onClick={() => onUpdateFlightPlan(p => ({ ...p, waypoints: p.waypoints.filter((_, j) => j !== i) }))} className="text-slate-600 hover:text-red-400 transition-colors p-1.5 hover:bg-slate-800 rounded-md"><Trash2 size={14} /></button>
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
              className="text-[11px] flex items-center gap-1.5 text-sky-400 hover:text-sky-300 font-medium transition-colors py-1 px-2 rounded-md hover:bg-slate-800 -ml-2"
            >
              <PlusCircle size={13} /> Add waypoint
            </button>
          </div>

          <div className="relative pl-8">
            <div className="absolute left-2 top-3 w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-slate-900 z-10 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
            <Input placeholder="ICAO" mono value={flightPlan.arrival.id} onChange={e => onPointChange('arrival', e.target.value)} />
          </div>

          <div className="relative pl-8 pt-4 mt-2 border-t border-slate-800">
            <div className="absolute left-[11px] top-8 w-1.5 h-1.5 rotate-45 border border-slate-500 z-10"></div>
            <Input label="Alternate" placeholder="ICAO" mono value={flightPlan.alternate?.id || ''} onChange={e => onPointChange('alternate', e.target.value)} />
          </div>
        </div>
      </PanelBox>

      <div className="p-3 mt-auto border-t border-slate-800">
        <Button className="w-full py-2 text-sm font-semibold" variant="active" icon={FileText} onClick={onOpenNavLog}>Navigation Log</Button>
      </div>
    </aside>
  );
}
