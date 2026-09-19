/**
 * Core Service Layer Types and Interfaces
 * Ensures strict tenant isolation and consistent service signatures
 */

export interface ServiceContext {
  tenantId: string;
  userId: string;
  userRole?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'CONFLICT' | 'INTERNAL_ERROR';
}
