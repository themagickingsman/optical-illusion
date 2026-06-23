import { useState, useEffect, useCallback } from 'react';
import { EngineData } from '@/data/engines';

export function useEngines() {
  const [engines, setEngines] = useState<EngineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEngines = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/engines');
      if (!res.ok) throw new Error('Failed to fetch engines');
      const data = await res.json();
      setEngines(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEngines();
  }, [fetchEngines]);

  const addEngine = async (newEngine: Partial<EngineData>) => {
    try {
      const res = await fetch('/api/engines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEngine)
      });
      if (!res.ok) throw new Error('Failed to add engine');
      await fetchEngines();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const updateEngine = async (id: string, updatedData: Partial<EngineData>) => {
    try {
      const res = await fetch(`/api/engines/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });
      if (!res.ok) throw new Error('Failed to update engine');
      await fetchEngines();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteEngine = async (id: string) => {
    try {
      const res = await fetch(`/api/engines/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete engine');
      await fetchEngines();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const reorderEngines = async (newOrder: EngineData[]) => {
    // Optimistically update the UI immediately
    setEngines(newOrder);
    try {
      const res = await fetch('/api/engines/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newOrder })
      });
      if (!res.ok) throw new Error('Failed to reorder engines');
      return true;
    } catch (err) {
      console.error(err);
      // Revert if failed
      await fetchEngines();
      return false;
    }
  };

  return {
    engines,
    isLoading,
    error,
    addEngine,
    updateEngine,
    deleteEngine,
    reorderEngines,
    refreshEngines: fetchEngines
  };
}
