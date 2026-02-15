import { useEffect, useState } from 'react';

const STORAGE_KEY = 'byteflight_favorites';
const DEFAULT_FAVORITES = ['EHRD'];

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* corrupt data, use defaults */ }
    return DEFAULT_FAVORITES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return {
    favorites,
    toggleFavorite,
  };
}
