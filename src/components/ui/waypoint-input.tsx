import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { NavPoint } from '../../types';
import { ApiService } from '../../lib/api';

interface WaypointInputProps {
  value: string;
  onResolve: (point: NavPoint) => void;
  onChange: (text: string) => void;
  placeholder?: string;
  className?: string;
}

export function WaypointInput({ value, onResolve, onChange, placeholder = 'WAYPOINT', className }: WaypointInputProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<NavPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes (e.g. when waypoint is resolved from outside)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click-outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value.toUpperCase();
    setQuery(text);
    onChange(text);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (text.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await ApiService.lookupNavPoint(text);
        setResults(res);
        setIsOpen(res.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleSelect = (point: NavPoint) => {
    setQuery(point.id);
    setResults([]);
    setIsOpen(false);
    onResolve(point);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={className || 'flex-1 bg-transparent text-sm py-1.5 px-3 text-slate-200 focus:outline-none placeholder-slate-600 font-medium'}
        />
        {isSearching && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Loader2 size={12} className="animate-spin text-sky-500" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 w-64 mt-1 bg-slate-800 border border-slate-700 shadow-2xl z-50 rounded-lg overflow-hidden p-0.5">
          {results.map(r => (
            <div
              key={r.id}
              onClick={() => handleSelect(r)}
              className="px-3 py-2 hover:bg-slate-700/50 cursor-pointer flex justify-between text-xs rounded-md transition-colors group"
            >
              <span className="font-bold text-sky-400 font-mono group-hover:text-sky-300">{r.id}</span>
              <span className="text-slate-500 group-hover:text-slate-300 truncate ml-2">{r.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
