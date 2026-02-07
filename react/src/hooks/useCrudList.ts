/**
 * Hook for listing items with pagination and filtering.
 * 
 * This is a simple implementation without React Query.
 * For production use, consider wrapping this with @tanstack/react-query.
 */

import { useState, useEffect, useCallback } from 'react';
import { CrudApiClient } from '../api/CrudApiClient';
import type { CrudListOptions, CrudListResult } from '../types';

export function useCrudList<T = any>(
  endpoint: string,
  options: CrudListOptions = {}
): CrudListResult<T> {
  const {
    page = 1,
    pageSize = 20,
    filters = {},
    orderBy,
    search,
    enabled = true,
    useModelOutput,
    disableTotalQuery,
  } = options;

  const [data, setData] = useState<{
    items: T[];
    total: number;
    page: number;
    pageSize: number;
  } | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const client = new CrudApiClient(endpoint);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await client.list<T>(endpoint, {
        skip: (page - 1) * pageSize,
        limit: pageSize,
        filters,
        orderBy,
        search,
        useModelOutput,
        disableTotalQuery,
      });

      setData({
        items: result.items,
        total: result.total,
        page,
        pageSize,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, page, pageSize, JSON.stringify(filters), orderBy, search, enabled]);

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
