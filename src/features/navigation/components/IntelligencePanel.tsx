import { MapPin, PlusCircle, Star, Radio, Wind, Cloud, AlertTriangle } from 'lucide-react';
import { MetarResponse, NavPoint, Notam } from '../../../types';
import { ActiveRunway } from '../../map/components/ActiveRunway';
import { DataTag } from '../../../components/ui';

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
      <aside className="w-96 bg-slate-900/50 border-l border-slate-800/50 flex flex-col z-20 backdrop-blur-sm">
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 p-8 text-center">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
            <MapPin size={32} className="text-slate-700" />
          </div>
          <h3 className="text-sm font-bold text-slate-400 mb-1">No Point Selected</h3>
          <p className="text-xs text-slate-500 max-w-[180px]">Select an airport or waypoint from the map or search to view details.</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-96 bg-slate-900/50 border-l border-slate-800/50 flex flex-col z-20 backdrop-blur-sm">
      <div className="p-5 border-b border-slate-800/50 bg-slate-800/20 shrink-0">
        <div className="flex justify-between items-start mb-1">
          <h1 className="text-3xl font-bold text-white tracking-tight font-sans">{selectedPoint.id}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => onAddWaypoint(selectedPoint)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-sky-500/20 flex items-center justify-center text-slate-400 hover:text-sky-400 transition-colors"
              title="Add to Route"
            >
              <PlusCircle size={18} />
            </button>
            <button
              onClick={() => onToggleFavorite(selectedPoint.id)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
            >
              <Star size={18} className={favorites.includes(selectedPoint.id) ? "fill-amber-400 text-amber-400" : "text-slate-400 hover:text-amber-400"} />
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-400 font-medium truncate mb-4">{selectedPoint.name}</p>

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

      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        {sidebarTab === 'INFO' && (
          <>
            <div className="flex justify-between items-center text-[11px] font-medium bg-slate-900/50 p-3 rounded-xl border border-slate-800">
              <DataTag label="Type" value={selectedPoint.type} />
              <DataTag label="Elevation" value={selectedPoint.elevation ? `${selectedPoint.elevation} ft` : 'N/A'} />
              <DataTag label="Freq" value={selectedPoint.frequencies?.[0]?.frequency || '—'} />
            </div>

            {selectedPoint.type === 'AIRPORT' && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Wind size={14} className="text-sky-500" /> Active Runway
                </div>
                <ActiveRunway airport={selectedPoint} metar={selectedPointMetar} />
              </div>
            )}

            {selectedPoint.frequencies && selectedPoint.frequencies.length > 0 && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Radio size={14} className="text-sky-500" /> Communications
                </div>
                {selectedPoint.frequencies.map((f, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-sm">
                    <span className="text-slate-400 font-medium">{f.type}</span>
                    <span className="font-mono font-bold text-sky-400">{f.frequency}</span>
                  </div>
                ))}
              </div>
            )}

            {selectedPoint.type !== 'AIRPORT' && !selectedPoint.frequencies && (
              <div className="text-center py-8 text-slate-600 text-xs">
                <MapPin size={32} className="mx-auto mb-2 text-slate-700" />
                <p>Waypoint details limited.</p>
              </div>
            )}
          </>
        )}

        {sidebarTab === 'WX' && (
          <>
            {selectedPointMetar ? (
              <>
                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Cloud size={14} className="text-sky-500" /> Current Conditions
                  </div>
                  <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 leading-relaxed break-all shadow-inner">
                    {selectedPointMetar.metar.raw}
                  </div>
                  {selectedPointMetar.metar.flightCategory && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Flight Category:</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        selectedPointMetar.metar.flightCategory === 'VFR' ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedPointMetar.metar.flightCategory === 'MVFR' ? 'bg-blue-500/20 text-blue-400' :
                        selectedPointMetar.metar.flightCategory === 'IFR' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {selectedPointMetar.metar.flightCategory}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Decoded METAR</div>
                  <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wind:</span>
                      <span className="text-slate-200 font-mono">
                        {selectedPointMetar.metar.wind.direction}° @ {selectedPointMetar.metar.wind.speed}kt
                        {selectedPointMetar.metar.wind.gust && ` G${selectedPointMetar.metar.wind.gust}kt`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Visibility:</span>
                      <span className="text-slate-200">
                        {selectedPointMetar.metar.visibility >= 9999 ? '10km+' : `${(selectedPointMetar.metar.visibility / 1000).toFixed(1)}km`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Clouds:</span>
                      <span className="text-slate-200">
                        {selectedPointMetar.metar.clouds.length > 0 
                          ? selectedPointMetar.metar.clouds.map(c => `${c.quantity} ${c.height}ft`).join(', ')
                          : 'Clear'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Temperature:</span>
                      <span className="text-slate-200">
                        {selectedPointMetar.metar.temperature}°C / {selectedPointMetar.metar.dewpoint}°C
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Altimeter:</span>
                      <span className="text-slate-200 font-mono">Q{selectedPointMetar.metar.qnh}</span>
                    </div>
                  </div>
                </div>

                {selectedPointMetar.tafRaw && (
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Wind size={14} className="text-sky-500" /> Terminal Forecast (TAF)
                    </div>
                    <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl text-xs font-mono text-slate-300 leading-relaxed break-all shadow-inner">
                      {selectedPointMetar.tafRaw}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-600">
                <Cloud size={48} className="mx-auto mb-3 text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">No METAR Available</p>
                <p className="text-xs mt-1">Weather data unavailable for this location.</p>
              </div>
            )}
          </>
        )}

        {sidebarTab === 'NOTAM' && (
          <>
            {selectedPoint.type === 'AIRPORT' ? (
              selectedPointNotams.length > 0 ? (
                <div className="space-y-3">
                  {selectedPointNotams.map(notam => (
                    <div key={notam.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">NOTAM</span>
                        <span className="text-[10px] text-slate-500 font-mono">{notam.id}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{notam.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <AlertTriangle size={48} className="mx-auto mb-3 text-slate-700" />
                  <p className="text-sm font-semibold text-slate-500">No Active NOTAMs</p>
                  <p className="text-xs mt-1">All clear for this location.</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 text-slate-600">
                <MapPin size={48} className="mx-auto mb-3 text-slate-700" />
                <p className="text-sm font-semibold text-slate-500">NOTAMs N/A</p>
                <p className="text-xs mt-1">Only available for airports.</p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
