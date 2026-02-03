import React from 'react';
import { X, Layers, Info } from 'lucide-react';
import { FlightPlan, AircraftProfile } from '../../../types';
import { calculateDistance, calculateBearing } from '../../../lib/utils';

export const NavLogModal: React.FC<{ flightPlan: FlightPlan, aircraft: AircraftProfile, onClose: () => void }> = ({ flightPlan, aircraft, onClose }) => {
  const points = [{ ...flightPlan.departure, type: 'DEP' }, ...flightPlan.waypoints, { ...flightPlan.arrival, type: 'ARR' }];
  let totalDist = 0; let totalTime = 0;

  // Wind Logic (Simulated for Beta UI)
  const simulatedWind = { dir: 240, spd: 15 };

  const segments = points.slice(0, -1).map((point, i) => {
    const nextPoint = points[i + 1];
    const dist = calculateDistance(point.lat || 0, point.lon || 0, nextPoint.lat || 0, nextPoint.lon || 0);

    const trueCourse = calculateBearing(point.lat, point.lon, nextPoint.lat, nextPoint.lon);
    const magVar = point.magVar || 0;
    const magneticHeading = Math.round((trueCourse - magVar + 360) % 360);

    // Use leg altitude if available in nextPoint (since we climb to it), otherwise cruise
    // Note: nextPoint in 'points' array is NavPoint | Waypoint. Only Waypoint has 'alt'.
    // DEP/ARR don't have alt property usually, but Waypoints do.
    // We cast to any or check property existence.
    const legAlt = (nextPoint as any).alt || flightPlan.cruiseAltitude;

    // Ground speed calc (Simple approximation)
    const groundSpeed = aircraft.cruiseSpeed;

    const time = Math.round((dist / groundSpeed) * 60);
    totalDist += dist; totalTime += time;
    return {
      from: point.name || point.icao,
      to: nextPoint.name || nextPoint.icao,
      alt: legAlt,
      tc: Math.round(trueCourse),
      mh: magneticHeading,
      gs: groundSpeed,
      dist,
      time
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 font-sans">
      <div className="bg-white w-full max-w-5xl h-full max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-slate-900 border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-white">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
              <Layers size={18} />
            </div>
            Operational Navigation Log
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 overflow-auto flex-1 bg-slate-50">
          <div className="bg-white border border-slate-200 p-8 shadow-sm rounded-xl max-w-4xl mx-auto">
            <div className="flex justify-between mb-8 border-b border-slate-100 pb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Flight Log</h1>
                <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">PIC: DE WID, YORICK</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold text-slate-900">{flightPlan.aircraftId}</h2>
                <p className="text-sm text-slate-600 font-mono mt-1">{new Date().toISOString().split('T')[0]}</p>
                <p className="text-xs text-sky-600 font-medium bg-sky-50 px-2 py-1 rounded mt-2 inline-block">WIND: {simulatedWind.dir}/{simulatedWind.spd} KT (AUTO)</p>
              </div>
            </div>
            <table className="w-full text-sm text-left border-collapse mb-8">
              <thead>
                <tr className="border-b-2 border-slate-100">
                  <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">From</th>
                  <th className="p-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">To</th>
                  <th className="p-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Alt</th>
                  <th className="p-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Track (T)</th>
                  <th className="p-3 text-right font-semibold text-sky-600 text-xs uppercase tracking-wider">Hdg (M)</th>
                  <th className="p-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Dist</th>
                  <th className="p-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">GS</th>
                  <th className="p-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">ETE</th>
                  <th className="p-3 text-right font-semibold text-slate-500 text-xs uppercase tracking-wider">Fuel</th>
                </tr>
              </thead>
              <tbody>
                {segments.map((s, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">{s.from}</td>
                    <td className="p-3 text-slate-600">{s.to}</td>
                    <td className="p-3 text-right font-mono text-slate-600">{s.alt}</td>
                    <td className="p-3 text-right font-mono text-slate-500">{s.tc}°</td>
                    <td className="p-3 text-right font-mono font-bold text-sky-700">{s.mh}°</td>
                    <td className="p-3 text-right font-mono text-slate-700">{s.dist}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{s.gs}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{s.time}</td>
                    <td className="p-3 text-right font-mono text-slate-700">{(s.time / 60 * aircraft.fuelBurn).toFixed(1)}</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td colSpan={7} className="p-3 text-right text-xs uppercase tracking-wide">Route Totals</td>
                  <td className="p-3 text-right font-mono text-base">{totalTime}</td>
                  <td className="p-3 text-right font-mono text-base">{(totalTime / 60 * aircraft.fuelBurn).toFixed(1)}</td>
                </tr>
              </tbody>
            </table>
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
              <Info size={14} />
              Magnetic Heading calculated using local variation. Wind Correction Angle (WCA) applied automatically.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
