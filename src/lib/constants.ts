// Application Constants

export const APP_NAME = "Malik Tech Dairy";
export const APP_TAGLINE = "Empowering Dairy Farms with Technology";

// Subscription Plans (PKR)
export const SUBSCRIPTION_PLANS = {
  free: {
    name: "Free",
    price: 0,
    maxAnimals: 30,
    maxUsers: 1,
    features: ["basic_reports", "mobile_app"],
  },
  starter: {
    name: "Starter",
    price: 2999,
    maxAnimals: 100,
    maxUsers: 3,
    features: ["basic_reports", "mobile_app", "email_support"],
  },
  professional: {
    name: "Professional",
    price: 7999,
    maxAnimals: 500,
    maxUsers: 15,
    features: [
      "basic_reports",
      "advanced_analytics",
      "breeding_management",
      "ai_insights",
      "sms_alerts",
      "priority_support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: 19999,
    maxAnimals: -1, // Unlimited
    maxUsers: -1, // Unlimited
    features: [
      "all_professional_features",
      "white_label",
      "api_access",
      "custom_integrations",
      "dedicated_support",
      "on_premise_option",
    ],
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

