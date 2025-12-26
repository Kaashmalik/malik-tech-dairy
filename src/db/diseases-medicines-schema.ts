// MTK Dairy - Disease & Medicine Management Schema
// Drizzle ORM schema definitions for disease and medicine management system

import {
  pgTable,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

// =====================================================
// ENUMS
// =====================================================

export const medicineCategoryEnum = pgEnum("medicine_category", [
  "antibiotic",
  "anti_inflammatory",
  "antiparasitic",
  "anthelmintic",
  "vaccine",
  "vitamin",
  "mineral",
  "hormonal",
  "antifungal",
  "antiseptic",
  "analgesic",
  "antipyretic",
  "antihistamine",
  "cardiac",
  "respiratory",
  "digestive",
  "reproductive",
  "topical",
]);

export const medicineFormEnum = pgEnum("medicine_form", [
  "injection",
  "oral_liquid",
  "oral_powder",
  "bolus",
  "tablet",
  "capsule",
  "paste",
  "ointment",
  "spray",
  "pour_on",
  "drench",
  "intramammary",
  "implant",
  "suspension",
]);

export const administrationRouteEnum = pgEnum("administration_route", [
  "intramuscular",
  "intravenous",
  "subcutaneous",
  "oral",
  "intramammary",
  "topical",
  "intranasal",
  "intrauterine",
  "per_rectum",
  "pour_on",
]);

// =====================================================
// DISEASES TABLE - Master list of diseases
// =====================================================
export const diseases = pgTable("diseases", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull(),
  nameUrdu: text("name_urdu"),
  localName: text("local_name"), // Common Pakistani/regional names
  category: text("category").notNull(), // metabolic, infectious, reproductive, nutritional, parasitic, respiratory, digestive, musculoskeletal
  subcategory: text("subcategory"),
  causativeAgent: text("causative_agent"), // Bacteria, virus, parasite, etc.
  affectedSpecies: text("affected_species").array().notNull().default(["cow", "buffalo"]), // cow, buffalo, goat, sheep, horse

  // Symptoms
  symptoms: text("symptoms").array().notNull().default([]),
  earlySigns: text("early_signs").array(),
  advancedSigns: text("advanced_signs").array(),

  // Transmission & Risk
  transmissionMode: text("transmission_mode"), // direct contact, vector-borne, airborne, fecal-oral
  incubationPeriod: text("incubation_period"),
  mortalityRate: text("mortality_rate"),
  morbidityRate: text("morbidity_rate"),
  zoonotic: boolean("zoonotic").default(false),

  // Seasonality in Pakistan
  peakSeason: text("peak_season"), // monsoon, summer, winter, year-round
  highRiskRegions: text("high_risk_regions").array(), // Punjab, Sindh, KPK, Balochistan

  // Prevention
  preventiveMeasures: text("preventive_measures").array(),
  vaccinationAvailable: boolean("vaccination_available").default(false),

  // Economic Impact (1-5 scale)
  economicImpactScore: integer("economic_impact_score").default(3),
  milkProductionImpact: text("milk_production_impact"),

  // Metadata
  severityDefault: text("severity_default").default("moderate"), // mild, moderate, severe, critical
  isNotifiable: boolean("is_notifiable").default(false), // Government notification required
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("idx_diseases_category").on(table.category),
  affectedSpeciesIdx: index("idx_diseases_affected_species").using("gin", table.affectedSpecies),
  nameIdx: index("idx_diseases_name").on(table.name),
}));

