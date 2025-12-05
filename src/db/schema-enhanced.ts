// Enhanced Database Schema for Phase 1 Features
// Extends the main schema with new tables and relationships
import { 
  genetic_profiles, 
  feed_inventory, 
  nutrition_requirements, 
  computer_vision_records,
  financial_accounts,
  staff_certifications,
  regulatory_compliance,
  blockchain_transactions,
  drone_flights,
  animals,
  tenants,
  platformUsers
} from './schema';
import { relations } from 'drizzle-orm';

// Relations for Genetic Profiles
export const geneticProfilesRelations = relations(genetic_profiles, ({ one }) => ({
  animal: one(animals, {
    fields: [genetic_profiles.animal_id],
    references: [animals.id],
  }),
  sire: one(animals, {
    fields: [genetic_profiles.sire_id],
    references: [animals.id],
  }),
  dam: one(animals, {
    fields: [genetic_profiles.dam_id],
    references: [animals.id],
  }),
}));

// Relations for Nutrition Requirements
export const nutritionRequirementsRelations = relations(nutrition_requirements, ({ one }) => ({
  tenant: one(tenants, {
    fields: [nutrition_requirements.tenantId],
    references: [tenants.id],
  }),
  createdBy: one(platformUsers, {
    fields: [nutrition_requirements.createdBy],
    references: [platformUsers.id],
  }),
}));

// Relations for Computer Vision Records
export const computerVisionRecordsRelations = relations(computer_vision_records, ({ one }) => ({
  tenant: one(tenants, {
    fields: [computer_vision_records.tenant_id],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [computer_vision_records.animal_id],
    references: [animals.id],
  }),
  verifiedBy: one(platformUsers, {
    fields: [computer_vision_records.verified_by],
    references: [platformUsers.id],
  }),
}));

// Relations for Financial Accounts
export const financialAccountsRelations = relations(financial_accounts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [financial_accounts.tenant_id],
    references: [tenants.id],
  }),
  parentAccount: one(financial_accounts, {
    fields: [financial_accounts.parent_account_id],
    references: [financial_accounts.id],
  }),
  childAccounts: many(financial_accounts),
  createdBy: one(platformUsers, {
    fields: [financial_accounts.created_by],
    references: [platformUsers.id],
  }),
}));

// Relations for Staff Certifications
export const staffCertificationsRelations = relations(staff_certifications, ({ one }) => ({
  tenant: one(tenants, {
    fields: [staff_certifications.tenant_id],
    references: [tenants.id],
  }),
  user: one(platformUsers, {
    fields: [staff_certifications.user_id],
    references: [platformUsers.id],
  }),
  createdBy: one(platformUsers, {
    fields: [staff_certifications.created_by],
    references: [platformUsers.id],
  }),
}));

// Relations for Regulatory Compliance
export const regulatoryComplianceRelations = relations(regulatory_compliance, ({ one }) => ({
  tenant: one(tenants, {
    fields: [regulatory_compliance.tenant_id],
    references: [tenants.id],
  }),
  complianceOfficer: one(platformUsers, {
    fields: [regulatory_compliance.compliance_officer_id],
    references: [platformUsers.id],
  }),
  createdBy: one(platformUsers, {
    fields: [regulatory_compliance.created_by],
    references: [platformUsers.id],
  }),
}));

// Relations for Blockchain Transactions
export const blockchainTransactionsRelations = relations(blockchain_transactions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [blockchain_transactions.tenant_id],
    references: [tenants.id],
  }),
}));

// Relations for Drone Flights
export const droneFlightsRelations = relations(drone_flights, ({ one }) => ({
  tenant: one(tenants, {
    fields: [drone_flights.tenant_id],
    references: [tenants.id],
  }),
  pilot: one(platformUsers, {
    fields: [drone_flights.pilot_id],
    references: [platformUsers.id],
  }),
}));

// Enhanced Types for Animal Management
export interface EnhancedAnimalProfile {
  // Core Info
  basicInfo: {
    id: string;
    name: string;
    tag: string;
    species: string;
    breed: string;
    birthDate: Date;
    gender: string;
    rfidTag?: string;
    qrCode: string;
  };
  
  // Health Intelligence
  healthDashboard: {
    currentStatus: "Healthy" | "Sick" | "Under Treatment" | "Quarantine";
    vitals: {
      temperature: number;
      heartRate: number;
      respirationRate: number;
      lastChecked: Date;
    };
    vaccinations: any[];
    treatments: any[];
    healthScore: number;
    predictiveAlerts: any[];
  };
  
  // Production Analytics
  productionMetrics: {
    milkProduction?: {
      dailyAverage: number;
      weeklyTrend: number[];
      lactationCycle: number;
      qualityScore: number;
      butterfatContent: number;
      proteinContent: number;
    };
    weightTracking: {
      currentWeight: number;
      weightGainRate: number;
      idealWeightRange: [number, number];
    };
    feedEfficiency: number;
  };
  
  // Breeding Intelligence
  breedingManagement: {
    reproductiveStatus: "Open" | "Bred" | "Pregnant" | "Dry";
    heatCycles: any[];
    pregnancyTracking?: {
      dueDate: Date;
      daysPregnant: number;
      expectedCalves: number;
    };
    offspring: any[];
    geneticValue: {
      breedScore: number;
      milkYieldPotential: number;
      geneticValueIndex: number;
    };
  };
  
  // Financial Impact
  financialMetrics: {
    acquisitionCost: number;
    totalRevenue: number;
    totalExpenses: number;
    roi: number;
    valuationEstimate: number;
  };
  
  // Location & Movement
  location: {
    currentPen: string;
    lastMoved: Date;
    movementHistory: any[];
  };
}

// Search and Filter Types
export interface AnimalSearchFilters {
  quickFilters: {
    species: string[];
    ageRange: [number, number];
    healthStatus: string[];
    productionLevel: "High" | "Medium" | "Low";
    breedingStatus: string[];
  };
  
  advancedFilters: {
    customFields: Record<string, any>;
    dateRanges: {
      addedBetween?: [Date, Date];
      lastVaccinatedBetween?: [Date, Date];
      dueDateBetween?: [Date, Date];
    };
    performance: {
      minMilkYield?: number;
      maxFeedCost?: number;
      minHealthScore?: number;
    };
  };
  
  savedSearches: any[];
}

// Batch Operations Types
export interface BatchOperation {
  type: "vaccination" | "treatment" | "movement" | "feeding" | "health_check";
  animalIds: string[];
  operation: {
    vaccineId?: string;
    treatmentId?: string;
    fromLocation?: string;
    toLocation?: string;
    feedScheduleId?: string;
    notes?: string;
  };
  scheduledDate?: Date;
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: string;
  estimatedDuration: number; // minutes
}

// Export all enhanced types and relations
export {
  genetic_profiles,
  feed_inventory,
  nutrition_requirements,
  computer_vision_records,
  financial_accounts,
  staff_certifications,
  regulatory_compliance,
  blockchain_transactions,
  drone_flights,
};
