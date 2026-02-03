import React from 'react';
import { LucideIcon } from 'lucide-react';

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
