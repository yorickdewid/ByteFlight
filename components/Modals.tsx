import React, { useState } from 'react';
import { Plane, Edit2, Trash2, PlusCircle, X, Scale, Layers, ChevronRight, Info, Lock, Moon, Sun, Monitor, Ruler, Map, Shield } from 'lucide-react';
import { AircraftProfile, FlightPlan, Payload } from '../types';
import { calculateDistance, calculateBearing } from '../utils';
import { Button, Input, SystemAlert } from './UI';

interface AircraftManagerModalProps {
    isOpen: boolean;
    aircraftList: AircraftProfile[];
    onClose: () => void;
    onSave: (ac: AircraftProfile, isNew: boolean) => void;
    onDelete: (id: string) => void;
}

export const AircraftManagerModal: React.FC<AircraftManagerModalProps> = ({ isOpen, aircraftList, onClose, onSave, onDelete }) => {
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<AircraftProfile>>({});
    const [alert, setAlert] = useState<{ show: boolean, type: 'info' | 'warning' | 'error', title: string, msg: string, action?: () => void }>({ show: false, type: 'info', title: '', msg: '', action: undefined });

    if (!isOpen) return null;

    const handleEdit = (aircraft: AircraftProfile | null) => {
        setFormData(aircraft || { 
            id: '', name: '', 
            cruiseSpeed: 100, fuelBurn: 30, usableFuel: 100, 
            emptyWeight: 600, maxTakeoffMass: 1000,
            cgMin: 0.2, cgMax: 0.8,
            armPilot: 0.0, armPax: 0.0, armBaggage: 0.0, armFuel: 0.0
        });
        setEditingId(aircraft ? aircraft.id : 'NEW');
        setView('edit');
    };

    const handleSave = () => {
        if (!formData.id || !formData.name) {
            setAlert({ show: true, type: 'error', title: 'Invalid Configuration', msg: 'Registration ID and Type Name are mandatory fields.' });
            return;
        }
        onSave(formData as AircraftProfile, editingId === 'NEW');
        setView('list');
    };

    const confirmDelete = (id: string) => {
        setAlert({ 
            show: true, 
            type: 'warning', 
            title: 'Delete Aircraft?', 
            msg: `This will permanently remove ${id} from your fleet.`,
            action: () => {
                onDelete(id);
                setAlert(p=>({...p, show: false}));
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 flex items-center justify-center p-4 md:p-6 font-sans">
             <SystemAlert 
                isOpen={alert.show} 
                type={alert.type} 
                title={alert.title} 
                message={alert.msg} 
                onConfirm={alert.action || (() => setAlert(p => ({...p, show: false})))}
                onCancel={() => setAlert(p=>({...p, show: false}))}
                confirmLabel={alert.action ? 'Delete' : 'OK'}
             />

            <div className="bg-slate-900 w-full max-w-2xl h-[650px] rounded-2xl shadow-2xl border border-slate-800 flex flex-col text-slate-300 relative overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <h2 className="text-base font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-sky-900/30 flex items-center justify-center text-sky-500">
                             <Plane size={18} />
                        </div>
                        {view === 'list' ? 'Fleet Management' : (editingId === 'NEW' ? 'New Airframe' : 'Edit Configuration')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-900/50">
                    {view === 'list' ? (
                        <div className="space-y-3">
                            {aircraftList.map(ac => (
                                <div key={ac.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/30 rounded-xl hover:bg-slate-800/70 hover:border-slate-600/50 transition-all group">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-white text-base">{ac.id}</span>
                                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{ac.name}</span>
                                        </div>
                                        <div className="mt-1.5 text-xs text-slate-500 font-mono flex gap-4">
                                            <span>TAS: {ac.cruiseSpeed} KT</span>
                                            <span>BURN: {ac.fuelBurn} L/H</span>
                                            <span>MTOM: {ac.maxTakeoffMass} KG</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(ac)} className="p-2 hover:bg-sky-500/10 hover:text-sky-400 rounded-lg text-slate-400 transition-colors"><Edit2 size={16}/></button>
                                        <button onClick={() => confirmDelete(ac.id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => handleEdit(null)} className="w-full py-6 border-2 border-dashed border-slate-800 rounded-xl text-slate-500 hover:text-sky-500 hover:border-sky-500/30 hover:bg-sky-500/5 transition-all flex flex-col items-center justify-center gap-2 group">
                                <div className="p-2 rounded-full bg-slate-800 group-hover:bg-sky-500/20 transition-colors">
                                    <PlusCircle size={24} />
                                </div>
                                <span className="text-sm font-semibold">Register New Airframe</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Registration ID" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="e.g. PH-VCR" mono className="text-lg" />
                                <Input label="Type / Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Robin DR400" />
                            </div>
                            
                            <div className="bg-slate-800/20 p-5 rounded-xl border border-slate-800">
                                <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Layers size={14}/> Performance</h3>
                                <div className="grid grid-cols-3 gap-5">
                                    <Input label="Cruise Speed (KT)" type="number" value={formData.cruiseSpeed} onChange={e => setFormData({...formData, cruiseSpeed: parseInt(e.target.value)||0})} />
                                    <Input label="Fuel Burn (L/hr)" type="number" value={formData.fuelBurn} onChange={e => setFormData({...formData, fuelBurn: parseInt(e.target.value)||0})} />
                                    <Input label="Usable Fuel (L)" type="number" value={formData.usableFuel} onChange={e => setFormData({...formData, usableFuel: parseInt(e.target.value)||0})} />
                                </div>
                            </div>

                            <div className="bg-slate-800/20 p-5 rounded-xl border border-slate-800">
                                <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Scale size={14}/> Weight & Balance</h3>
                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <Input label="Empty Weight (KG)" type="number" value={formData.emptyWeight} onChange={e => setFormData({...formData, emptyWeight: parseInt(e.target.value)||0})} />
                                    <Input label="Max Takeoff Mass (KG)" type="number" value={formData.maxTakeoffMass} onChange={e => setFormData({...formData, maxTakeoffMass: parseInt(e.target.value)||0})} />
                                </div>
                                
                                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                                     <Input label="Pilot Arm" type="number" step="0.01" value={formData.armPilot} onChange={e => setFormData({...formData, armPilot: parseFloat(e.target.value)||0})} />
                                     <Input label="Pax Arm" type="number" step="0.01" value={formData.armPax} onChange={e => setFormData({...formData, armPax: parseFloat(e.target.value)||0})} />
                                     <Input label="Bag Arm" type="number" step="0.01" value={formData.armBaggage} onChange={e => setFormData({...formData, armBaggage: parseFloat(e.target.value)||0})} />
                                     <Input label="Fuel Arm" type="number" step="0.01" value={formData.armFuel} onChange={e => setFormData({...formData, armFuel: parseFloat(e.target.value)||0})} />
                                </div>
                                <div className="grid grid-cols-2 gap-5 mt-4">
                                     <Input label="CG Min (Limit)" type="number" step="0.01" value={formData.cgMin} onChange={e => setFormData({...formData, cgMin: parseFloat(e.target.value)||0})} />
                                     <Input label="CG Max (Limit)" type="number" step="0.01" value={formData.cgMax} onChange={e => setFormData({...formData, cgMax: parseFloat(e.target.value)||0})} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {view === 'edit' && (
                    <div className="p-5 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                         <Button variant="secondary" onClick={() => setView('list')}>Cancel</Button>
                         <Button variant="active" onClick={handleSave}>Save Configuration</Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export const WeightBalanceModal: React.FC<{ aircraft: AircraftProfile, payload: Payload, onClose: () => void, onUpdatePayload: (pl: Payload) => void }> = ({ aircraft, payload, onClose, onUpdatePayload }) => {
    const fuelWeight = payload.fuel * 0.72;
    const totalWeight = aircraft.emptyWeight + payload.pilot + payload.pax + payload.baggage + fuelWeight;
    const takeoffLimit = aircraft.maxTakeoffMass;
    const isOverweight = totalWeight > takeoffLimit;

    const mPilot = payload.pilot * (aircraft.armPilot || 0);
    const mPax = payload.pax * (aircraft.armPax || 0);
    const mBag = payload.baggage * (aircraft.armBaggage || 0);
    const mFuel = fuelWeight * (aircraft.armFuel || 0);
    const mEmpty = aircraft.emptyWeight * (aircraft.cgMin + ((aircraft.cgMax - aircraft.cgMin)/2)); 
    
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
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="bg-slate-800/30 p-5 rounded-xl border border-slate-800/50">
                            <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4">Variable Load</h3>
                            <div className="space-y-4">
                                <Input label="Pilot (kg)" value={payload.pilot} type="number" onChange={e => onUpdatePayload({...payload, pilot: parseInt(e.target.value)||0})}/>
                                <Input label="Passenger (kg)" value={payload.pax} type="number" onChange={e => onUpdatePayload({...payload, pax: parseInt(e.target.value)||0})}/>
                                <Input label="Baggage (kg)" value={payload.baggage} type="number" onChange={e => onUpdatePayload({...payload, baggage: parseInt(e.target.value)||0})}/>
                                <Input label="Fuel (L)" value={payload.fuel} type="number" onChange={e => onUpdatePayload({...payload, fuel: parseInt(e.target.value)||0})}/>
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
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X size={20}/></button>
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
                                {segments.map((s,i) => (
                                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-semibold text-slate-800">{s.from}</td>
                                        <td className="p-3 text-slate-600">{s.to}</td>
                                        <td className="p-3 text-right font-mono text-slate-600">{s.alt}</td>
                                        <td className="p-3 text-right font-mono text-slate-500">{s.tc}°</td>
                                        <td className="p-3 text-right font-mono font-bold text-sky-700">{s.mh}°</td>
                                        <td className="p-3 text-right font-mono text-slate-700">{s.dist}</td>
                                        <td className="p-3 text-right font-mono text-slate-700">{s.gs}</td>
                                        <td className="p-3 text-right font-mono text-slate-700">{s.time}</td>
                                        <td className="p-3 text-right font-mono text-slate-700">{(s.time/60 * aircraft.fuelBurn).toFixed(1)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-slate-50 font-bold text-slate-900">
                                    <td colSpan={7} className="p-3 text-right text-xs uppercase tracking-wide">Route Totals</td>
                                    <td className="p-3 text-right font-mono text-base">{totalTime}</td>
                                    <td className="p-3 text-right font-mono text-base">{(totalTime/60 * aircraft.fuelBurn).toFixed(1)}</td>
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

export const ChangePasswordModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'form' | 'success'>('form');

    if (!isOpen) return null;

    const handleSubmit = () => {
        // Mock API call
        setTimeout(() => {
            setStep('success');
        }, 500);
    };

    return (
         <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-800 flex flex-col text-slate-300">
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Lock size={16} className="text-sky-500"/> Change Password
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={18}/></button>
                </div>
                
                <div className="p-6">
                    {step === 'form' ? (
                        <div className="space-y-4">
                            <Input label="Current Password" type="password" placeholder="••••••••" />
                            <Input label="New Password" type="password" placeholder="••••••••" />
                            <Input label="Confirm New Password" type="password" placeholder="••••••••" />
                            
                            <div className="pt-2 flex justify-end gap-3">
                                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                                <Button variant="active" onClick={handleSubmit}>Update Password</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Password Updated</h3>
                            <p className="text-sm text-slate-400 mb-6">Your account password has been successfully changed.</p>
                            <Button variant="primary" onClick={onClose} className="w-full">Close</Button>
                        </div>
                    )}
                </div>
            </div>
         </div>
    );
};

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('general');

    if (!isOpen) return null;

    const tabs = [
        { id: 'general', label: 'General', icon: Monitor },
        { id: 'units', label: 'Units', icon: Ruler },
        { id: 'map', label: 'Map Layers', icon: Map },
    ];

    return (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-slate-900 w-full max-w-2xl h-[500px] rounded-2xl shadow-2xl border border-slate-800 flex text-slate-300 overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 bg-slate-900/50 border-r border-slate-800 p-4 flex flex-col gap-1">
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-2">Settings</div>
                    {tabs.map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => setActiveTab(t.id)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === t.id ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        >
                            <t.icon size={16} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                         <h2 className="text-lg font-bold text-white">{tabs.find(t=>t.id===activeTab)?.label}</h2>
                         <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-200 mb-3 block">Appearance</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="border border-sky-500 bg-sky-500/10 p-3 rounded-xl flex items-center gap-3 cursor-pointer">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><Moon size={16} className="text-sky-400"/></div>
                                            <div className="text-sm font-medium text-white">Dark Mode</div>
                                        </div>
                                        <div className="border border-slate-700 bg-slate-800/30 p-3 rounded-xl flex items-center gap-3 opacity-50 cursor-not-allowed">
                                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><Sun size={16} className="text-slate-400"/></div>
                                            <div className="text-sm font-medium text-slate-400">Light Mode</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Light mode is currently disabled for night-flight preservation.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'units' && (
                             <div className="space-y-5">
                                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                                    <div>
                                        <div className="text-sm font-bold text-slate-200">Distance</div>
                                        <div className="text-xs text-slate-500">Navigation distance units</div>
                                    </div>
                                    <select className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 outline-none text-slate-300">
                                        <option>Nautical Miles (NM)</option>
                                        <option>Kilometers (KM)</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                                    <div>
                                        <div className="text-sm font-bold text-slate-200">Altitude</div>
                                        <div className="text-xs text-slate-500">Vertical measurement</div>
                                    </div>
                                    <select className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 outline-none text-slate-300">
                                        <option>Feet (FT)</option>
                                        <option>Meters (M)</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl border border-slate-700/50">
                                    <div>
                                        <div className="text-sm font-bold text-slate-200">Fuel Volume</div>
                                        <div className="text-xs text-slate-500">Liquid quantity</div>
                                    </div>
                                    <select className="bg-slate-900 border border-slate-700 rounded-lg text-xs px-2 py-1 outline-none text-slate-300">
                                        <option>Liters (L)</option>
                                        <option>Gallons (US)</option>
                                        <option>Kilograms (KG)</option>
                                    </select>
                                </div>
                             </div>
                        )}

                        {activeTab === 'map' && (
                             <div className="space-y-5">
                                 <div>
                                    <label className="text-sm font-semibold text-slate-200 mb-3 block">Map Style</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="aspect-video bg-slate-800 rounded-lg border-2 border-sky-500 relative overflow-hidden group cursor-pointer">
                                            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-xs text-slate-500">Vector Dark</div>
                                            <div className="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-sky-500 border-2 border-slate-900"></div>
                                        </div>
                                        <div className="aspect-video bg-slate-800 rounded-lg border-2 border-transparent hover:border-slate-600 relative overflow-hidden group cursor-pointer opacity-60">
                                            <div className="absolute inset-0 bg-slate-800 flex items-center justify-center text-xs text-slate-500">Satellite</div>
                                        </div>
                                    </div>
                                 </div>
                                 <div className="flex items-center justify-between">
                                     <span className="text-sm text-slate-300">Show Airspaces</span>
                                     <div className="w-10 h-5 bg-sky-600 rounded-full relative cursor-pointer"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div></div>
                                 </div>
                                 <div className="flex items-center justify-between">
                                     <span className="text-sm text-slate-300">Show Obstacles</span>
                                     <div className="w-10 h-5 bg-slate-700 rounded-full relative cursor-pointer"><div className="absolute left-1 top-1 w-3 h-3 bg-slate-400 rounded-full shadow-sm"></div></div>
                                 </div>
                             </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};