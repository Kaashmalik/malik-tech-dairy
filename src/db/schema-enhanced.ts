// Enhanced Database Schema for Phase 1 Features
// NOTE: These tables exist in Supabase but we use the REST API directly,
// not Drizzle ORM. This file only contains types and interfaces.
//
// The actual database tables are:
// - genetic_profiles
// - feed_inventory
// - nutrition_requirements
// - computer_vision_records
// - financial_accounts
// - staff_certifications
// - regulatory_compliance
// - blockchain_transactions
// - drone_flights

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
    currentStatus: 'Healthy' | 'Sick' | 'Under Treatment' | 'Quarantine';
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
    reproductiveStatus: 'Open' | 'Bred' | 'Pregnant' | 'Dry';
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
    productionLevel: 'High' | 'Medium' | 'Low';
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
  type: 'vaccination' | 'treatment' | 'movement' | 'feeding' | 'health_check';
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
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  estimatedDuration: number; // minutes
}

// Note: The actual database tables are accessed via Supabase REST API
// See MEMORY.md for database schema documentation