// =====================================================
// MEDICINES TABLE - Master list of medicines
// =====================================================
export const medicines = pgTable("medicines", {
  id: text("id").primaryKey().default("gen_random_uuid()"),

  // Basic Info
  name: text("name").notNull(),
  genericName: text("generic_name"),
  brandName: text("brand_name"),
  manufacturer: text("manufacturer"), // Star Labs, SAMI Pharma, Hilton, Prix Pharma, etc.

  // Classification
  category: medicineCategoryEnum("category").notNull(),
  form: medicineFormEnum("form").notNull(),
  route: administrationRouteEnum("route").notNull(),

  // Composition
  activeIngredients: jsonb("active_ingredients"), // [{name, concentration, unit}]
  strength: text("strength"), // e.g., "100mg/ml", "20%"

  // Dosage Info
  dosagePerKg: text("dosage_per_kg"), // e.g., "1ml per 10kg"
  dosageInstructions: text("dosage_instructions"),
  frequency: text("frequency"), // e.g., "Once daily for 3-5 days"
  durationDays: integer("duration_days"),

  // Species-specific dosing
  speciesDosage: jsonb("species_dosage"), // {cow: {dose, route}, buffalo: {dose, route}, ...}

  // Precautions
  withdrawalPeriodMilk: integer("withdrawal_period_milk"), // days
  withdrawalPeriodMeat: integer("withdrawal_period_meat"), // days
  contraindications: text("contraindications").array(),
  sideEffects: text("side_effects").array(),
  drugInteractions: text("drug_interactions").array(),
  pregnancySafe: boolean("pregnancy_safe"),
  lactationSafe: boolean("lactation_safe"),

  // Storage
  storageConditions: text("storage_conditions"),
  shelfLifeMonths: integer("shelf_life_months"),

  // Availability in Pakistan
  availableInPakistan: boolean("available_in_pakistan").default(true),
  prescriptionRequired: boolean("prescription_required").default(true),
  priceRangePkr: text("price_range_pkr"), // e.g., "500-1500"
  packSizes: text("pack_sizes").array(), // ["10ml", "50ml", "100ml"]

  // Ratings (based on vet reviews)
  effectivenessRating: decimal("effectiveness_rating", { precision: 3, scale: 2 }).default("4.0"),
  popularityScore: integer("popularity_score").default(50),

  // Metadata
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  categoryIdx: index("idx_medicines_category").on(table.category),
  manufacturerIdx: index("idx_medicines_manufacturer").on(table.manufacturer),
  nameIdx: index("idx_medicines_name").on(table.name),
  genericNameIdx: index("idx_medicines_generic_name").on(table.genericName),
}));

// =====================================================
// DISEASE_TREATMENTS - Links diseases to recommended medicines
// =====================================================
export const diseaseTreatments = pgTable("disease_treatments", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  diseaseId: text("disease_id").notNull().references(() => diseases.id, { onDelete: "cascade" }),
  medicineId: text("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),

  // Treatment details
  isPrimaryTreatment: boolean("is_primary_treatment").default(false),
  treatmentLine: integer("treatment_line").default(1), // 1st line, 2nd line, 3rd line
  effectivenessRating: decimal("effectiveness_rating", { precision: 3, scale: 2 }).default("4.0"),

  // Dosage for this specific disease
  recommendedDosage: text("recommended_dosage"),
  dosagePerKg: text("dosage_per_kg"),
  frequency: text("frequency"),
  durationDays: integer("duration_days"),

  // Species-specific
  forSpecies: text("for_species").array().default(["cow", "buffalo", "goat", "sheep"]),

  // Notes
  specialInstructions: text("special_instructions"),
  whenToUse: text("when_to_use"), // "early stage", "severe cases", "as supportive therapy"

  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  diseaseIdx: index("idx_disease_treatments_disease").on(table.diseaseId),
  medicineIdx: index("idx_disease_treatments_medicine").on(table.medicineId),
  pk: primaryKey({ columns: [table.diseaseId, table.medicineId] }),
}));

// =====================================================
// VACCINATION_SCHEDULES - Recommended vaccination protocols
// =====================================================
export const vaccinationSchedules = pgTable("vaccination_schedules", {
  id: text("id").primaryKey().default("gen_random_uuid()"),

  diseaseId: text("disease_id").references(() => diseases.id, { onDelete: "cascade" }),
  vaccineMedicineId: text("vaccine_medicine_id").references(() => medicines.id, { onDelete: "cascade" }),

  // Schedule details
  species: text("species").notNull(), // cow, buffalo, goat, sheep
  animalAgeStartMonths: integer("animal_age_start_months"), // Minimum age for first dose
  animalAgeStartLabel: text("animal_age_start_label"), // "3 months", "At birth"

  // Doses
  doseNumber: integer("dose_number").default(1),
  intervalFromPreviousDays: integer("interval_from_previous_days"), // Days after previous dose
  boosterIntervalMonths: integer("booster_interval_months"), // For annual/periodic boosters

  // Timing
  recommendedSeason: text("recommended_season"), // "Before monsoon", "Pre-winter"
  recommendedMonths: text("recommended_months").array(), // ["March", "April", "September"]

  // Administration
  route: administrationRouteEnum("route"),
  dosage: text("dosage"),

  // Priority (for Pakistan context)
  priority: text("priority").default("recommended"), // essential, recommended, optional
  governmentProgram: boolean("government_program").default(false), // Part of govt vaccination drive

  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  speciesIdx: index("idx_vaccination_schedules_species").on(table.species),
  diseaseIdx: index("idx_vaccination_schedules_disease").on(table.diseaseId),
}));

