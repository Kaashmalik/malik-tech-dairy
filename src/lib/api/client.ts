/**
 * Centralized API Client for MTK Dairy
 * 
 * Provides type-safe HTTP methods with consistent error handling.
 */

import { successResponse, errorResponse, withErrorHandling, handleApiResponse } from './response';
import { ApiError, InternalServerError } from './errors';

export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: options?.signal,
        cache: options?.cache,
        next: options?.next,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.error || 'Request failed',
          response.status,
          data.code || 'UNKNOWN_ERROR',
          data.details
        );
      }

      // Return data field if it exists, otherwise return the whole response
      return data.data !== undefined ? data.data : data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new InternalServerError('Network error - please check your connection');
      }

      throw new InternalServerError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    }
  }

  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, options);
  }

  async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, options);
  }

  async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, options);
  }

  async patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, body, options);
  }

  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, options);
  }

  // Upload file helper
  async upload<T>(
    path: string,
    file: File | FormData,
    options?: Omit<RequestOptions, 'headers'>
  ): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      body: formData,
      signal: options?.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Upload failed',
        response.status,
        data.code || 'UPLOAD_ERROR',
        data.details
      );
    }

    return data.data !== undefined ? data.data : data;
  }
}

// Default API client instance
export const api = new ApiClient();

// Helper functions for common operations
export const apiHelpers = {
  // Animals
  animals: {
    list: () => api.get<{ animals: any[] }>('/api/animals'),
    get: (id: string) => api.get<{ animal: any }>(`/api/animals/${id}`),
    create: (data: any) => api.post<{ animal: any }>('/api/animals', data),
    update: (id: string, data: any) => api.put<{ animal: any }>(`/api/animals/${id}`, data),
    delete: (id: string) => api.delete<void>(`/api/animals/${id}`),
  },

  // Milk Logs
  milk: {
    list: (params?: { date?: string; animalId?: string; startDate?: string; endDate?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.date) searchParams.set('date', params.date);
      if (params?.animalId) searchParams.set('animalId', params.animalId);
      if (params?.startDate) searchParams.set('startDate', params.startDate);
      if (params?.endDate) searchParams.set('endDate', params.endDate);
      const query = searchParams.toString();
      return api.get<{ logs: any[] }>(`/api/milk${query ? `?${query}` : ''}`);
    },
    create: (data: any) => api.post<{ log: any }>('/api/milk', data),
    stats: (days = 7) => api.get<any>(`/api/milk/stats?days=${days}`),
  },

  // Health Records
  health: {
    list: (animalId?: string) => 
      api.get<{ records: any[] }>(`/api/health/records${animalId ? `?animalId=${animalId}` : ''}`),
    get: (id: string) => api.get<{ record: any }>(`/api/health/records/${id}`),
    create: (data: any) => api.post<{ record: any }>('/api/health/records', data),
    update: (id: string, data: any) => api.put<{ record: any }>(`/api/health/records/${id}`, data),
    delete: (id: string) => api.delete<void>(`/api/health/records/${id}`),
  },

  // Breeding
  breeding: {
    list: () => api.get<{ records: any[] }>('/api/breeding'),
    get: (id: string) => api.get<{ record: any }>(`/api/breeding/${id}`),
    create: (data: any) => api.post<{ record: any }>('/api/breeding', data),
    update: (id: string, data: any) => api.put<{ record: any }>(`/api/breeding/${id}`, data),
    delete: (id: string) => api.delete<void>(`/api/breeding/${id}`),
  },

  // User
  user: {
    farms: () => api.get<any>('/api/user/farms'),
    permissions: (userId: string, tenantId: string) =>
      api.get<any>(`/api/user/permissions?userId=${userId}&tenantId=${tenantId}`),
    joinOrg: () => api.post<any>('/api/user/join-org'),
  },

  // Upload
  upload: (file: File) => api.upload<{ url: string }>('/api/upload', file),
};

export { handleApiResponse };
export default api;
