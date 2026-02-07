/**
 * TypeScript type definitions for @persisted-object/react
 */

export interface CrudListOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  orderBy?: string;
  search?: string;
  useModelOutput?: boolean;        // Return Pydantic models (true) or dicts (false)
  disableTotalQuery?: boolean;     // Skip total count query for performance
  enabled?: boolean;
}

export interface CrudListResult<T> {
  data: {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    fetch?: number;  // Actual number of items returned
  } | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface CrudMutationResult<T> {
  create: {
    mutate: (data: Partial<T>) => Promise<T>;
    isLoading: boolean;
    error: Error | null;
  };
  update: {
    mutate: (data: { id: string } & Partial<T>) => Promise<T>;
    isLoading: boolean;
    error: Error | null;
  };
  delete: {
    mutate: (id: string) => Promise<{ success: boolean }>;
    isLoading: boolean;
    error: Error | null;
  };
}

export interface CrudSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  title?: string;
  description?: string;
}
