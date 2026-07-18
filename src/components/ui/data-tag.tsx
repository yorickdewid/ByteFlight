import React from 'react';

export const DataTag: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</span>
    <span className="text-sm font-mono text-slate-200">{value}</span>
  </div>
);
