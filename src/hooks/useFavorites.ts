import { useState } from 'react';

export function useFavorites(initialFavorites: string[] = ['EHRD']) {
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return {
    favorites,
    toggleFavorite,
  };
}
