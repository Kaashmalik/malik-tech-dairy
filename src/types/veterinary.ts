// Veterinary Disease Types
export interface Disease {
  id: string;
  category: DiseaseCategory;
  nameEn: string;
  nameUr: string;
  symptoms: string[];
  diagnosisMethods: string[];
  treatmentProtocols: TreatmentProtocol[];
  preventionTips: string[];
  severity: DiseaseSeverity;
  zoonoticRisk: boolean;
  estimatedCostMin: number;
  estimatedCostMax: number;
  commonInAnimalTypes: string[];
  seasonalPrevalence: SeasonalPattern[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TreatmentProtocol {
  id: string;
  medication: string;
  dosage: string;
  duration: string;
  administrationRoute: 'oral' | 'injection' | 'topical' | 'intravenous';
  veterinaryRequired: boolean;
  sideEffects: string[];
  contraindications: string[];
  alternativeMedications: string[];
}

export interface TreatmentRecord {
  id: string;
  tenantId: string;
  animalId: string;
  diseaseId: string;
  symptomsObserved: string[];
  diagnosis: string;
  treatmentGiven: TreatmentProtocol[];
  medications: MedicationAdministered[];
  veterinarianName: string;
  veterinarianLicense?: string;
  cost: number;
  startDate: Date;
  endDate?: Date;
  outcome: TreatmentOutcome;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  recoveryPercentage?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationAdministered {
  medicationName: string;
  dosage: string;
  administeredAt: Date;
  administeredBy: string;
  batchNumber?: string;
  expiryDate?: Date;
}

export interface VaccinationSchedule {
  id: string;
  tenantId: string;
  animalId?: string; // null for herd-wide vaccinations
  vaccineName: string;
  vaccineType: VaccineType;
  targetDiseases: string[];
  scheduledDate: Date;
  administeredDate?: Date;
  nextDueDate?: Date;
  status: VaccinationStatus;
  administeredBy: string;
  batchNumber: string;
  expiryDate: Date;
  manufacturer: string;
  adverseReactions?: string[];
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VeterinaryProtocol {
  id: string;
  diseaseId: string;
  protocolType: ProtocolType;
  steps: ProtocolStep[];
  requiredEquipment: string[];
  estimatedDuration: number; // in minutes
  difficultyLevel: 'basic' | 'intermediate' | 'advanced';
  prerequisites: string[];
  complications: string[];
  successRate: number; // percentage
  lastUpdated: Date;
  updatedBy: string;
}

export interface ProtocolStep {
  stepNumber: number;
  description: string;
  duration: number; // in minutes
  requiredMedications: string[];
  safetyPrecautions: string[];
  expectedOutcome: string;
}

// Enums
export type DiseaseCategory = 
  | 'metabolic' 
  | 'infectious' 
  | 'reproductive' 
  | 'nutritional' 
  | 'parasitic' 
  | 'respiratory' 
  | 'digestive' 
  | 'musculoskeletal';

export type DiseaseSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type TreatmentOutcome = 
  | 'pending' 
  | 'recovering' 
  | 'recovered' 
  | 'chronic' 
  | 'deceased' 
  | 'euthanized';

export type VaccineType = 
  | 'live_attenuated' 
  | 'inactivated' 
  | 'subunit' 
  | 'toxoid' 
  | 'conjugate' 
  | 'mrna';

export type VaccinationStatus = 
  | 'scheduled' 
  | 'administered' 
  | 'overdue' 
  | 'skipped' 
  | 'reaction_recorded';

export type ProtocolType = 
  | 'diagnosis' 
  | 'treatment' 
  | 'prevention' 
  | 'emergency_care';

export type SeasonalPattern = {
  season: 'spring' | 'summer' | 'monsoon' | 'autumn' | 'winter';
  prevalence: 'low' | 'medium' | 'high';
  riskFactors: string[];
};

// API Response Types
export interface DiseaseListResponse {
  diseases: Disease[];
  total: number;
  page: number;
  limit: number;
}

export interface TreatmentStats {
  totalTreatments: number;
  successfulTreatments: number;
  averageCost: number;
  commonDiseases: Array<{
    diseaseName: string;
    count: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    treatments: number;
    successRate: number;
  }>;
}

export interface VaccinationCompliance {
  totalAnimals: number;
  vaccinatedAnimals: number;
  complianceRate: number;
  overdueVaccinations: number;
  upcomingVaccinations: number;
  diseasesCovered: string[];
}

// Form Types
export interface CreateTreatmentRecordForm {
  animalId: string;
  diseaseId: string;
  symptomsObserved: string[];
  diagnosis: string;
  veterinarianName: string;
  veterinarianLicense?: string;
  treatmentProtocols: Array<{
    medication: string;
    dosage: string;
    duration: string;
    administrationRoute: 'oral' | 'injection' | 'topical' | 'intravenous';
  }>;
  cost: number;
  notes: string;
  followUpRequired: boolean;
  followUpDate?: Date;
}

export interface ScheduleVaccinationForm {
  animalIds: string[]; // array for herd vaccination
  vaccineName: string;
  vaccineType: VaccineType;
  targetDiseases: string[];
  scheduledDate: Date;
  manufacturer: string;
  batchNumber: string;
  expiryDate: Date;
}

// Search and Filter Types
export interface DiseaseSearchFilters {
  category?: DiseaseCategory;
  severity?: DiseaseSeverity;
  animalType?: string;
  zoonoticRisk?: boolean;
  search?: string;
}

export interface TreatmentSearchFilters {
  animalId?: string;
  diseaseId?: string;
  outcome?: TreatmentOutcome;
  veterinarianName?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: 'active' | 'completed';
}

// Analytics Types
export interface DiseaseAnalytics {
  diseaseDistribution: Array<{
    category: DiseaseCategory;
    count: number;
    percentage: number;
  }>;
  severityBreakdown: Array<{
    severity: DiseaseSeverity;
    count: number;
    averageCost: number;
  }>;
  seasonalTrends: Array<{
    month: string;
    totalCases: number;
    topDiseases: string[];
  }>;
  treatmentEffectiveness: Array<{
    diseaseName: string;
    totalCases: number;
  successRate: number;
  averageTreatmentDuration: number;
  }>;
}

// Validation Schemas
export const diseaseValidationSchema = {
  nameEn: { required: true, minLength: 2, maxLength: 100 },
  nameUr: { required: false, minLength: 2, maxLength: 100 },
  category: { required: true, enum: ['metabolic', 'infectious', 'reproductive', 'nutritional', 'parasitic', 'respiratory', 'digestive', 'musculoskeletal'] },
  severity: { required: true, enum: ['mild', 'moderate', 'severe', 'critical'] },
  symptoms: { required: true, minItems: 1 },
  zoonoticRisk: { required: true, type: 'boolean' }
};

export const treatmentRecordValidationSchema = {
  animalId: { required: true },
  diseaseId: { required: true },
  symptomsObserved: { required: true, minItems: 1 },
  diagnosis: { required: true, minLength: 5 },
  veterinarianName: { required: true, minLength: 2 },
  cost: { required: true, min: 0 },
  startDate: { required: true, type: 'date' }
};
