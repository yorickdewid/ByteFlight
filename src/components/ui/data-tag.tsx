import React from 'react';

export const DataTag: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-semibold text-slate-500 mb-1">{label}</span>
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200">
      {value}
    </div>
  </div>
);
