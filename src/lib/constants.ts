// Application Constants

export const APP_NAME = "Malik Tech Dairy";
export const APP_TAGLINE = "Empowering Dairy Farms with Technology";

// Subscription Plans (PKR) - Updated for Pakistan Market
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxAnimals: 5,
    maxUsers: 1,
    features: ["basic_milk_logs", "mobile_app"],
    addOnPricePer10Animals: 0, // Not applicable for free tier
  },
  professional: {
    name: "Professional",
    price: 4999,
    maxAnimals: 100,
    maxUsers: 5,
    features: [
      "full_analytics",
      "mobile_app",
      "breeding_management",
      "health_records",
      "expense_tracking",
      "email_support",
    ],
    addOnPricePer10Animals: 100,
  },
  farm: {
    name: "Farm",
    price: 12999,
    maxAnimals: 500,
    maxUsers: 15,
    features: [
      "all_professional_features",
      "iot_integration",
      "api_access",
      "advanced_analytics",
      "sms_alerts",
      "priority_support",
    ],
    addOnPricePer10Animals: 100,
  },
  enterprise: {
    name: "Enterprise",
    price: 0, // Custom pricing
    maxAnimals: -1, // Unlimited
    maxUsers: -1, // Unlimited
    features: [
      "all_farm_features",
      "white_label",
      "dedicated_support",
      "on_premise_option",
      "custom_integrations",
      "sla_guarantee",
    ],
    addOnPricePer10Animals: 0, // Not applicable
  },
} as const;

// Pakistani Animal Breeds
export const ANIMAL_BREEDS = {
  cow: [
    "Sahiwal",
    "Red Sindhi",
    "Cholistani",
    "Tharparkar",
    "Holstein Friesian",
    "Jersey",
    "Crossbreed",
    "Other",
  ],
  buffalo: [
    "Nili-Ravi",
    "Kundi",
    "Azi Kheli",
    "Murrah",
    "Crossbreed",
    "Other",
  ],
  chicken: [
    "Desi (Local)",
    "Broiler",
    "Layer",
    "Rhode Island Red",
    "Leghorn",
    "Other",
  ],
  goat: [
    "Beetal",
    "Kamori",
    "Teddy",
    "Barbari",
    "Other",
  ],
  sheep: [
    "Kajli",
    "Lohi",
    "Thalli",
    "Other",
  ],
  horse: [
    "Thoroughbred",
    "Arabian",
    "Local",
    "Other",
  ],
} as const;

// Default tenant config
export const DEFAULT_TENANT_CONFIG = {
  primaryColor: "#1F7A3D", // Trust green
  accentColor: "#F59E0B", // Energy orange
  language: "en" as const,
  currency: "PKR" as const,
  timezone: "Asia/Karachi",
  animalTypes: ["cow", "buffalo", "chicken"] as const,
};

