import { MapPin, PlusCircle, Star, Radio, Wind, Cloud, AlertTriangle, Eye, Thermometer, Gauge, Info } from 'lucide-react';
import { MetarResponse, NavPoint, Notam } from '../../../types';
import { ActiveRunway } from '../../map/components/ActiveRunway';
import { DataTag, PanelBox } from '../../../components/ui';

interface IntelligencePanelProps {
  selectedPoint: NavPoint | null;
  selectedPointMetar: MetarResponse | null;
  selectedPointNotams: Notam[];
  sidebarTab: 'INFO' | 'WX' | 'NOTAM';
  setSidebarTab: (tab: 'INFO' | 'WX' | 'NOTAM') => void;
  favorites: string[];
  onAddWaypoint: (point: NavPoint) => void;
  onToggleFavorite: (id: string) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  VFR: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  MVFR: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  IFR: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  LIFR: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

// Section styling matches the left sidebar's PanelBox stack
const SECTION_CLASS = 'flex-shrink-0 border-x-0 border-t-0 rounded-none bg-transparent';

export default function IntelligencePanel({
  selectedPoint,
  selectedPointMetar,
  selectedPointNotams,
  sidebarTab,
  setSidebarTab,
  favorites,
  onAddWaypoint,
  onToggleFavorite,
}: IntelligencePanelProps) {

  if (!selectedPoint) {
    return (
      <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
          <MapPin size={24} className="text-slate-700 mb-3" />
          <h3 className="text-sm font-semibold text-slate-400 mb-1">No point selected</h3>
          <p className="text-xs text-slate-500 max-w-[200px]">Select an airport or waypoint from the map or search to view details.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-20">
      {/* Point header — compact bar, same rhythm as the left sidebar */}
      <div className="px-4 pt-3 border-b border-slate-800 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-2 min-w-0">
            <h1 className="text-xl font-bold text-white tracking-tight font-mono">{selectedPoint.id}</h1>
            <p className="text-xs text-slate-400 truncate">{selectedPoint.name}</p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onAddWaypoint(selectedPoint)}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-sky-400 transition-colors"
              title="Add to route"
            >
              <PlusCircle size={15} />
            </button>
            <button
              onClick={() => onToggleFavorite(selectedPoint.id)}
              className="p-1.5 rounded-md hover:bg-slate-800 transition-colors"
              title="Favorite"
            >
              <Star size={15} className={favorites.includes(selectedPoint.id) ? "fill-amber-400 text-amber-400" : "text-slate-400 hover:text-amber-400"} />
            </button>
          </div>
        </div>

        <div className="flex gap-1 mt-2 -mb-px">
          {(['INFO', 'WX', 'NOTAM'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setSidebarTab(tab)}
              className={`text-[11px] font-semibold px-3 py-2 border-b-2 transition-colors uppercase tracking-wide ${sidebarTab === tab
                ? 'border-sky-500 text-sky-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar animate-fade-in" key={sidebarTab}>
        {sidebarTab === 'INFO' && (
          <>
            <PanelBox title="Aerodrome" icon={Info} className={SECTION_CLASS}>
              <div className="grid grid-cols-3 gap-3">
                <DataTag label="Type" value={selectedPoint.type} />
                <DataTag label="Elevation" value={selectedPoint.elevation ? `${selectedPoint.elevation} ft` : 'N/A'} />
                <DataTag label="Freq" value={selectedPoint.frequencies?.[0]?.frequency || '—'} />
              </div>
            </PanelBox>

            {selectedPoint.type === 'AIRPORT' && (
              <PanelBox title="Active Runway" icon={Wind} className={SECTION_CLASS}>
                <ActiveRunway airport={selectedPoint} metar={selectedPointMetar} />
              </PanelBox>
            )}

            {selectedPoint.frequencies && selectedPoint.frequencies.length > 0 && (
              <PanelBox title="Communications" icon={Radio} className={SECTION_CLASS}>
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50">
                  {selectedPoint.frequencies.map((f, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2 text-sm">
                      <span className="text-slate-400">{f.type}</span>
                      <span className="font-mono text-sky-400">{f.frequency}</span>
                    </div>
                  ))}
                </div>
              </PanelBox>
            )}

            {selectedPoint.type !== 'AIRPORT' && !selectedPoint.frequencies && (
              <div className="text-center py-8 text-slate-600 text-xs">
                <MapPin size={20} className="mx-auto mb-2 text-slate-700" />
                <p>Waypoint details limited.</p>
              </div>
            )}
          </>
        )}

        {sidebarTab === 'WX' && (
          <>
            {selectedPointMetar ? (
              <>
                <PanelBox
                  title="METAR"
                  icon={Cloud}
                  className={SECTION_CLASS}
                  headerActions={selectedPointMetar.metar.flightCategory && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${CATEGORY_STYLES[selectedPointMetar.metar.flightCategory] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                      {selectedPointMetar.metar.flightCategory}
                    </span>
                  )}
                >
                  <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 leading-relaxed break-all">
                    {selectedPointMetar.metar.raw}
                  </div>
                </PanelBox>

                <PanelBox title="Decoded" className={SECTION_CLASS}>
                  <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 divide-y divide-slate-700/50 text-sm">
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-400 flex items-center gap-2"><Wind size={13} className="text-sky-500/70" />Wind</span>
                      <span className="text-slate-200 font-mono">
                        {selectedPointMetar.metar.wind.direction}° @ {selectedPointMetar.metar.wind.speed}kt
                        {selectedPointMetar.metar.wind.gust && ` G${selectedPointMetar.metar.wind.gust}kt`}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-400 flex items-center gap-2"><Eye size={13} className="text-sky-500/70" />Visibility</span>
                      <span className="text-slate-200 font-mono">
                        {selectedPointMetar.metar.visibility >= 9999 ? '10km+' : `${(selectedPointMetar.metar.visibility / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-400 flex items-center gap-2"><Cloud size={13} className="text-sky-500/70" />Clouds</span>
                      <span className="text-slate-200 font-mono text-right">
                        {selectedPointMetar.metar.clouds.length > 0
                          ? selectedPointMetar.metar.clouds.map(c => `${c.quantity} ${c.height}ft`).join(', ')
                          : 'Clear'}
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-400 flex items-center gap-2"><Thermometer size={13} className="text-sky-500/70" />Temp / Dew</span>
                      <span className="text-slate-200 font-mono">
                        {selectedPointMetar.metar.temperature}° / {selectedPointMetar.metar.dewpoint}°C
                      </span>
                    </div>
                    <div className="flex justify-between px-3 py-2">
                      <span className="text-slate-400 flex items-center gap-2"><Gauge size={13} className="text-sky-500/70" />QNH</span>
                      <span className="text-slate-200 font-mono">Q{selectedPointMetar.metar.qnh}</span>
                    </div>
                  </div>
                </PanelBox>

                {selectedPointMetar.tafRaw && (
                  <PanelBox title="TAF" icon={Wind} className={SECTION_CLASS}>
                    <div className="p-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 leading-relaxed break-all">
                      {selectedPointMetar.tafRaw}
                    </div>
                  </PanelBox>
                )}
              </>
            ) : (
              <div className="text-center py-10 text-slate-600">
                <Cloud size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-sm font-medium text-slate-500">No METAR available</p>
                <p className="text-xs mt-1">Weather data unavailable for this location.</p>
              </div>
            )}
          </>
        )}

        {sidebarTab === 'NOTAM' && (
          <>
            {selectedPoint.type === 'AIRPORT' ? (
              selectedPointNotams.length > 0 ? (
                <PanelBox title="Active NOTAMs" icon={AlertTriangle} className={SECTION_CLASS}>
                  <div className="space-y-2">
                    {selectedPointNotams.map(notam => (
                      <div key={notam.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">NOTAM</span>
                          <span className="text-[10px] text-slate-500 font-mono">{notam.id}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">{notam.text}</p>
                      </div>
                    ))}
                  </div>
                </PanelBox>
              ) : (
                <div className="text-center py-10 text-slate-600">
                  <AlertTriangle size={24} className="mx-auto mb-2 text-slate-700" />
                  <p className="text-sm font-medium text-slate-500">No active NOTAMs</p>
                </div>
              )
            ) : (
              <div className="text-center py-10 text-slate-600">
                <MapPin size={24} className="mx-auto mb-2 text-slate-700" />
                <p className="text-sm font-medium text-slate-500">NOTAMs are only available for airports</p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
