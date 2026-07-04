import { useState, useEffect } from 'react';

export function useVideoSession(roomId: string | null) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roomId) {
      setToken(null);
      setError(null);
      return;
    }

    let isMounted = true;

    async function fetchToken() {
      setLoading(true);
      setError(null);
      try {
        // Automatically determine if we are the admin based on URL or logic.
        // For now, we will pass a static username, but in production, we should
        // use the profileId or "admin".
        const participantName = typeof window !== 'undefined' && window.location.search.includes('admin') 
          ? 'Admin' 
          : 'User_' + Math.floor(Math.random() * 1000);

        const res = await fetch(`/api/livekit/token?room=${roomId}&username=${participantName}`);
        const data = await res.json();
        
        if (res.ok && data.token) {
          if (isMounted) setToken(data.token);
        } else {
          if (isMounted) setError(data.error || 'Failed to fetch token');
        }
      } catch (err) {
        if (isMounted) setError('Network error fetching token');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchToken();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  return { token, error, loading };
}
