import React from 'react';

interface PanelBoxProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}

export const PanelBox: React.FC<PanelBoxProps> = ({ title, children, className = "", headerActions }) => (
  <div className={`bg-slate-900 flex flex-col ${className}`}>
    {(title || headerActions) && (
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 min-h-[40px]">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          {title}
        </span>
        <div className="flex items-center gap-2">{headerActions}</div>
      </div>
    )}
    <div className="p-4 overflow-y-auto custom-scrollbar relative">
      {children}
    </div>
  </div>
);
