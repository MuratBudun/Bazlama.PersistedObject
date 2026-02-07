/**
 * Generic API client for CRUD operations.
 * 
 * This client handles all HTTP communication with the backend.
 */

export interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  onError?: (error: Error) => void;
}

let globalConfig: ApiClientConfig = {
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
};

export function configureApiClient(config: ApiClientConfig): void {
  globalConfig = { ...globalConfig, ...config };
}

export class CrudApiClient {
  private baseURL: string;
  private baseEndpoint: string;
  private headers: Record<string, string>;

  constructor(endpoint: string = '', config?: ApiClientConfig) {
    const finalConfig = { ...globalConfig, ...config };
    this.baseURL = finalConfig.baseURL || '';
    this.baseEndpoint = endpoint;
    this.headers = finalConfig.headers || {};
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${path}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new Error(error.message || 'Request failed');
      }

      return await response.json();
    } catch (error) {
      if (globalConfig.onError) {
        globalConfig.onError(error as Error);
      }
      throw error;
    }
  }

  async list<T>(
    endpoint: string,
    params?: {
      skip?: number;
      limit?: number;
      filters?: Record<string, any>;
      orderBy?: string;
      search?: string;
      useModelOutput?: boolean;
      disableTotalQuery?: boolean;
    }
  ): Promise<{ items: T[]; total: number; skip: number; limit: number; fetch: number }> {
    const searchParams = new URLSearchParams();
    
    if (params?.skip !== undefined) {
      searchParams.append('skip', params.skip.toString());
    }
    if (params?.limit !== undefined) {
      searchParams.append('limit', params.limit.toString());
    }
    if (params?.orderBy) {
      searchParams.append('order_by', params.orderBy);
    }
    if (params?.search) {
      searchParams.append('search', params.search);
    }
    if (params?.useModelOutput !== undefined) {
      searchParams.append('use_model_output', params.useModelOutput.toString());
    }
    if (params?.disableTotalQuery !== undefined) {
      searchParams.append('disable_total_query', params.disableTotalQuery.toString());
    }
    if (params?.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const query = searchParams.toString();
    const path = query ? `${endpoint}?${query}` : endpoint;
    
    return this.request<{ items: T[]; total: number; skip: number; limit: number; fetch: number }>(
      path
    );
  }

  async get<T>(endpoint: string, id: string): Promise<T> {
    return this.request<T>(`${endpoint}/${id}`);
  }

  async create<T>(endpoint: string, data: Partial<T>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update<T>(endpoint: string, id: string, data: Partial<T>): Promise<T> {
    return this.request<T>(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`${endpoint}/${id}`, {
      method: 'DELETE',
    });
  }

  async getSchema(schemaPath: string = '/schema'): Promise<any> {
    return this.request(`${this.baseEndpoint}${schemaPath}`);
  }
}

// Create a singleton instance
export const apiClient = new CrudApiClient('');
