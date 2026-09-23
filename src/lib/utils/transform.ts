/**
 * Data Transformation Utilities
 *
 * Handles snake_case (database) <-> camelCase (API) transformations
 */

/**
 * Convert snake_case string to camelCase
 */
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert camelCase string to snake_case
 */
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Transform object keys from snake_case to camelCase
 */
export function transformFromDb<T extends Record<string, unknown>>(
  data: Record<string, unknown>
): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const camelKey = snakeToCamel(key);

    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[camelKey] = value.map(item =>
          typeof item === 'object' && item !== null
            ? transformFromDb(item as Record<string, unknown>)
            : item
        );
      } else {
        result[camelKey] = transformFromDb(value as Record<string, unknown>);
      }
    } else {
      result[camelKey] = value;
    }
  }

  return result as T;
}

/**
 * Transform object keys from camelCase to snake_case
 */
export function transformToDb<T extends Record<string, unknown>>(data: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const snakeKey = camelToSnake(key);

    // Handle nested objects and arrays
    if (value !== null && typeof value === 'object') {
      if (Array.isArray(value)) {
        result[snakeKey] = value.map(item =>
          typeof item === 'object' && item !== null
            ? transformToDb(item as Record<string, unknown>)
            : item
        );
      } else {
        result[snakeKey] = transformToDb(value as Record<string, unknown>);
      }
    } else {
      result[snakeKey] = value;
    }
  }

  return result as T;
}

/**
 * Transform array of objects from snake_case to camelCase
 */
export function transformArrayFromDb<T extends Record<string, unknown>>(
  data: Record<string, unknown>[]
): T[] {
  return data.map(item => transformFromDb<T>(item));
}

/**
 * Transform array of objects from camelCase to snake_case
 */
export function transformArrayToDb<T extends Record<string, unknown>>(
  data: Record<string, unknown>[]
): T[] {
  return data.map(item => transformToDb<T>(item));
}

/**
 * Animal-specific transformation from DB
 */
