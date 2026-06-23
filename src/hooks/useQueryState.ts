"use client";

import { useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export function useQueryState<T extends string>(key: string, defaultValue: T): [T, (val: T) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryValue = searchParams.get(key);
  const initialValue = (queryValue !== null ? queryValue : defaultValue) as T;

  const [localValue, setLocalValue] = useState<T>(initialValue);

  // Sync local state when URL changes (e.g., via browser Back button)
  useEffect(() => {
    const val = searchParams.get(key);
    setLocalValue((val !== null ? val : defaultValue) as T);
  }, [searchParams, key, defaultValue]);

  const setValue = useCallback(
    (newValue: T) => {
      setLocalValue(newValue); // Optimistic update

      const params = new URLSearchParams(searchParams.toString());
      if (newValue === defaultValue) {
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