// =====================================================
// TREATMENT_PROTOCOLS - Standard treatment protocols
// =====================================================
export const treatmentProtocols = pgTable("treatment_protocols", {
  id: text("id").primaryKey().default("gen_random_uuid()"),

  diseaseId: text("disease_id").notNull().references(() => diseases.id, { onDelete: "cascade" }),

  // Protocol info
  name: text("name").notNull(),
  protocolType: text("protocol_type").notNull(), // diagnosis, treatment, prevention, emergency_care
  severityLevel: text("severity_level"), // mild, moderate, severe, critical

  // Steps
  steps: jsonb("steps").notNull(), // [{order, action, duration, notes}]

  // Medicines in protocol
  medicinesRequired: jsonb("medicines_required"), // [{medicine_id, dosage, frequency, duration}]

  // Supportive care
  supportiveCare: text("supportive_care").array(),
  dietaryRecommendations: text("dietary_recommendations").array(),
  isolationRequired: boolean("isolation_required").default(false),

  // Expected outcomes
  expectedRecoveryDays: integer("expected_recovery_days"),
  successRate: text("success_rate"),

  // When to escalate
  escalationSigns: text("escalation_signs").array(),
  referToVetWhen: text("refer_to_vet_when").array(),

  // Source
  source: text("source"), // "Pakistan Veterinary Guidelines", "Star Labs Protocol"

  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  diseaseIdx: index("idx_treatment_protocols_disease").on(table.diseaseId),
  typeIdx: index("idx_treatment_protocols_type").on(table.protocolType),
}));

// =====================================================
// TENANT_MEDICINE_INVENTORY - Farm's medicine stock
// =====================================================
export const tenantMedicineInventory = pgTable("tenant_medicine_inventory", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  tenantId: text("tenant_id").notNull(),
  medicineId: text("medicine_id").notNull().references(() => medicines.id, { onDelete: "cascade" }),

  // Stock info
  quantity: integer("quantity").notNull().default(0),
  unit: text("unit"), // ml, tablets, vials, etc.
  batchNumber: text("batch_number"),

  // Dates
  purchaseDate: timestamp("purchase_date"),
  expiryDate: timestamp("expiry_date"),

  // Cost
  purchasePrice: integer("purchase_price"), // in smallest currency unit (paise)
  supplier: text("supplier"),

  // Location
  storageLocation: text("storage_location"),

  // Thresholds
  reorderLevel: integer("reorder_level").default(5),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_tenant_medicine_inventory_tenant").on(table.tenantId),
  medicineIdx: index("idx_tenant_medicine_inventory_medicine").on(table.medicineId),
  expiryIdx: index("idx_tenant_medicine_inventory_expiry").on(table.expiryDate),
  pk: primaryKey({ columns: [table.tenantId, table.medicineId, table.batchNumber] }),
}));

