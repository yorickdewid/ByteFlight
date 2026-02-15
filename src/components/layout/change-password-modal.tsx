import React, { useState } from 'react';
import { X, Lock, Shield } from 'lucide-react';
import { Button, Input } from '../ui';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
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
            <Lock size={16} className="text-sky-500" /> Change Password
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
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
