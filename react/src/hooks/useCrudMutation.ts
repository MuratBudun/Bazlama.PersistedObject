/**
 * Hook for CRUD mutations (create, update, delete).
 * 
 * Returns mutation functions with loading and error states.
 */

import { useState, useCallback } from 'react';
import { CrudApiClient } from '../api/CrudApiClient';
import type { CrudMutationResult } from '../types';

export function useCrudMutation<T = any>(
  endpoint: string
): CrudMutationResult<T> {
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<Error | null>(null);

  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<Error | null>(null);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<Error | null>(null);

  const client = new CrudApiClient(endpoint);

  const create = useCallback(
    async (data: Partial<T>): Promise<T> => {
      setCreateLoading(true);
      setCreateError(null);

      try {
        const result = await client.create<T>(endpoint, data);
        return result;
      } catch (err) {
        setCreateError(err as Error);
        throw err;
      } finally {
        setCreateLoading(false);
      }
    },
    [endpoint]
  );

  const update = useCallback(
    async (data: { id: string } & Partial<T>): Promise<T> => {
      setUpdateLoading(true);
      setUpdateError(null);

      try {
        const { id, ...updateData } = data;
        const result = await client.update<T>(endpoint, id, updateData as Partial<T>);
        return result;
      } catch (err) {
        setUpdateError(err as Error);
        throw err;
      } finally {
        setUpdateLoading(false);
      }
    },
    [endpoint]
  );

  const deleteFn = useCallback(
    async (id: string): Promise<{ success: boolean }> => {
      setDeleteLoading(true);
      setDeleteError(null);

      try {
        const result = await client.delete(endpoint, id);
        return result;
      } catch (err) {
        setDeleteError(err as Error);
        throw err;
      } finally {
        setDeleteLoading(false);
      }
    },
    [endpoint]
  );

  return {
    create: {
      mutate: create,
      isLoading: createLoading,
      error: createError,
    },
    update: {
      mutate: update,
      isLoading: updateLoading,
      error: updateError,
    },
    delete: {
      mutate: deleteFn,
      isLoading: deleteLoading,
      error: deleteError,
    },
  };
}
