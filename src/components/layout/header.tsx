import { useState, useRef, useEffect } from 'react';
import { Plane, Search, Clock, Loader2, Sliders, Key, LogOut } from 'lucide-react';
import { NavPoint } from '../../types';
import { APP_VERSION } from '../../lib/constants';

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
    <header className="h-16 bg-slate-900/95 border-b border-slate-800/60 flex items-center px-6 shrink-0 relative z-30 shadow-lg backdrop-blur-sm">
      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-sky-900/20 shadow-lg">
          <Plane size={18} className="text-white fill-current" style={{ transform: 'rotate(-45deg)' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white tracking-tight leading-none">ByteFlight</span>
          <span className="text-[10px] text-sky-500 font-medium uppercase tracking-wider leading-none mt-1">Flight Planning {APP_VERSION}</span>
        </div>
      </div>

      <div className="flex justify-center w-full max-w-md">
        <div className="relative w-full">
          <div className="absolute left-3 top-2.5 flex items-center pointer-events-none">
            {isSearching ? <Loader2 className="text-sky-500 animate-spin w-4 h-4" /> : <Search className="text-slate-400 w-4 h-4" />}
          </div>
          <input
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Search Airport, VOR, or Waypoint..."
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-full py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 placeholder-slate-500 transition-all shadow-inner"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 shadow-2xl z-50 rounded-xl overflow-hidden p-1">
              {searchResults.map(a => (
                <div key={a.id} onClick={() => onSelectPoint(a)} className="p-3 hover:bg-slate-700/50 cursor-pointer flex justify-between text-sm rounded-lg transition-colors group">
                  <span className="font-bold text-sky-400 font-mono group-hover:text-sky-300">{a.id}</span>
                  <span className="text-slate-400 group-hover:text-slate-200">{a.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-5">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50">
          <Clock size={14} className="text-sky-500" />
          <span className="text-slate-200 font-mono font-bold text-sm tracking-tight">{time.toISOString().substring(11, 16)} <span className="text-[10px] text-slate-500">UTC</span></span>
        </div>

        <div className="relative" ref={profileMenuRef}>
          <div
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border cursor-pointer transition-all select-none
                      ${isProfileMenuOpen
                ? 'bg-sky-500 text-white border-sky-500 shadow-lg shadow-sky-500/30'
                : 'bg-sky-900/30 text-sky-500 border-sky-500/20 hover:bg-sky-500 hover:text-white'
              }`}
          >
            YW
          </div>

          {isProfileMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-800/20">
                <p className="text-sm font-bold text-white">Yorick de Wid</p>
                <p className="text-xs text-slate-500 truncate">pilot@byteflight.app</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => { onOpenSettings(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Sliders size={16} className="text-slate-400" /> Preferences
                </button>
                <button
                  onClick={() => { onOpenPasswordModal(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 flex items-center gap-3 transition-colors"
                >
                  <Key size={16} className="text-slate-400" /> Change Password
                </button>
              </div>
              <div className="border-t border-slate-800/50 py-1">
                <button
                  onClick={() => { onOpenLogoutAlert(); setIsProfileMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={16} /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
