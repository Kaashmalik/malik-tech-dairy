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

// =============================================================================
// BREEDING & PREGNANCY TYPES (Enhanced)
// =============================================================================

export type BreedingMethod = 'natural' | 'artificial_insemination';
export type BreedingStatus =
  | 'inseminated'
  | 'check_pending'
  | 'confirmed'
  | 'not_pregnant'
  | 'pregnant'
  | 'delivered'
  | 'failed'
  | 'overdue';
export type PregnancyCheckMethod = 'ultrasound' | 'blood_test' | 'rectal_palpation' | 'behavioral';
export type PregnancyCheckResult = 'positive' | 'negative' | 'inconclusive';
export type SemenStatus = 'available' | 'used' | 'expired' | 'damaged';

export interface BreedingRecord {
  id: string;
  tenantId: string;
  animalId: string;              // Female animal being bred
  sireId?: string;               // Male animal (for natural breeding)
  breedingDate: Date;
  breedingMethod: BreedingMethod;

  // AI-specific fields
  semenStrawId?: string;
  semenSource?: string;          // Bull name or semen bank
  inseminationTechnician?: string;

  // Gestation tracking
  species: AnimalSpecies;
  gestationDays: number;
  expectedDueDate?: Date;
  actualBirthDate?: Date;
  offspringCount?: number;

  // Pregnancy confirmation
  pregnancyConfirmed: boolean;
  pregnancyConfirmedDate?: Date;
  pregnancyCheckMethod?: PregnancyCheckMethod;

  status: BreedingStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface PregnancyCheck {
  id: string;
  tenantId: string;
  breedingRecordId: string;
  animalId: string;
  checkDate: Date;
  checkMethod: PregnancyCheckMethod;
  result: PregnancyCheckResult;
  vetName?: string;
  notes?: string;
  cost?: number;
  createdAt: Date;
}

export interface SemenInventory {
  id: string;
  tenantId: string;
  strawCode: string;
  bullName: string;
  bullBreed?: string;
  bullRegistrationNumber?: string;
  sourceCenter?: string;         // Semen bank/center name
  species: AnimalSpecies;
  quantity: number;
  purchaseDate?: Date;
  expiryDate?: Date;
  storageLocation?: string;
  costPerStraw?: number;
  status: SemenStatus;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// Pregnant animal with countdown info (for dashboard)
export interface PregnantAnimal {
  id: string;
  animal: Animal;
  breedingRecord: BreedingRecord;
  daysRemaining: number;
  progressPercent: number;
  nextCheckDue?: Date;
  isOverdue: boolean;
}

// Heat detection types
export type HeatDetectionMethod = 'visual' | 'activity_monitor' | 'milk_drop' | 'mucus_discharge' | 'mounting';
export type HeatIntensity = 'weak' | 'moderate' | 'strong';
export type HeatActionTaken = 'bred' | 'missed' | 'skipped' | 'pending';

export interface HeatDetection {
  id: string;
  tenantId: string;
  animalId: string;
  detectionDate: Date;
  detectionMethod?: HeatDetectionMethod;
  heatIntensity?: HeatIntensity;
  standingHeatObserved: boolean;
  notes?: string;
  actionTaken: HeatActionTaken;
  breedingRecordId?: string;
  detectedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
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
