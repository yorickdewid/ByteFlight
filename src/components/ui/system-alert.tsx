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
    error: { icon: AlertTriangle, color: 'text-red-400' },
    warning: { icon: AlertOctagon, color: 'text-amber-400' },
    info: { icon: Info, color: 'text-sky-400' }
  }[type];

  return (
    <div className="fixed inset-0 bg-slate-950/70 z-[100] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl rounded-xl animate-slide-in">
        <div className="flex items-start gap-3 p-5">
          {React.createElement(styles.icon, { size: 20, className: `${styles.color} mt-0.5 shrink-0` })}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-100 mb-1.5">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-800">
          {onCancel && <Button variant="ghost" onClick={onCancel} size="sm">{cancelLabel}</Button>}
          <Button variant={type === 'error' ? 'danger' : 'active'} onClick={onConfirm} size="sm">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};
