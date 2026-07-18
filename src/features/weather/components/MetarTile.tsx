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

export const MetarTile: React.FC<MetarTileProps> = ({ label, value, subtext, color = 'slate', icon, iconColor = 'text-slate-500' }) => (
  <div className="bg-slate-800/40 p-3 border border-slate-700/50 rounded-xl flex flex-col min-h-[64px]">
    <div className="text-[10px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5 uppercase tracking-wider">
      {icon && React.createElement(icon, { className: `w-3 h-3 ${iconColor}` })}
      {label}
    </div>
    <div className={`text-base font-mono ${color === 'green' ? 'text-emerald-400' :
      color === 'amber' ? 'text-amber-400' :
        color === 'red' ? 'text-red-400' :
          'text-slate-200'
      }`}>{value}</div>
    {subtext && <div className="text-[10px] text-slate-500 mt-0.5">{subtext}</div>}
  </div>
);
