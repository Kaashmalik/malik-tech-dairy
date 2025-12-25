/**
 * Database Types for MTK Dairy
 * 
 * These types represent the Supabase database schema.
 * Use these types for type-safe database operations.
 */

// =============================================================================
// TENANT & USER TYPES
// =============================================================================

export interface Tenant {
  id: string; // Clerk Organization ID (org_xxx)
  slug: string;
  farm_name: string;
  owner_id: string;
  animal_types: string[];
  language: 'en' | 'ur';
  currency: string;
  timezone: string;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformUser {
  id: string; // Clerk User ID (user_xxx)
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: 'super_admin' | 'admin' | 'user';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantRole;
  status: 'active' | 'inactive' | 'pending';
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
}

export type TenantRole =
  | 'farm_owner'
  | 'farm_manager'
  | 'veterinarian'
  | 'breeder'
  | 'milking_staff'
  | 'feed_manager'
  | 'accountant'
  | 'guest';

// =============================================================================
// SUBSCRIPTION TYPES
// =============================================================================

export interface Subscription {
  id: string;
  tenant_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
  start_date: string;
  end_date: string | null;
  renew_date: string | null;
  max_animals: number;
  max_users: number;
  features: string[];
  created_at: string;
  updated_at: string;
}

export type SubscriptionPlan = 'free' | 'professional' | 'farm' | 'enterprise';

// =============================================================================
// FARM APPLICATION TYPES
// =============================================================================

export interface FarmApplication {
  id: string;
  applicant_id: string;
  farm_name: string;
  owner_name: string;
  owner_phone: string;
  owner_cnic: string | null;
  farm_address: string;
  farm_size: string | null;
  animal_count: number | null;
  animal_types: string[];
  requested_plan: SubscriptionPlan;
  status: ApplicationStatus;
  payment_slip_url: string | null;
  payment_amount: number | null;
  assigned_farm_id: string | null;
  assigned_tenant_id: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus = 'pending' | 'payment_uploaded' | 'approved' | 'rejected';

// =============================================================================
// ANIMAL TYPES
// =============================================================================

export interface Animal {
  id: string;
  tenant_id: string;
  tag: string;
  name: string | null;
  species: AnimalSpecies;
  breed: string | null;
  date_of_birth: string | null;
  gender: 'male' | 'female';
  photo_url: string | null;
  status: AnimalStatus;
  purchase_date: string | null;
  purchase_price: number | null;
  current_weight: number | null;
  last_health_check: string | null;
  parent_id: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type AnimalSpecies = 'cow' | 'buffalo' | 'chicken' | 'goat' | 'sheep' | 'horse';
export type AnimalStatus = 'active' | 'sold' | 'deceased' | 'sick';

// =============================================================================
// MILK LOG TYPES
// =============================================================================

export interface MilkLog {
  id: string;
  tenant_id: string;
  animal_id: string;
  date: string;
  session: MilkSession;
  quantity: number;
  quality: MilkQuality | null;
  fat: number | null;
  snf: number | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export type MilkSession = 'morning' | 'afternoon' | 'evening';
export type MilkQuality = 'excellent' | 'good' | 'average' | 'poor';

// =============================================================================
// HEALTH RECORD TYPES
// =============================================================================

export interface HealthRecord {
  id: string;
  tenant_id: string;
  animal_id: string;
  record_type: HealthRecordType;
  description: string;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  dosage: string | null;
  cost: number | null;
  vet_name: string | null;
  next_checkup: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type HealthRecordType =
  | 'checkup'
  | 'vaccination'
  | 'treatment'
  | 'surgery'
  | 'deworming'
  | 'injury'
  | 'disease'
  | 'other';

// =============================================================================
// BREEDING RECORD TYPES
// =============================================================================

export interface BreedingRecord {
  id: string;
  tenant_id: string;
  female_id: string;
  male_id: string | null;
  breeding_date: string;
  breeding_type: BreedingType;
  expected_due_date: string | null;
  actual_birth_date: string | null;
  offspring_count: number | null;
  status: BreedingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type BreedingType = 'natural' | 'artificial';
export type BreedingStatus = 'pending' | 'confirmed' | 'pregnant' | 'delivered' | 'failed';

// =============================================================================
// EXPENSE & SALES TYPES
// =============================================================================

export interface Expense {
  id: string;
  tenant_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  vendor: string | null;
  receipt_url: string | null;
  animal_id: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpenseCategory =
  | 'feed'
  | 'medicine'
  | 'equipment'
  | 'labor'
  | 'utilities'
  | 'maintenance'
  | 'veterinary'
  | 'transport'
  | 'other';

export interface Sale {
  id: string;
  tenant_id: string;
  sale_type: SaleType;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  date: string;
  buyer_name: string | null;
  buyer_phone: string | null;
  animal_id: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SaleType = 'milk' | 'animal' | 'eggs' | 'manure' | 'other';

// =============================================================================
// PAYMENT TYPES
// =============================================================================

export interface Payment {
  id: string;
  tenant_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_id: string | null;
  receipt_url: string | null;
  paid_at: string | null;
  created_at: string;
}

export type PaymentMethod = 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'xpay' | 'manual';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// =============================================================================
// CUSTOM FIELDS TYPES
// =============================================================================

export interface CustomFieldConfig {
  id: string;
  tenant_id: string;
  entity_type: 'animal' | 'milk_log' | 'health_record' | 'breeding_record';
  field_name: string;
  field_type: CustomFieldType;
  field_label: string;
  required: boolean;
  options: string[] | null;
  default_value: string | null;
  order: number;
  created_at: string;
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

// =============================================================================
// API KEYS TYPES
// =============================================================================

export interface ApiKey {
  id: string;
  tenant_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  rate_limit: number;
  expires_at: string | null;
  last_used_at: string | null;
  created_by: string;
  created_at: string;
}

// =============================================================================
// AUDIT LOG TYPES
// =============================================================================

export interface AuditLog {
  id: string;
  tenant_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// =============================================================================
// INVITATION TYPES
// =============================================================================

export interface Invitation {
  id: string;
  tenant_id: string;
  email: string;
  role: TenantRole;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

// =============================================================================
// DATABASE RESPONSE TYPES
// =============================================================================

export interface DatabaseError {
  message: string;
  code: string;
  details: string | null;
  hint: string | null;
}

export interface DatabaseResponse<T> {
  data: T | null;
  error: DatabaseError | null;
  count: number | null;
  status: number;
  statusText: string;
}

// =============================================================================
// QUERY PARAMETER TYPES
// =============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  species?: string;
  startDate?: string;
  endDate?: string;
}

export type QueryParams = PaginationParams & SortParams & FilterParams;
