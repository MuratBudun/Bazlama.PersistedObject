/**
 * Hook for fetching JSON Schema for form generation.
 */

import { useState, useEffect, useCallback } from 'react';
import { CrudApiClient } from '../api/CrudApiClient';
import type { CrudSchema } from '../types';

export function useCrudSchema(
  endpoint: string,
  schemaPath: string = '/schema',
  options: { enabled?: boolean } = {}
): {
  data: CrudSchema | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { enabled = true } = options;

  const [data, setData] = useState<CrudSchema | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = new CrudApiClient(endpoint);

  const fetchSchema = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.getSchema(schemaPath);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, schemaPath, enabled]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchSchema,
  };
}
