// API Response Types for MTK Dairy
// Ensures consistent API response format across all endpoints

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: string;
  code?: string;
  validationErrors?: Record<string, string[]>;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Paginated response helper
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiResponse<unknown>): response is ApiErrorResponse {
  return response.success === false;
}

// Request Types
export interface CreateAnimalRequest {
  tag: string;
  name?: string;
  species: 'cow' | 'buffalo' | 'chicken' | 'goat' | 'sheep' | 'horse';
  breed?: string;
  dateOfBirth?: string;
  gender: 'male' | 'female';
  status?: 'active' | 'sold' | 'deceased' | 'sick';
  purchaseDate?: string;
  purchasePrice?: number;
  weight?: number;
  color?: string;
  notes?: string;
  customFields?: Record<string, unknown>;
}

export interface UpdateAnimalRequest extends Partial<CreateAnimalRequest> {
  id: string;
}

export interface CreateMilkLogRequest {
  animalId: string;
  date: string;
  session: 'morning' | 'evening';
  quantity: number;
  quality?: number;
  fat?: number;
  notes?: string;
}

export interface CreateHealthRecordRequest {
  animalId: string;
  type: 'vaccination' | 'treatment' | 'checkup' | 'disease';
  date: string;
  description: string;
  veterinarian?: string;
  cost?: number;
  nextDueDate?: string;
}

export interface CreateBreedingRecordRequest {
  animalId: string;
  sireId?: string;
  breedingDate: string;
  expectedCalvingDate?: string;
  notes?: string;
}

export interface CreateExpenseRequest {
  date: string;
  category: 'feed' | 'medicine' | 'labor' | 'equipment' | 'utilities' | 'other';
  description: string;
  amount: number;
  vendorName?: string;
  receiptUrl?: string;
}

export interface CreateSaleRequest {
  date: string;
  type: 'milk' | 'animal' | 'egg' | 'other';
  quantity: number;
  unit: string;
  pricePerUnit: number;
  buyerName?: string;
  buyerPhone?: string;
  notes?: string;
}

// Query Parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AnimalQueryParams extends PaginationParams {
  species?: string;
  status?: string;
  search?: string;
}

export interface MilkLogQueryParams extends PaginationParams {
  animalId?: string;
  dateFrom?: string;
  dateTo?: string;
  session?: 'morning' | 'evening';
}

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

export interface AnalyticsQueryParams extends DateRangeParams {
  groupBy?: 'day' | 'week' | 'month';
  metric?: string;
}

// Webhook Types
export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
  object: 'event';
}

export interface IoTWebhookPayload {
  deviceId: string;
  deviceType: 'milk_meter' | 'activity_monitor' | 'temperature_sensor';
  timestamp: string;
  data: Record<string, number | string>;
  metadata?: Record<string, unknown>;
}
