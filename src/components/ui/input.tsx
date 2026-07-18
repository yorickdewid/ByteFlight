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
    {label && <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>}
    <div className="relative group">
      {icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        {React.createElement(icon, { className: "h-4 w-4 text-slate-500" })}
      </div>}
      <input
        type={type}
        value={value === undefined || value === null ? '' : value}
        onChange={onChange}
        placeholder={placeholder}
        className={`block w-full ${icon ? 'pl-9' : 'pl-3'} pr-3 py-2
          bg-slate-950 border ${error ? 'border-red-800' : 'border-slate-700'}
          text-slate-100 rounded focus:outline-none focus:border-sky-500
          text-sm ${mono ? 'font-mono' : 'font-sans'} transition-colors placeholder-slate-600`}
        {...props}
      />
    </div>
    {error && <span className="text-[10px] text-red-400 mt-1 block">{error}</span>}
  </div>
);
