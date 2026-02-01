import React from 'react';
import { LucideIcon, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'active' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, icon, variant = 'primary', size = 'md', className = '', disabled = false, title }) => {
  const baseStyles = "font-medium rounded-lg focus:outline-none transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed select-none tracking-wide shadow-sm";
  const variantStyles = {
    primary: "bg-slate-700/50 hover:bg-slate-600/50 text-white border border-slate-600/50 hover:border-slate-500",
    secondary: "bg-transparent hover:bg-slate-800/50 text-slate-300 border border-slate-700/50",
    active: "bg-sky-600 hover:bg-sky-500 text-white border border-sky-500 shadow-sky-900/20 shadow-md",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    ghost: "bg-transparent hover:bg-slate-800/30 text-slate-400 hover:text-slate-200 shadow-none",
  };
  const sizeStyles = {
    xs: "px-2 py-1 text-[10px]",
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button onClick={onClick} disabled={disabled} title={title} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && React.createElement(icon, { className: "w-4 h-4 opacity-90" })}
      <span>{children}</span>
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: LucideIcon;
  mono?: boolean;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, type = 'text', value, onChange, placeholder, icon, className = '', mono = false, error, ...props }) => (
  <div className={`w-full ${className}`}>
    {label && <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 ml-0.5">{label}</label>}
    <div className="relative group">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {React.createElement(icon, { className: "h-4 w-4 text-slate-500 group-focus-within:text-sky-500 transition-colors" })}
      </div>}
      <input
        type={type}
        value={value === undefined || value === null ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2
          bg-slate-800/50 border ${error ? 'border-red-500/50' : 'border-slate-700/50'}
          text-slate-100 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/20
          text-sm ${mono ? 'font-mono' : 'font-sans'} transition-all placeholder-slate-600`}
        {...props}
      />
    </div>
    {error && <span className="text-[10px] text-red-400 mt-1 block ml-1">{error}</span>}
  </div>
);

// Helper for parsing FL inputs
const parseAltitude = (input: string): number => {
  const clean = input.toUpperCase().replace(/\s/g, '');
  if (clean.startsWith('FL')) {
    const fl = parseInt(clean.replace('FL', ''), 10);
    return isNaN(fl) ? 0 : fl * 100;
  }
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

export const AltitudeInput: React.FC<{ value: number, onChange: (val: number) => void, className?: string, placeholder?: string }> = ({ value, onChange, className, placeholder }) => {
  const [strVal, setStrVal] = React.useState(value === 0 ? '' : value.toString());

  React.useEffect(() => {
    // Sync with external updates if they differ significantly from current text
    // This handles map updates reflecting in the list
    const currentParsed = parseAltitude(strVal);
    if (value !== currentParsed) {
      setStrVal(value === 0 ? '' : value.toString());
    }
  }, [value]);

  const handleBlur = () => {
    const num = parseAltitude(strVal);
    onChange(num);
    setStrVal(num === 0 ? '' : num.toString());
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={strVal}
      onChange={(e) => setStrVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )
}

export const DataTag: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-semibold text-slate-500 mb-1">{label}</span>
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200">
      {value}
    </div>
  </div>
);

interface PanelBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const PanelBox: React.FC<PanelBoxProps> = ({ title, children, className = "", headerActions }) => (
  <div className={`bg-slate-900/50 flex flex-col ${className}`}>
    {(title || headerActions) && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/50 min-h-[44px]">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          {title}
        </span>
        <div className="flex items-center space-x-2">{headerActions}</div>
      </div>
    )}
    <div className="p-4 overflow-y-auto custom-scrollbar relative">
      {children}
    </div>
  </div>
);

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

interface MetarTileProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'slate' | 'green' | 'amber' | 'red';
  icon?: LucideIcon;
  iconColor?: string;
}

export const MetarTile: React.FC<MetarTileProps> = ({ label, value, subtext, color = 'slate', icon, iconColor = 'text-slate-400' }) => (
  <div className="bg-slate-800/30 p-3 border border-slate-700/30 rounded-xl flex flex-col items-center justify-center text-center min-h-[72px] hover:bg-slate-800/50 transition-colors">
    <div className={`text-[10px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide`}>
      {icon && React.createElement(icon, { className: `w-3.5 h-3.5 ${iconColor}` })}
      {label}
    </div>
    <div className={`text-base font-bold font-mono tracking-tight ${color === 'green' ? 'text-emerald-400' :
      color === 'amber' ? 'text-amber-400' :
        color === 'red' ? 'text-red-400' :
          'text-slate-200'
      }`}>{value}</div>
    {subtext && <div className="text-[10px] text-slate-500 font-medium mt-0.5">{subtext}</div>}
  </div>
);
