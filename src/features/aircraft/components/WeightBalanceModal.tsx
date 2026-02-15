import React from 'react';
import { X, Scale } from 'lucide-react';
import { AircraftProfile, Payload } from '../../../types';
import { Input } from '../../../components/ui';

interface WeightBalanceModalProps {
  aircraft: AircraftProfile;
  payload: Payload;
  onClose: () => void;
  onUpdatePayload: (pl: Payload) => void;
}

export const WeightBalanceModal: React.FC<WeightBalanceModalProps> = ({ aircraft, payload, onClose, onUpdatePayload }) => {
  const fuelWeight = payload.fuel * 0.72;
  const totalWeight = aircraft.emptyWeight + payload.pilot + payload.pax + payload.baggage + fuelWeight;
  const takeoffLimit = aircraft.maxTakeoffMass;
  const isOverweight = totalWeight > takeoffLimit;

  const mPilot = payload.pilot * (aircraft.armPilot || 0);
  const mPax = payload.pax * (aircraft.armPax || 0);
  const mBag = payload.baggage * (aircraft.armBaggage || 0);
  const mFuel = fuelWeight * (aircraft.armFuel || 0);
  const mEmpty = aircraft.emptyWeight * (aircraft.cgMin + ((aircraft.cgMax - aircraft.cgMin) / 2));

  const totalMoment = mEmpty + mPilot + mPax + mBag + mFuel;
  const currentCG = totalMoment / totalWeight;

  const cgSpan = (aircraft.cgMax - aircraft.cgMin) * 2;
  const cgStart = aircraft.cgMin - (cgSpan * 0.25);
  const cgEnd = aircraft.cgMax + (cgSpan * 0.25);

  const xPct = (val: number) => ((val - cgStart) / (cgEnd - cgStart)) * 100;
  const yPct = (val: number) => 100 - ((val / (aircraft.maxTakeoffMass * 1.1)) * 100);

  const isUnbalanced = currentCG < aircraft.cgMin || currentCG > aircraft.cgMax;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-800 flex flex-col text-slate-300">
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-base font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sky-900/30 flex items-center justify-center text-sky-500">
              <Scale size={18} />
            </div>
            Weight & Balance
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-800/50">
              <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4">Variable Load</h3>
              <div className="space-y-4">
                <Input label="Pilot (kg)" value={payload.pilot} type="number" onChange={e => onUpdatePayload({ ...payload, pilot: parseInt(e.target.value) || 0 })} />
                <Input label="Passenger (kg)" value={payload.pax} type="number" onChange={e => onUpdatePayload({ ...payload, pax: parseInt(e.target.value) || 0 })} />
                <Input label="Baggage (kg)" value={payload.baggage} type="number" onChange={e => onUpdatePayload({ ...payload, baggage: parseInt(e.target.value) || 0 })} />
                <Input label="Fuel (L)" value={payload.fuel} type="number" onChange={e => onUpdatePayload({ ...payload, fuel: parseInt(e.target.value) || 0 })} />
              </div>
            </div>

            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
              <div className="flex justify-between text-sm mb-2 text-slate-400">
                <span>Zero Fuel Mass</span>
                <span className="font-mono font-medium text-slate-200">{(totalWeight - fuelWeight).toFixed(0)} kg</span>
              </div>
              <div className="flex justify-between text-base font-bold items-center">
                <span className="text-white">Takeoff Mass</span>
                <span className={`font-mono px-2 py-0.5 rounded ${isOverweight ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{totalWeight.toFixed(0)} kg</span>
              </div>
            </div>
          </div>
          <div>
            <div className="h-full flex flex-col">
              <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4">CG Envelope</h3>
              <div className="flex-1 min-h-[300px] border border-slate-700/50 bg-slate-950 rounded-xl relative overflow-hidden shadow-inner">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

                <svg className="absolute inset-0 w-full h-full">
                  <polygon
                    points={`
                                            ${xPct(aircraft.cgMin)},${yPct(aircraft.emptyWeight)}
                                            ${xPct(aircraft.cgMin)},${yPct(aircraft.maxTakeoffMass)}
                                            ${xPct(aircraft.cgMax)},${yPct(aircraft.maxTakeoffMass)}
                                            ${xPct(aircraft.cgMax)},${yPct(aircraft.emptyWeight)}
                                        `}
                    fill="rgba(14, 165, 233, 0.1)"
                    stroke="rgba(14, 165, 233, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                </svg>

                <div
                  className={`absolute w-4 h-4 rounded-full border-2 shadow-lg transition-all duration-500 z-10 -ml-2 -mt-2 ${isOverweight || isUnbalanced ? 'bg-red-500 border-white' : 'bg-emerald-500 border-white'}`}
                  style={{ top: `${yPct(totalWeight)}%`, left: `${xPct(currentCG)}%` }}
                ></div>

                <span className="absolute bottom-2 left-3 text-[10px] text-slate-500 font-semibold tracking-wider">FWD LIMIT</span>
                <span className="absolute bottom-2 right-3 text-[10px] text-slate-500 font-semibold tracking-wider">AFT LIMIT</span>
                <span className="absolute top-2 left-2 text-[10px] text-slate-500 font-semibold tracking-wider">MAX WEIGHT</span>
              </div>

              <div className="mt-4 p-3 bg-slate-800/30 border border-slate-700/30 rounded-xl">
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-400 font-medium">Center of Gravity</span>
                  <span className={`font-mono font-bold ${isUnbalanced ? 'text-red-400' : 'text-slate-200'}`}>{currentCG.toFixed(3)} m</span>
                </div>
                {isUnbalanced && <div className="text-xs text-red-400 mt-2 font-medium bg-red-500/10 p-2 rounded-lg text-center">⚠ Out of Balance Limits</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
