import React from 'react';
import { AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { Button } from './button';

interface SystemAlertProps {
  isOpen: boolean;
  type?: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const SystemAlert: React.FC<SystemAlertProps> = ({ isOpen, type = 'info', title, message, onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Cancel' }) => {
  if (!isOpen) return null;

  const styles = {
    error: { icon: AlertTriangle, color: 'text-red-500', border: 'border-red-900/30', bg: 'bg-red-900/10' },
    warning: { icon: AlertOctagon, color: 'text-amber-500', border: 'border-amber-900/30', bg: 'bg-amber-900/10' },
    info: { icon: Info, color: 'text-sky-500', border: 'border-sky-900/30', bg: 'bg-sky-900/10' }
  }[type];

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-slate-900 border ${styles.border} shadow-2xl rounded-2xl p-1`}>
        <div className={`flex items-start gap-4 p-6 ${styles.bg} rounded-t-xl`}>
          <div className={`p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 ${styles.color}`}>
            {React.createElement(styles.icon, { size: 24 })}
          </div>
          <div className="flex-1">
            <h3 className={`text-base font-bold mb-2 ${styles.color}`}>{title}</h3>
            <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-4 bg-slate-900 rounded-b-xl border-t border-slate-800/50">
          {onCancel && <Button variant="ghost" onClick={onCancel} size="sm">{cancelLabel}</Button>}
          <Button variant={type === 'error' ? 'danger' : 'active'} onClick={onConfirm} size="sm">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};
