import { SubscriptionPlan, AnimalSpecies } from '@/types';

export const PROBATION_PERIOD_DAYS = 3; // Days to allow access after expiry (Grace Period)

export interface PlanLimits {
  maxAnimals: number;
  maxUsers: number;
  maxStorageMB: number;
  maxMonthlyEmails: number;
  allowedSpecies: AnimalSpecies[];
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxAnimals: 10,
    maxUsers: 1,
    maxStorageMB: 100, // 100MB
    maxMonthlyEmails: 50,
    allowedSpecies: ['cow', 'buffalo'],
  },
  professional: {
    maxAnimals: 100,
    maxUsers: 5,
    maxStorageMB: 1024 * 5, // 5GB
    maxMonthlyEmails: 1000,
    allowedSpecies: ['cow', 'buffalo', 'goat', 'sheep', 'chicken'],
  },
  farm: {
    maxAnimals: 500,
    maxUsers: 20,
    maxStorageMB: 1024 * 20, // 20GB
    maxMonthlyEmails: 10000,
    allowedSpecies: ['cow', 'buffalo', 'goat', 'sheep', 'chicken', 'horse'],
  },
  enterprise: {
    maxAnimals: 10000, // Effectively unlimited
    maxUsers: 1000, // Effectively unlimited
    maxStorageMB: 1024 * 100, // 100GB
    maxMonthlyEmails: 100000,
    allowedSpecies: ['cow', 'buffalo', 'goat', 'sheep', 'chicken', 'horse'],
  },
};

export const PLAN_FEATURES: Record<SubscriptionPlan, string[]> = {
  free: ['basic_records', 'milk_logging', 'simple_reports'],
  professional: [
    'basic_records',
    'milk_logging',
    'simple_reports',
    'breeding_tracking',
    'health_records',
    'expense_tracking',
    'weather_widget',
  ],
  farm: [
    'basic_records',
    'milk_logging',
    'simple_reports',
    'breeding_tracking',
    'health_records',
    'expense_tracking',
    'weather_widget',
    'advanced_analytics',
    'staff_management',
    'inventory_management',
    'iot_integration_basic',
  ],
  enterprise: [
    'basic_records',
    'milk_logging',
    'simple_reports',
    'breeding_tracking',
    'health_records',
    'expense_tracking',
    'weather_widget',
    'advanced_analytics',
    'staff_management',
    'inventory_management',
    'iot_integration_basic',
    'api_access',
    'custom_reports',
    'ai_predictions',
    'priority_support',
    'white_labeling',
  ],
};

export const PLAN_PRICING: Record<SubscriptionPlan, { pkr: number; usd: number }> = {
  free: { pkr: 0, usd: 0 },
  professional: { pkr: 2500, usd: 10 },
  farm: { pkr: 8000, usd: 30 },
  enterprise: { pkr: 25000, usd: 100 },
};
