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
    <div className="fixed inset-0 bg-slate-950/70 z-40 flex items-center justify-center p-4 md:p-6 font-sans">
      <SystemAlert
        isOpen={alert.show}
        type={alert.type}
        title={alert.title}
        message={alert.msg}
        onConfirm={alert.action || (() => setAlert(p => ({ ...p, show: false })))}
        onCancel={() => setAlert(p => ({ ...p, show: false }))}
        confirmLabel={alert.action ? 'Delete' : 'OK'}
      />

      <div className="bg-slate-900 w-full max-w-2xl h-[650px] rounded-xl shadow-2xl border border-slate-700 flex flex-col text-slate-300 relative overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Plane size={16} className="text-slate-500" />
            {view === 'list' ? 'Fleet' : (editingId === 'NEW' ? 'New Aircraft' : 'Edit Aircraft')}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-800 rounded-md transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          {view === 'list' ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl divide-y divide-slate-700/50">
              {aircraftList.map(ac => (
                <div key={ac.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-900 transition-colors group">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-white text-sm font-mono">{ac.id}</span>
                      <span className="text-xs text-slate-400">{ac.name}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-mono flex gap-4">
                      <span>TAS {ac.cruiseSpeed} KT</span>
                      <span>BURN {ac.fuelBurn} L/H</span>
                      <span>MTOM {ac.maxTakeoffMass} KG</span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(ac)} className="p-1.5 hover:bg-slate-800 hover:text-sky-400 rounded-md text-slate-400 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => confirmDelete(ac.id)} className="p-1.5 hover:bg-slate-800 hover:text-red-400 rounded-md text-slate-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
              <button onClick={() => handleEdit(null)} className="w-full px-4 py-3 text-slate-500 hover:text-sky-400 hover:bg-slate-900 transition-colors flex items-center gap-2 text-sm">
                <PlusCircle size={15} />
                Add aircraft
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <Input label="Registration ID" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value.toUpperCase() })} placeholder="e.g. PH-VCR" mono className="text-lg" />
                <Input label="Type / Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Robin DR400" />
              </div>

              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Layers size={13} /> Performance</h3>
                <div className="grid grid-cols-3 gap-5">
                  <Input label="Cruise Speed (KT)" type="number" value={formData.cruiseSpeed} onChange={e => setFormData({ ...formData, cruiseSpeed: parseInt(e.target.value) || 0 })} />
                  <Input label="Fuel Burn (L/hr)" type="number" value={formData.fuelBurn} onChange={e => setFormData({ ...formData, fuelBurn: parseInt(e.target.value) || 0 })} />
                  <Input label="Usable Fuel (L)" type="number" value={formData.usableFuel} onChange={e => setFormData({ ...formData, usableFuel: parseInt(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Scale size={13} /> Weight & Balance</h3>
                <div className="grid grid-cols-2 gap-5 mb-5">
                  <Input label="Empty Weight (KG)" type="number" value={formData.emptyWeight} onChange={e => setFormData({ ...formData, emptyWeight: parseInt(e.target.value) || 0 })} />
                  <Input label="Max Takeoff Mass (KG)" type="number" value={formData.maxTakeoffMass} onChange={e => setFormData({ ...formData, maxTakeoffMass: parseInt(e.target.value) || 0 })} />
                </div>

                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-slate-800">
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
          <div className="px-5 py-4 border-t border-slate-800 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setView('list')}>Cancel</Button>
            <Button variant="active" onClick={handleSave}>Save</Button>
          </div>
        )}
      </div>
    </div>
  );
};
