import { useEffect, useState } from 'react';
import { GeographicContext } from '../types';

const CACHE_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface CacheEntry {
  data: GeographicContext;
  expiresAt: number;
}

export function useGeographicCache(city: string, state: string) {
  const [data, setData] = useState<GeographicContext | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const cacheKey = `geographicCache_${city}_${state}`;

      // Check localStorage first
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const entry: CacheEntry = JSON.parse(cached);
          if (Date.now() < entry.expiresAt) {
            setData(entry.data);
            setError(null);
            return;
          }
          localStorage.removeItem(cacheKey);
        }
      } catch (parseError) {
        console.error('Failed to parse cached geographic data:', parseError);
        localStorage.removeItem(cacheKey);
      }

      // Cache miss: fetch from API
      setLoading(true);
      try {
        const response = await fetch(`/api/geographic-context/${city}/${state}`);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const result: GeographicContext = await response.json();

        // Store in localStorage with 48h expiry
        const entry: CacheEntry = {
          data: result,
          expiresAt: Date.now() + CACHE_TTL_MS,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));

        setData(result);
        setError(null);
      } catch (err) {
        setError('Real data unavailable for this location');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [city, state]);

  return { data, loading, error };
}
