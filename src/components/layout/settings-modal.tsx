import React, { useState } from 'react';
import { X, Monitor, Ruler, Map, Moon, Sun, Fuel } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelPolicy: 'VFR_DAY' | 'VFR_NIGHT';
  onSetFuelPolicy: (val: 'VFR_DAY' | 'VFR_NIGHT') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, fuelPolicy, onSetFuelPolicy }) => {
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
            <h2 className="text-lg font-bold text-white">{tabs.find(t => t.id === activeTab)?.label}</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-200 mb-3 block">Appearance</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="border border-sky-500 bg-sky-500/10 p-3 rounded-xl flex items-center gap-3 cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center"><Moon size={16} className="text-sky-400" /></div>
                      <div className="text-sm font-medium text-white">Dark Mode</div>
                    </div>
                    <div className="border border-slate-700 bg-slate-800/30 p-3 rounded-xl flex items-center gap-3 opacity-50 cursor-not-allowed">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center"><Sun size={16} className="text-slate-400" /></div>
                      <div className="text-sm font-medium text-slate-400">Light Mode</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Light mode is currently disabled for night-flight preservation.</p>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2"><Fuel size={14} className="text-indigo-400" /> Fuel Policy</label>
                  <p className="text-xs text-slate-500 mb-3">Minimum reserve fuel required by regulations.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => onSetFuelPolicy('VFR_DAY')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${fuelPolicy === 'VFR_DAY' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}
                    >
                      <span className="text-sm font-bold">VFR Day</span>
                      <span className="text-[10px] font-mono opacity-80 bg-black/20 px-2 py-0.5 rounded">30 MIN</span>
                    </button>
                    <button
                      onClick={() => onSetFuelPolicy('VFR_NIGHT')}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${fuelPolicy === 'VFR_NIGHT' ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:bg-slate-800'}`}
                    >
                      <span className="text-sm font-bold">VFR Night</span>
                      <span className="text-[10px] font-mono opacity-80 bg-black/20 px-2 py-0.5 rounded">45 MIN</span>
                    </button>
                  </div>
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
