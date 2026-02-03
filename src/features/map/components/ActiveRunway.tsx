import React from 'react';
import { NavPoint } from '../../../types';
import { parseMetar } from '../../../lib/utils';
import { RunwayVisualizer } from './Visualizers';

export const ActiveRunway: React.FC<{ airport: NavPoint, metar: string | null }> = ({ airport, metar }) => {
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