// =====================================================
// ANIMAL_TREATMENTS - Records of treatments given to animals
// =====================================================
export const animalTreatments = pgTable("animal_treatments", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  tenantId: text("tenant_id").notNull(),
  animalId: text("animal_id").notNull(),
  healthRecordId: text("health_record_id"), // Link to existing health_records table

  // Disease/Condition
  diseaseId: text("disease_id").references(() => diseases.id),
  conditionName: text("condition_name"), // For custom conditions not in disease list
  symptomsObserved: text("symptoms_observed").array(),

  // Diagnosis
  diagnosisDate: timestamp("diagnosis_date").notNull(),
  diagnosedBy: text("diagnosed_by"),
  diagnosisMethod: text("diagnosis_method"), // clinical_exam, lab_test, ultrasound
  severity: text("severity").default("moderate"),

  // Treatment
  treatmentProtocolId: text("treatment_protocol_id").references(() => treatmentProtocols.id),
  treatmentStartDate: timestamp("treatment_start_date").notNull(),
  treatmentEndDate: timestamp("treatment_end_date"),

  // Medicines administered
  medicinesGiven: jsonb("medicines_given"), // [{medicine_id, dosage, frequency, start_date, end_date, administered_by}]

  // Outcome
  status: text("status").default("in_treatment"), // in_treatment, recovering, recovered, chronic, deceased
  outcomeDate: timestamp("outcome_date"),
  outcomeNotes: text("outcome_notes"),

  // Follow-up
  followUpRequired: boolean("follow_up_required").default(false),
  nextFollowUpDate: timestamp("next_follow_up_date"),

  // Cost tracking
  totalCost: integer("total_cost").default(0),

  // Metadata
  recordedBy: text("recorded_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_animal_treatments_tenant").on(table.tenantId),
  animalIdx: index("idx_animal_treatments_animal").on(table.animalId),
  diseaseIdx: index("idx_animal_treatments_disease").on(table.diseaseId),
  statusIdx: index("idx_animal_treatments_status").on(table.status),
}));

// =====================================================
// ANIMAL_VACCINATIONS - Vaccination records for animals
// =====================================================
export const animalVaccinations = pgTable("animal_vaccinations", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  tenantId: text("tenant_id").notNull(),
  animalId: text("animal_id").notNull(),

  // Vaccine info
  vaccineId: text("vaccine_id").references(() => medicines.id),
  diseaseId: text("disease_id").references(() => diseases.id),
  vaccineName: text("vaccine_name"), // For custom/unlisted vaccines

  // Administration
  vaccinationDate: timestamp("vaccination_date").notNull(),
  administeredBy: text("administered_by"),
  batchNumber: text("batch_number"),

  // Dosage
  doseNumber: integer("dose_number").default(1),
  dosage: text("dosage"),
  route: administrationRouteEnum("route"),
  injectionSite: text("injection_site"),

  // Schedule
  scheduleId: text("schedule_id").references(() => vaccinationSchedules.id),
  nextDueDate: timestamp("next_due_date"),

  // Reaction tracking
  adverseReaction: boolean("adverse_reaction").default(false),
  reactionDetails: text("reaction_details"),
  reactionSeverity: text("reaction_severity"), // mild, moderate, severe

  // Cost
  cost: integer("cost"),

  // Status
  status: text("status").default("administered"), // scheduled, administered, overdue, skipped

  // Metadata
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  tenantIdx: index("idx_animal_vaccinations_tenant").on(table.tenantId),
  animalIdx: index("idx_animal_vaccinations_animal").on(table.animalId),
  vaccineIdx: index("idx_animal_vaccinations_vaccine").on(table.vaccineId),
  nextDueIdx: index("idx_animal_vaccinations_next_due").on(table.nextDueDate),
}));

// =====================================================
// TYPE EXPORTS
// =====================================================

export type Disease = typeof diseases.$inferSelect;
export type NewDisease = typeof diseases.$inferInsert;

export type Medicine = typeof medicines.$inferSelect;
export type NewMedicine = typeof medicines.$inferInsert;

export type DiseaseTreatment = typeof diseaseTreatments.$inferSelect;
export type NewDiseaseTreatment = typeof diseaseTreatments.$inferInsert;

export type VaccinationSchedule = typeof vaccinationSchedules.$inferSelect;
export type NewVaccinationSchedule = typeof vaccinationSchedules.$inferInsert;

export type TreatmentProtocol = typeof treatmentProtocols.$inferSelect;
export type NewTreatmentProtocol = typeof treatmentProtocols.$inferInsert;

export type TenantMedicineInventory = typeof tenantMedicineInventory.$inferSelect;
export type NewTenantMedicineInventory = typeof tenantMedicineInventory.$inferInsert;

export type AnimalTreatment = typeof animalTreatments.$inferSelect;
export type NewAnimalTreatment = typeof animalTreatments.$inferInsert;

export type AnimalVaccination = typeof animalVaccinations.$inferSelect;
export type NewAnimalVaccination = typeof animalVaccinations.$inferInsert;
