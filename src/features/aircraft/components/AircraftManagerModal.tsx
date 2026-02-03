import React, { useState } from 'react';
import { Plane, Edit2, Trash2, PlusCircle, X, Scale, Layers } from 'lucide-react';
import { AircraftProfile } from '../../../types';
import { Button, Input, SystemAlert } from '../../../components/ui';

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
        setAlert(p => ({ ...p, show: false }));
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
        onConfirm={alert.action || (() => setAlert(p => ({ ...p, show: false })))}
        onCancel={() => setAlert(p => ({ ...p, show: false }))}
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
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20} /></button>
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
                    <button onClick={() => handleEdit(ac)} className="p-2 hover:bg-sky-500/10 hover:text-sky-400 rounded-lg text-slate-400 transition-colors"><Edit2 size={16} /></button>
                    <button onClick={() => confirmDelete(ac.id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors"><Trash2 size={16} /></button>
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
                <Input label="Registration ID" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value.toUpperCase() })} placeholder="e.g. PH-VCR" mono className="text-lg" />
                <Input label="Type / Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Robin DR400" />
              </div>

              <div className="bg-slate-800/20 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Layers size={14} /> Performance</h3>
                <div className="grid grid-cols-3 gap-5">
                  <Input label="Cruise Speed (KT)" type="number" value={formData.cruiseSpeed} onChange={e => setFormData({ ...formData, cruiseSpeed: parseInt(e.target.value) || 0 })} />
                  <Input label="Fuel Burn (L/hr)" type="number" value={formData.fuelBurn} onChange={e => setFormData({ ...formData, fuelBurn: parseInt(e.target.value) || 0 })} />
                  <Input label="Usable Fuel (L)" type="number" value={formData.usableFuel} onChange={e => setFormData({ ...formData, usableFuel: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="bg-slate-800/20 p-5 rounded-xl border border-slate-800">
                <h3 className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Scale size={14} /> Weight & Balance</h3>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <Input label="Empty Weight (KG)" type="number" value={formData.emptyWeight} onChange={e => setFormData({ ...formData, emptyWeight: parseInt(e.target.value) || 0 })} />
                  <Input label="Max Takeoff Mass (KG)" type="number" value={formData.maxTakeoffMass} onChange={e => setFormData({ ...formData, maxTakeoffMass: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800/50">
                  <Input label="Pilot Arm" type="number" step="0.01" value={formData.armPilot} onChange={e => setFormData({ ...formData, armPilot: parseFloat(e.target.value) || 0 })} />
                  <Input label="Pax Arm" type="number" step="0.01" value={formData.armPax} onChange={e => setFormData({ ...formData, armPax: parseFloat(e.target.value) || 0 })} />
                  <Input label="Bag Arm" type="number" step="0.01" value={formData.armBaggage} onChange={e => setFormData({ ...formData, armBaggage: parseFloat(e.target.value) || 0 })} />
                  <Input label="Fuel Arm" type="number" step="0.01" value={formData.armFuel} onChange={e => setFormData({ ...formData, armFuel: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="grid grid-cols-2 gap-5 mt-4">
                  <Input label="CG Min (Limit)" type="number" step="0.01" value={formData.cgMin} onChange={e => setFormData({ ...formData, cgMin: parseFloat(e.target.value) || 0 })} />
                  <Input label="CG Max (Limit)" type="number" step="0.01" value={formData.cgMax} onChange={e => setFormData({ ...formData, cgMax: parseFloat(e.target.value) || 0 })} />
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
