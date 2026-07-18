import { useState, useRef, useEffect } from 'react';
import { Plane, Search, Loader2, Sliders, Key, LogOut, MapPin, RadioTower } from 'lucide-react';
import { NavPoint } from '../../types';
import { APP_VERSION } from '../../lib/config';

function pointTypeIcon(type: string) {
  if (type === 'AIRPORT') return Plane;
  if (type === 'VOR' || type === 'NDB') return RadioTower;
  return MapPin;
}

interface HeaderProps {
  searchQuery: string;
  searchResults: NavPoint[];
  isSearching: boolean;
  time: Date;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectPoint: (point: NavPoint) => void;
  onOpenSettings: () => void;
  onOpenPasswordModal: () => void;
  onOpenLogoutAlert: () => void;
}

export default function Header({
  searchQuery,
  searchResults,
  isSearching,
  time,
  onSearchChange,
  onSelectPoint,
  onOpenSettings,
  onOpenPasswordModal,
  onOpenLogoutAlert,
}: HeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-4 shrink-0 relative z-30">
      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-900/30">
          <Plane size={16} className="text-white fill-current" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-white tracking-tight leading-none">ByteFlight</span>
          <span className="text-[10px] text-slate-500 font-mono leading-none">{APP_VERSION}</span>
        </div>
      </div>

      <div className="flex justify-center w-full max-w-md">
        <div className="relative w-full">
          <div className="absolute left-3 top-2 flex items-center pointer-events-none">
            {isSearching ? <Loader2 className="text-sky-500 animate-spin w-4 h-4" /> : <Search className="text-slate-500 w-4 h-4" />}
          </div>
          <input
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search airport, VOR, or waypoint"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-1.5 pl-9 pr-4 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 placeholder-slate-500 transition-all"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-1 bg-slate-900 border border-slate-700 shadow-2xl z-50 rounded-xl overflow-hidden animate-fade-in">
              {searchResults.map(a => {
                const TypeIcon = pointTypeIcon(a.type);
                return (
                  <div key={a.id} onClick={() => onSelectPoint(a)} className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center gap-2.5 text-sm transition-colors border-b border-slate-800 last:border-b-0">
                    <TypeIcon size={13} className="text-slate-500 shrink-0" />
                    <span className="font-semibold text-sky-400 font-mono">{a.id}</span>
                    <span className="text-slate-400 text-xs truncate ml-auto">{a.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-4">
        <span className="text-slate-200 font-mono text-sm tabular-nums">
          {time.toISOString().substring(11, 19)}<span className="text-slate-500 text-xs ml-1.5">UTC</span>
        </span>

        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors select-none
                      ${isProfileMenuOpen
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-sky-900/40 text-sky-400 border-sky-700/50 hover:bg-sky-500 hover:text-white'
              }`}
          >
            YW
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-800">
                <p className="text-sm font-semibold text-slate-100">Yorick de Wid</p>
                <p className="text-xs text-slate-500 truncate">pilot@byteflight.app</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { onOpenSettings(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Sliders size={15} className="text-slate-500" /> Preferences
                </button>
                <button
                  onClick={() => { onOpenPasswordModal(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Key size={15} className="text-slate-500" /> Change Password
                </button>
              </div>
              <div className="border-t border-slate-800 py-1">
                <button
                  onClick={() => { onOpenLogoutAlert(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
