import React, { useEffect, useState } from 'react';
import { MetarResponse, NavPoint, RunwayWindAnalysis } from '../../../types';
import { ApiService } from '../../../lib/api';
import { RunwayVisualizer } from './Visualizers';

interface ActiveRunwayProps {
  airport: NavPoint;
  metar: MetarResponse | null;
}

export const ActiveRunway: React.FC<ActiveRunwayProps> = ({ airport, metar }) => {
  const [windAnalysis, setWindAnalysis] = useState<RunwayWindAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!airport?.id || !metar) {
      setWindAnalysis(null);
      return;
    }

    // Fetch runway wind analysis from backend
    const fetchWindAnalysis = async () => {
      setIsLoading(true);
      try {
        const analysis = await ApiService.getRunwayWindAnalysis(airport.id);
        setWindAnalysis(analysis);
      } catch (error) {
        console.error('Failed to fetch runway wind analysis:', error);
        setWindAnalysis(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWindAnalysis();
  }, [airport?.id, metar]);

  if (!airport || !metar) return null;
  if (isLoading) {
    return (
      <div className="text-xs italic text-slate-500 p-2">Loading runway analysis...</div>
    );
  }

  if (!windAnalysis) return null;

  // Wind calm or unknown
  if (!windAnalysis.wind.direction && windAnalysis.wind.direction !== 0) {
    return <div className="text-xs italic text-slate-500 p-2">Wind Calm/Unknown</div>;
  }

  // Find favored runway from backend analysis
  const favoredRunway = windAnalysis.runways.find(r => r.favored);
  if (!favoredRunway) return null;

  // Find the full runway data from airport
  const runwayData = airport.runways?.find(r => r.id === favoredRunway.designator);
  if (!runwayData) return null;

  return (
    <div className="bg-slate-800/40 p-4 border border-slate-700/50 rounded-xl hover:bg-slate-800/60 transition-colors">
      <div className="flex justify-between items-center mb-3 px-1 border-b border-slate-700/50 pb-3">
        <div>
          <span className="text-base font-bold text-white block tracking-tight">
            RWY {favoredRunway.designator}
          </span>
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider bg-emerald-900/20 px-1.5 py-0.5 rounded-full border border-emerald-900/30">
            Active
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-300 block font-medium">{runwayData.length}m</span>
          <span className="text-[10px] text-slate-500 uppercase font-semibold">{runwayData.surface}</span>
        </div>
      </div>
      
      <div className="mb-3 text-xs text-slate-400 space-y-1">
        <div className="flex justify-between">
          <span>Headwind:</span>
          <span className="font-mono text-emerald-400">{Math.abs(favoredRunway.headwind)} kt</span>
        </div>
        <div className="flex justify-between">
          <span>Crosswind:</span>
          <span className="font-mono text-sky-400">{Math.abs(favoredRunway.crosswind)} kt</span>
        </div>
        <div className="flex justify-between">
          <span>Wind Angle:</span>
          <span className="font-mono text-slate-300">{Math.abs(favoredRunway.windAngle)}°</span>
        </div>
      </div>

      <RunwayVisualizer 
        runwayHeading={runwayData.trueHeading} 
        windDir={windAnalysis.wind.direction} 
        windSpeed={windAnalysis.wind.speed} 
        runwayId={favoredRunway.designator} 
      />
    </div>
  );
};
