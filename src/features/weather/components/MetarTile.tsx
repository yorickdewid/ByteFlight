import React from 'react';
import { LucideIcon } from 'lucide-react';

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
