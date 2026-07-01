import { useState, useMemo, useEffect } from 'react';
import libraryData from '@/data/library.json';
import { useQueryState } from '@/hooks/useQueryState';

export type SortOption = 'Popularity' | 'Rating' | 'A-Z' | 'Newest';

export function useLibraryLogic() {
  const [items, setItems] = useState<any[]>([]);
  const [activeCategoryState, setActiveCategoryState] = useQueryState<string>('category', 'All');
  const [sortOption, setSortOption] = useQueryState<SortOption>('sort', 'Popularity');

  const setActiveCategory = (cat: string) => {
    setActiveCategoryState(cat);
    setTimeout(() => {
      const cleanPath = cat === 'All' ? '/library/all' : `/library/${cat.toLowerCase()}`;
      window.history.replaceState(null, '', cleanPath);
    }, 50);
  };

  // Load initial data
  useEffect(() => {
    // We could fetch this from an API, but we are reading the JSON directly per instructions
    setItems(libraryData);
  }, []);

  // Extract unique categories from data dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    libraryData.forEach((item: any) => {
      if (item.category) {
        cats.add(item.category);
      }
    });
    return ['All', ...Array.from(cats)];
  }, []);

  const sortOptions: SortOption[] = ['Popularity', 'Rating', 'A-Z', 'Newest'];

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by category
    if (activeCategoryState !== 'All') {
      result = result.filter(item => item.category === activeCategoryState);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case 'Popularity':
          return (b.downloads || 0) - (a.downloads || 0);
        case 'Rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'A-Z':
          return (a.title || '').localeCompare(b.title || '');
        case 'Newest':
          // We don't have a date field currently, so we fallback to A-Z
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

    return result;
  }, [items, activeCategoryState, sortOption]);

  // Keep compatibility with the previous useEngines where possible
  const addEngine = async (newEngine: any) => {
    console.log('Adding to library not strictly supported by static JSON file, requires API update.');
  };

  const updateEngine = async (id: string, updatedData: any) => {
    console.log('Updating library not strictly supported by static JSON file, requires API update.');
  };

  const deleteEngine = async (id: string) => {
    console.log('Deleting from library not strictly supported by static JSON file, requires API update.');
  };

  return {
    engines: filteredAndSortedItems, // Return as 'engines' for backward compatibility
    isLoading: false,
    activeCategory: activeCategoryState,
    setActiveCategory,
    categories,
    sortOption,
    setSortOption,
    sortOptions,
    addEngine,
    updateEngine,
    deleteEngine
  };
}
