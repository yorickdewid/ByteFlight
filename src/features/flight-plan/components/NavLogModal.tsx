import React from 'react';
import { X, Layers, Info, Loader2, AlertCircle } from 'lucide-react';
import { FlightPlan, AircraftProfile, NavLog } from '../../../types';

interface NavLogModalProps {
  flightPlan: FlightPlan;
  aircraft: AircraftProfile;
  navLog: NavLog | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
}

export const NavLogModal: React.FC<NavLogModalProps> = ({ 
  flightPlan, 
  aircraft, 
  navLog,
  isLoading,
  error,
  onClose 
}) => {
  // Format duration (minutes) to HH:MM
  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

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
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Calculating flight plan...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <AlertCircle className="mb-4" size={32} />
              <p className="font-semibold">Failed to calculate flight plan</p>
              <p className="text-sm text-slate-500 mt-2">{error}</p>
            </div>
          )}

          {!isLoading && !error && navLog && (
            <div className="bg-white border border-slate-200 p-8 shadow-sm rounded-xl max-w-4xl mx-auto">
              <div className="flex justify-between mb-8 border-b border-slate-100 pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Flight Log</h1>
                  <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">PIC: DE WID, YORICK</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-slate-900">{flightPlan.aircraftId}</h2>
                  <p className="text-sm text-slate-600 font-mono mt-1">{new Date().toISOString().split('T')[0]}</p>
                  <p className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded mt-2 inline-block">
                    CALCULATED BY BACKEND
                  </p>
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
                  {navLog.route.map((leg, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">
                        {leg.start.waypoint.icao || leg.start.waypoint.name || 'WP'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {leg.end.waypoint.icao || leg.end.waypoint.name || 'WP'}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600">
                        {leg.end.altitude || flightPlan.cruiseAltitude}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {Math.round(leg.course.track)}°
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sky-700">
                        {leg.performance?.magneticHeading 
                          ? Math.round(leg.performance.magneticHeading) 
                          : Math.round(leg.course.magneticTrack)}°
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {Math.round(leg.course.distance)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {leg.performance?.groundSpeed 
                          ? Math.round(leg.performance.groundSpeed) 
                          : aircraft.cruiseSpeed}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {leg.performance?.duration 
                          ? Math.round(leg.performance.duration) 
                          : '-'}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-700">
                        {leg.performance?.fuelConsumption 
                          ? leg.performance.fuelConsumption.toFixed(1) 
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold text-slate-900">
                    <td colSpan={5} className="p-3 text-right text-xs uppercase tracking-wide">Route Totals</td>
                    <td className="p-3 text-right font-mono text-base">{Math.round(navLog.totalDistance)} NM</td>
                    <td className="p-3 text-right font-mono text-base">-</td>
                    <td className="p-3 text-right font-mono text-base">{formatDuration(navLog.totalDuration)}</td>
                    <td className="p-3 text-right font-mono text-base">{navLog.totalTripFuel?.toFixed(1) || '-'} L</td>
                  </tr>
                </tbody>
              </table>

              {navLog.fuelBreakdown && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-3">Fuel Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Trip:</span>
                      <span className="font-mono ml-2">{navLog.fuelBreakdown.trip?.toFixed(1) || '-'} L</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Reserve:</span>
                      <span className="font-mono ml-2">{navLog.fuelBreakdown.reserve?.toFixed(1) || '-'} L</span>
                    </div>
                    {navLog.fuelBreakdown.taxi && (
                      <div>
                        <span className="text-slate-500">Taxi:</span>
                        <span className="font-mono ml-2">{navLog.fuelBreakdown.taxi.toFixed(1)} L</span>
                      </div>
                    )}
                    {navLog.fuelBreakdown.alternate && (
                      <div>
                        <span className="text-slate-500">Alternate:</span>
                        <span className="font-mono ml-2">{navLog.fuelBreakdown.alternate.toFixed(1)} L</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
                <Info size={14} />
                Generated at {new Date(navLog.generatedAt).toLocaleTimeString()} · Wind correction and performance data calculated by ByteFlight API
              </div>
            </div>
          )}

          {!isLoading && !error && !navLog && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Info className="mb-4" size={32} />
              <p>No flight plan data available</p>
              <p className="text-sm mt-2">Enter departure and arrival to calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
