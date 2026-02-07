/**
 * Hook for fetching a single item by ID.
 */

import { useState, useEffect, useCallback } from 'react';
import { CrudApiClient } from '../api/CrudApiClient';

export function useCrudGet<T = any>(
  endpoint: string,
  id: string,
  options: { enabled?: boolean } = {}
): {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { enabled = true } = options;

  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = new CrudApiClient(endpoint);

  const fetchData = useCallback(async () => {
    if (!enabled || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.get<T>(endpoint, id);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, id, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}
