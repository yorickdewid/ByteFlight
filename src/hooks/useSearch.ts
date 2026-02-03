import { useState } from 'react';
import { NavPoint } from '../types';
import { ApiService } from '../lib/api';

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NavPoint[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toUpperCase();
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results = await ApiService.lookupNavPoint(q);
    setSearchResults(results);
    setIsSearching(false);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
  };

  return {
    searchQuery,
    searchResults,
    isSearching,
    handleSearch,
    clearSearch,
  };
}
