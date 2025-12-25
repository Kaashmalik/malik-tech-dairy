// Type helpers for Supabase operations
import { Database } from '@/types/supabase';

// Common table types
export type Animal = Database['public']['Tables']['animals']['Row'];
export type AnimalInsert = Database['public']['Tables']['animals']['Insert'];
export type AnimalUpdate = Database['public']['Tables']['animals']['Update'];

export type MilkLog = Database['public']['Tables']['milk_logs']['Row'];
export type MilkLogInsert = Database['public']['Tables']['milk_logs']['Insert'];
export type MilkLogUpdate = Database['public']['Tables']['milk_logs']['Update'];

export type HealthRecord = Database['public']['Tables']['health_records']['Row'];
export type HealthRecordInsert = Database['public']['Tables']['health_records']['Insert'];
export type HealthRecordUpdate = Database['public']['Tables']['health_records']['Update'];

export type BreedingRecord = Database['public']['Tables']['breeding_records']['Row'];
export type BreedingRecordInsert = Database['public']['Tables']['breeding_records']['Insert'];
export type BreedingRecordUpdate = Database['public']['Tables']['breeding_records']['Update'];

export type Tenant = Database['public']['Tables']['tenants']['Row'];
export type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
export type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

export type PlatformUser = Database['public']['Tables']['platform_users']['Row'];
export type PlatformUserInsert = Database['public']['Tables']['platform_users']['Insert'];
export type PlatformUserUpdate = Database['public']['Tables']['platform_users']['Update'];

export type TenantMember = Database['public']['Tables']['tenant_members']['Row'];
export type TenantMemberInsert = Database['public']['Tables']['tenant_members']['Insert'];
export type TenantMemberUpdate = Database['public']['Tables']['tenant_members']['Update'];

export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type ExpenseInsert = Database['public']['Tables']['expenses']['Insert'];
export type ExpenseUpdate = Database['public']['Tables']['expenses']['Update'];

export type Sale = Database['public']['Tables']['sales']['Row'];
export type SaleInsert = Database['public']['Tables']['sales']['Insert'];
export type SaleUpdate = Database['public']['Tables']['sales']['Update'];

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export type ApiKey = Database['public']['Tables']['api_keys']['Row'];
export type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert'];
export type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update'];

export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert'];

export type FarmApplication = Database['public']['Tables']['farm_applications']['Row'];
export type FarmApplicationInsert = Database['public']['Tables']['farm_applications']['Insert'];
export type FarmApplicationUpdate = Database['public']['Tables']['farm_applications']['Update'];

export type CustomFieldConfig = Database['public']['Tables']['custom_fields_config']['Row'];
export type CustomFieldConfigInsert = Database['public']['Tables']['custom_fields_config']['Insert'];
export type CustomFieldConfigUpdate = Database['public']['Tables']['custom_fields_config']['Update'];

export type EmailSubscription = Database['public']['Tables']['email_subscriptions']['Row'];
export type EmailSubscriptionInsert = Database['public']['Tables']['email_subscriptions']['Insert'];
export type EmailSubscriptionUpdate = Database['public']['Tables']['email_subscriptions']['Update'];

export type Prediction = Database['public']['Tables']['predictions']['Row'];
export type PredictionInsert = Database['public']['Tables']['predictions']['Insert'];
export type PredictionUpdate = Database['public']['Tables']['predictions']['Update'];

// API Response types
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
  details?: any;
}

export interface ApiPaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

// Common query types
export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeQuery {
  startDate?: string;
  endDate?: string;
}

export interface TenantQuery {
  tenantId: string;
}

// Helper type for Supabase select with specific columns
export type SelectColumns<T, K extends keyof T> = Pick<T, K>;

// Helper type for creating new records (excludes auto-generated fields)
export type CreateRecord<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>;

// Helper type for updating records (all fields optional)
export type UpdateRecord<T> = Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>;

// Common enum types
export type AnimalStatus = Animal['status'];
export type AnimalGender = Animal['gender'];
export type AnimalBreed = Animal['breed'];

export type MilkSession = 'morning' | 'evening';

export type HealthRecordType = HealthRecord['type'];

export type BreedingType = BreedingRecord['type'];
export type BreedingStatus = BreedingRecord['status'];

export type UserRole = PlatformUser['role'];
export type TenantRole = TenantMember['role'];

export type SubscriptionPlan = Subscription['plan'];
export type SubscriptionStatus = Subscription['status'];

export type PaymentMethod = Payment['method'];
export type PaymentStatus = Payment['status'];

export type ExpenseCategory = Expense['category'];
export type SaleProductType = Sale['product_type'];

export type EmailSubscriptionType = EmailSubscription['type'];
export type PredictionType = Prediction['type'];

// Validation helpers
export const ANIMAL_BREEDS = ['holstein', 'jersey', 'buffalo', 'sahiwal', 'local'] as const;
export const ANIMAL_STATUSES = ['active', 'sold', 'deceased'] as const;
export const ANIMAL_GENDERS = ['male', 'female'] as const;

export const HEALTH_RECORD_TYPES = ['vaccination', 'medication', 'checkup', 'surgery', 'emergency'] as const;

export const BREEDING_TYPES = ['natural', 'artificial'] as const;
export const BREEDING_STATUSES = ['planned', 'in_progress', 'successful', 'failed'] as const;

export const USER_ROLES = ['super_admin', 'farm_owner', 'farm_manager', 'veterinarian', 'breeder', 'milking_staff', 'feed_manager', 'accountant', 'guest'] as const;
export const TENANT_ROLES = ['farm_owner', 'farm_manager', 'veterinarian', 'breeder', 'milking_staff', 'feed_manager', 'accountant', 'guest'] as const;

export const SUBSCRIPTION_PLANS = ['free', 'professional', 'farm', 'enterprise'] as const;
export const SUBSCRIPTION_STATUSES = ['active', 'cancelled', 'expired', 'trial'] as const;

export const PAYMENT_METHODS = ['jazzcash', 'easypaisa', 'bank_transfer', 'credit_card'] as const;
export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const;

export const EXPENSE_CATEGORIES = ['feed', 'medicine', 'equipment', 'labor', 'maintenance', 'transport', 'other'] as const;
export const SALE_PRODUCT_TYPES = ['milk', 'animal', 'equipment', 'other'] as const;

// Utility functions
export function isValidAnimalBreed(breed: string | null): breed is NonNullable<AnimalBreed> {
  if (!breed) return false;
  // Since AnimalBreed is string | null, we just need to ensure it's not null
  // The database allows any string as breed, not just the predefined ones
  return breed.trim().length > 0;
}

export function isValidUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export function isValidTenantRole(role: string): role is TenantRole {
  return TENANT_ROLES.includes(role as TenantRole);
}

export function createApiResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

export function createApiError(error: string, code?: string, details?: any): ApiError {
  return {
    success: false,
    error,
    code,
    details,
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): ApiPaginatedResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      total,
      page,
      limit,
      hasMore: page * limit < total,
    },
  };
}