export interface AnimalFromDb {
  id: string;
  tenant_id: string;
  tag: string;
  name: string | null;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  gender: string;
  photo_url: string | null;
  status: string;
  purchase_date: string | null;
  purchase_price: number | null;
  current_weight: number | null;
  last_health_check: string | null;
  parent_id: string | null;
  notes: string | null;
  custom_fields: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Animal {
  id: string;
  tenantId: string;
  tag: string;
  name: string | null;
  species: string;
  breed: string | null;
  dateOfBirth: string | null;
  gender: string;
  photoUrl: string | null;
  status: string;
  purchaseDate: string | null;
  purchasePrice: number | null;
  currentWeight: number | null;
  lastHealthCheck: string | null;
  parentId: string | null;
  notes: string | null;
  customFields: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function transformAnimal(animal: AnimalFromDb): Animal {
  return {
    id: animal.id,
    tenantId: animal.tenant_id,
    tag: animal.tag,
    name: animal.name,
    species: animal.species,
    breed: animal.breed,
    dateOfBirth: animal.date_of_birth,
    gender: animal.gender,
    photoUrl: animal.photo_url,
    status: animal.status,
    purchaseDate: animal.purchase_date,
    purchasePrice: animal.purchase_price,
    currentWeight: animal.current_weight,
    lastHealthCheck: animal.last_health_check,
    parentId: animal.parent_id,
    notes: animal.notes,
    customFields: animal.custom_fields,
    createdAt: animal.created_at,
    updatedAt: animal.updated_at,
  };
}

export function transformAnimals(animals: AnimalFromDb[]): Animal[] {
  return animals.map(transformAnimal);
}

/**
 * Milk Log transformation
 */
export interface MilkLogFromDb {
  id: string;
  tenant_id: string;
  animal_id: string;
  animals?: {
    tag: string;
    name: string | null;
  } | null;
  date: string;
  session: string;
  quantity: number;
  quality: string | null;
  fat: number | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface MilkLog {
  id: string;
  tenantId: string;
  animalId: string;
  animalTag?: string;
  animalName?: string | null;
  date: string;
  session: string;
  quantity: number;
  quality: string | null;
  fat: number | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
}

export function transformMilkLog(log: MilkLogFromDb): MilkLog {
  return {
    id: log.id,
    tenantId: log.tenant_id,
    animalId: log.animal_id,
    animalTag: log.animals?.tag,
    animalName: log.animals?.name,
    date: log.date,
    session: log.session,
    quantity: log.quantity,
    quality: log.quality,
    fat: log.fat,
    notes: log.notes,
    recordedBy: log.recorded_by,
    createdAt: log.created_at,
  };
}

export function transformMilkLogs(logs: MilkLogFromDb[]): MilkLog[] {
  return logs.map(transformMilkLog);
}

/**
 * Health Record transformation
 * DB columns: type, date, veterinarian, next_due_date (see health_records schema)
 */
export interface HealthRecordFromDb {
  id: string;
  tenant_id: string;
  animal_id: string;
  type: string;
  date: string;
  description: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  medication?: string | null;
  cost: number | null;
  veterinarian: string | null;
  next_due_date: string | null;
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
  updated_at?: string | null;
  // Legacy column aliases (older rows / migrations)
  record_type?: string;
  vet_name?: string;
  next_checkup?: string | null;
}

export interface HealthRecord {
  id: string;
  tenantId: string;
  animalId: string;
  type: string;
  date: string;
  description: string | null;
  diagnosis: string | null;
  treatment: string | null;
  medication: string | null;
  cost: number | null;
  veterinarian: string | null;
  nextDueDate: string | null;
  notes: string | null;
  recordedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  // Back-compat aliases used by older UI
  recordType: string;
  vetName: string | null;
  nextCheckup: string | null;
}

export function transformHealthRecord(record: HealthRecordFromDb): HealthRecord {
  const type = record.type || record.record_type || '';
  const veterinarian = record.veterinarian ?? record.vet_name ?? null;
  const nextDueDate = record.next_due_date ?? record.next_checkup ?? null;

  return {
    id: record.id,
    tenantId: record.tenant_id,
    animalId: record.animal_id,
    type,
    date: record.date,
    description: record.description,
    diagnosis: record.diagnosis ?? null,
    treatment: record.treatment ?? null,
    medication: record.medication ?? null,
    cost: record.cost,
    veterinarian,
    nextDueDate,
    notes: record.notes ?? null,
    recordedBy: record.recorded_by ?? null,
    createdAt: record.created_at,
    updatedAt: record.updated_at ?? null,
    recordType: type,
    vetName: veterinarian,
    nextCheckup: nextDueDate,
  };
}

export function transformHealthRecords(records: HealthRecordFromDb[]): HealthRecord[] {
  return records.map(transformHealthRecord);
}

/**
 * Breeding Record transformation
 */
export interface BreedingRecordFromDb {
  id: string;
  tenant_id: string;
  female_id: string;
  male_id: string | null;
  breeding_date: string;
  breeding_type: string;
  expected_due_date: string | null;
  actual_birth_date: string | null;
  offspring_count: number | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BreedingRecord {
  id: string;
  tenantId: string;
  femaleId: string;
  maleId: string | null;
  breedingDate: string;
  breedingType: string;
  expectedDueDate: string | null;
  actualBirthDate: string | null;
  offspringCount: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function transformBreedingRecord(record: BreedingRecordFromDb): BreedingRecord {
  return {
    id: record.id,
    tenantId: record.tenant_id,
    femaleId: record.female_id,
    maleId: record.male_id,
    breedingDate: record.breeding_date,
    breedingType: record.breeding_type,
    expectedDueDate: record.expected_due_date,
    actualBirthDate: record.actual_birth_date,
    offspringCount: record.offspring_count,
    status: record.status,
    notes: record.notes,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

export function transformBreedingRecords(records: BreedingRecordFromDb[]): BreedingRecord[] {
  return records.map(transformBreedingRecord);
}
