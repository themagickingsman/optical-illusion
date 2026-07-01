"use client";

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function useQueryState<T extends string | null>(key: string, defaultValue: T): [T, (val: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activePath = typeof window !== 'undefined' ? window.location.pathname : pathname;

  let queryValue = searchParams.get(key);
  
  // Hydrate state from clean URL paths if query strings are hidden by Next.js Rewrites
  if (queryValue === null) {
    if (key === 'preview') {
      if (activePath.startsWith('/games')) queryValue = 'games';
      else if (activePath.startsWith('/library')) queryValue = 'library';
      else if (activePath.startsWith('/about')) queryValue = 'home';
      else if (activePath.startsWith('/process')) queryValue = 'process';
      else if (activePath.startsWith('/hire')) queryValue = 'hire';
    } else if (key === 'engine' && activePath.startsWith('/games/')) {
      queryValue = activePath.split('/games/')[1];
    } else if (key === 'category' && activePath.startsWith('/library/')) {
      const cat = activePath.split('/library/')[1];
      queryValue = cat.toLowerCase() === 'all' ? 'All' : cat;
    }
  }

  const initialValue = (queryValue !== null ? queryValue : defaultValue) as T;

  const [localValue, setLocalValue] = useState<T>(initialValue);

  // Sync local state when URL changes (e.g., via browser Back button)
  useEffect(() => {
    const activePath = typeof window !== 'undefined' ? window.location.pathname : pathname;
    let val = searchParams.get(key);
    if (val === null) {
      if (key === 'preview') {
        if (activePath.startsWith('/games')) val = 'games';
        else if (activePath.startsWith('/library')) val = 'library';
        else if (activePath.startsWith('/about')) val = 'home';
        else if (activePath.startsWith('/process')) val = 'process';
        else if (activePath.startsWith('/hire')) val = 'hire';
      } else if (key === 'engine' && activePath.startsWith('/games/')) {
        val = activePath.split('/games/')[1];
      } else if (key === 'category' && activePath.startsWith('/library/')) {
        const cat = activePath.split('/library/')[1];
        val = cat.toLowerCase() === 'all' ? 'All' : cat;
      }
    }
    setLocalValue((val !== null ? val : defaultValue) as T);
  }, [searchParams, pathname, key, defaultValue]);

  const setValue = useCallback(
    (newValue: T) => {
      setLocalValue(newValue); // Optimistic update

      const params = new URLSearchParams(searchParams.toString());
      if (newValue === defaultValue || newValue === null) {
        params.delete(key);
      } else {
        params.set(key, newValue);
      }

      // Use router.push so we can use the back button, but without scrolling
      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      router.push(url, { scroll: false });
    },
    [key, defaultValue, pathname, searchParams, router]
  );

  return [localValue, setValue];
}
