// Core Types for MTK Dairy SaaS
// This file re-exports all type definitions for easy importing

// Re-export API types
export * from './api';

// Re-export environment variable types
export * from './env';

// Re-export veterinary types
export * from './veterinary';

// Re-export role types
export * from './roles';

// ============================================================================
// Core Entity Types
// ============================================================================

export type AnimalSpecies = 'cow' | 'buffalo' | 'chicken' | 'goat' | 'sheep' | 'horse';

export type SubscriptionPlan = 'free' | 'professional' | 'farm' | 'enterprise';

export type SubscriptionStatus =
  | 'active'
  | 'trial'
  | 'expired'
  | 'cancelled'
  | 'past_due'
  | 'pending_approval';

// Legacy UserRole type - use types/roles.ts for new role system
export type UserRole = 'owner' | 'manager' | 'vet' | 'worker' | 'viewer';

// Note: Role types are now exported via './roles' at the top of this file

export type PaymentGateway = 'jazzcash' | 'easypaisa' | 'xpay' | 'bank_transfer';

export type Language = 'en' | 'ur';

export interface TenantConfig {
  farmName: string;
  subdomain: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  language: Language;
  currency: 'PKR' | 'USD';
  timezone: string;
  animalTypes: AnimalSpecies[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  gateway: PaymentGateway;
  renewDate: Date;
  token?: string; // Payment token for recurring billing
  amount: number;
  currency: 'PKR';
  trialEndsAt?: Date;
}

export interface TenantLimits {
  maxAnimals: number;
  maxUsers: number;
  features: string[];
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'dropdown';
  required?: boolean;
  options?: string[]; // For dropdown type
  defaultValue?: string | number;
}

export interface Animal {
  id: string;
  tenantId: string;
  tag: string;
  name: string;
  species: AnimalSpecies;
  breed: string;
  dateOfBirth: Date;
  gender: 'male' | 'female';
  photoUrl?: string;
  status: 'active' | 'sold' | 'deceased' | 'sick';
  purchaseDate?: Date;
  purchasePrice?: number;
  customFields?: Record<string, string | number | Date>; // Custom field values
  createdAt: Date;
  updatedAt: Date;
}

export interface MilkLog {
  id: string;
  tenantId: string;
  animalId: string;
  date: string; // YYYY-MM-DD
  session: 'morning' | 'evening';
  quantity: number; // in liters
  quality?: number; // 1-10 scale
  notes?: string;
  recordedBy: string; // userId
  createdAt: Date;
}

export interface EggLog {
  id: string;
  tenantId: string;
  date: string; // YYYY-MM-DD
  quantity: number;
  quality?: number;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface HealthRecord {
  id: string;
  tenantId: string;
  animalId: string;
  type: 'vaccination' | 'treatment' | 'checkup' | 'disease';
  date: Date;
  description: string;
  veterinarian?: string;
  cost?: number;
  nextDueDate?: Date;
  createdAt: Date;
}

export interface BreedingRecord {
  id: string;
  tenantId: string;
  animalId: string;
  breedingDate: Date;
  expectedCalvingDate?: Date;
  actualCalvingDate?: Date;
  sireId?: string;
  status: 'pregnant' | 'calved' | 'failed' | 'in_progress';
  notes?: string;
  createdAt: Date;
}

export interface Expense {
  id: string;
  tenantId: string;
  date: Date;
  category: 'feed' | 'medicine' | 'labor' | 'equipment' | 'utilities' | 'other';
  description: string;
  amount: number;
  currency: 'PKR';
  recordedBy: string;
  createdAt: Date;
}

export interface Sale {
  id: string;
  tenantId: string;
  date: Date;
  type: 'milk' | 'animal' | 'egg' | 'other';
  quantity: number;
  unit: string;
  price: number;
  total: number;
  currency: 'PKR';
  buyer?: string;
  notes?: string;
  recordedBy: string;
  createdAt: Date;
}

export interface Staff {
  id: string;
  tenantId: string;
  userId: string;
  role: UserRole;
  salary?: number;
  joinDate: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  phone?: string;
  name: string;
  tenantId?: string;
  role?: UserRole;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  currency: 'PKR';
  gateway: PaymentGateway;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  plan: SubscriptionPlan;
  createdAt: Date;
  updatedAt: Date;
}
