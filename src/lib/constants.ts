// Application Constants
// =============================================================================
// MTK DAIRY - CONFIGURATION CONSTANTS
// =============================================================================

export const APP_NAME = 'MTK Dairy';
export const APP_TAGLINE = 'Smart Dairy Farm Management';
export const APP_VERSION = '1.0.0';

// =============================================================================
// SUBSCRIPTION PLANS (PKR) - Pakistan Market
// =============================================================================
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    displayName: '🆓 Free',
    price: 0,
    priceDisplay: 'Rs. 0/mo',
    maxAnimals: 5,
    maxUsers: 1,
    features: ['basic_milk_logs', 'mobile_app', 'up_to_5_animals', '1_user'],
    addOnPricePer10Animals: 0,
    description: 'Perfect for small farms just getting started',
  },
  professional: {
    name: 'Professional',
    displayName: '💼 Professional',
    price: 4999,
    priceDisplay: 'Rs. 4,999/mo',
    maxAnimals: 100,
    maxUsers: 5,
    features: [
      'full_analytics',
      'mobile_app',
      'breeding_management',
      'health_records',
      'expense_tracking',
      'email_support',
      'up_to_100_animals',
      '5_users',
    ],
    addOnPricePer10Animals: 100,
    description: 'Ideal for growing dairy farms',
  },
  farm: {
    name: 'Farm',
    displayName: '🏭 Farm',
    price: 12999,
    priceDisplay: 'Rs. 12,999/mo',
    maxAnimals: 500,
    maxUsers: 15,
    features: [
      'all_professional_features',
      'iot_integration',
      'api_access',
      'advanced_analytics',
      'sms_alerts',
      'priority_support',
      'up_to_500_animals',
      '15_users',
    ],
    addOnPricePer10Animals: 100,
    description: 'Complete solution for large-scale operations',
  },
  enterprise: {
    name: 'Enterprise',
    displayName: '🏢 Enterprise',
    price: 0, // Custom pricing
    priceDisplay: 'Custom',
    maxAnimals: -1, // Unlimited
    maxUsers: -1, // Unlimited
    features: [
      'all_farm_features',
      'white_label',
      'dedicated_support',
      'on_premise_option',
      'custom_integrations',
      'sla_guarantee',
      'unlimited_animals',
      'unlimited_users',
    ],
    addOnPricePer10Animals: 0,
    description: 'Tailored solutions for enterprise operations',
  },
} as const;

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS;

// Pakistani Animal Breeds
export const ANIMAL_BREEDS = {
  cow: [
    'Sahiwal',
    'Red Sindhi',
    'Cholistani',
    'Tharparkar',
    'Holstein Friesian',
    'Jersey',
    'Crossbreed',
    'Other',
  ],
  buffalo: ['Nili-Ravi', 'Kundi', 'Azi Kheli', 'Murrah', 'Crossbreed', 'Other'],
  chicken: ['Desi (Local)', 'Broiler', 'Layer', 'Rhode Island Red', 'Leghorn', 'Other'],
  goat: ['Beetal', 'Kamori', 'Teddy', 'Barbari', 'Other'],
  sheep: ['Kajli', 'Lohi', 'Thalli', 'Other'],
  horse: ['Thoroughbred', 'Arabian', 'Local', 'Other'],
} as const;

// Default tenant config
export const DEFAULT_TENANT_CONFIG = {
  primaryColor: '#1F7A3D', // Trust green
  accentColor: '#F59E0B', // Energy orange
  language: 'en' as const,
  currency: 'PKR' as const,
  timezone: 'Asia/Karachi',
  animalTypes: ['cow', 'buffalo', 'chicken'] as const,
};
