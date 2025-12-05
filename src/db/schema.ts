// Drizzle ORM Schema for Supabase PostgreSQL
// PRIMARY DATABASE - All core data stored here
// Firebase Firestore is ONLY used for real-time activity feeds (limited to 50K reads/day)
import { pgTable, text, timestamp, boolean, jsonb, integer, varchar, pgEnum, index, uniqueIndex, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'professional', 'farm', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'trial', 'expired', 'cancelled', 'past_due', 'pending_approval']);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['jazzcash', 'easypaisa', 'xpay', 'bank_transfer']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded', 'manual_verification']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'read', 'login', 'logout']);
export const farmApplicationStatusEnum = pgEnum('farm_application_status', ['pending', 'payment_uploaded', 'under_review', 'approved', 'rejected']);
export const userPlatformRoleEnum = pgEnum('user_platform_role', ['super_admin', 'admin', 'user']);
export const storageProviderEnum = pgEnum('storage_provider', ['cloudinary', 'supabase']);

// Veterinary System Enums
export const diseaseCategoryEnum = pgEnum('disease_category', ['metabolic', 'infectious', 'reproductive', 'nutritional', 'parasitic', 'respiratory', 'digestive', 'musculoskeletal']);
export const diseaseSeverityEnum = pgEnum('disease_severity', ['mild', 'moderate', 'severe', 'critical']);
export const treatmentOutcomeEnum = pgEnum('treatment_outcome', ['pending', 'recovering', 'recovered', 'chronic', 'deceased', 'euthanized']);
export const vaccineTypeEnum = pgEnum('vaccine_type', ['live_attenuated', 'inactivated', 'subunit', 'toxoid', 'conjugate', 'mrna']);
export const vaccinationStatusEnum = pgEnum('vaccination_status', ['scheduled', 'administered', 'overdue', 'skipped', 'reaction_recorded']);
export const protocolTypeEnum = pgEnum('protocol_type', ['diagnosis', 'treatment', 'prevention', 'emergency_care']);

// Feed Management Enums
export const feedTypeEnum = pgEnum('feed_type', ['concentrate', 'silage', 'hay', 'minerals', 'supplements', 'water']);
export const feedUnitEnum = pgEnum('feed_unit', ['kg', 'liters', 'grams', 'tons']);

// Staff Management Enums
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed', 'overdue', 'cancelled']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'urgent']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'late', 'on_leave']);

// IoT Device Enums
export const deviceTypeEnum = pgEnum('device_type', ['milk_meter', 'activity_monitor', 'temperature_sensor', 'automatic_feeder', 'water_meter', 'gps_tracker']);
export const deviceStatusEnum = pgEnum('device_status', ['active', 'inactive', 'maintenance', 'error', 'offline']);

// Milk Quality Enums
export const qualityGradeEnum = pgEnum('quality_grade', ['premium', 'grade_a', 'grade_b', 'grade_c', 'rejected']);
export const testStatusEnum = pgEnum('test_status', ['pending', 'passed', 'failed', 'requires_retest']);

// Tenants table - Core tenant metadata
export const tenants = pgTable('tenants', {
  id: text('id').primaryKey(), // Clerk organization ID
  slug: varchar('slug', { length: 255 }).notNull(),
  farmName: varchar('farm_name', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#1F7A3D'),
  accentColor: varchar('accent_color', { length: 7 }).default('#F59E0B'),
  language: varchar('language', { length: 10 }).default('en'),
  currency: varchar('currency', { length: 3 }).default('PKR'),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Karachi'),
  animalTypes: jsonb('animal_types').$type<string[]>().default(['cow', 'buffalo', 'chicken']),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
}, (table) => ({
  slugIdx: uniqueIndex('tenants_slug_idx').on(table.slug),
  deletedAtIdx: index('tenants_deleted_at_idx').on(table.deletedAt),
}));

// Subscriptions table
export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  plan: subscriptionPlanEnum('plan').notNull().default('free'),
  status: subscriptionStatusEnum('status').notNull().default('trial'),
  gateway: paymentGatewayEnum('gateway').notNull().default('bank_transfer'),
  renewDate: timestamp('renew_date').notNull(),
  token: text('token'), // Payment token for recurring billing
  amount: integer('amount').notNull().default(0), // Amount in smallest currency unit (paise for PKR)
  currency: varchar('currency', { length: 3 }).default('PKR'),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: uniqueIndex('subscriptions_tenant_id_idx').on(table.tenantId),
  statusIdx: index('subscriptions_status_idx').on(table.status),
  renewDateIdx: index('subscriptions_renew_date_idx').on(table.renewDate),
}));

// Payments table
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // Amount in smallest currency unit
  currency: varchar('currency', { length: 3 }).default('PKR'),
  gateway: paymentGatewayEnum('gateway').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  transactionId: text('transaction_id'),
  plan: subscriptionPlanEnum('plan').notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(), // Gateway-specific data
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('payments_tenant_id_idx').on(table.tenantId),
  statusIdx: index('payments_status_idx').on(table.status),
  transactionIdIdx: index('payments_transaction_id_idx').on(table.transactionId),
  createdAtIdx: index('payments_created_at_idx').on(table.createdAt),
}));

// API Keys table
export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  keyHash: text('key_hash').notNull(), // Hashed API key (bcrypt)
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(), // First 8-11 chars for identification
  permissions: jsonb('permissions').$type<string[]>().notNull(), // ['milk_logs', 'health_records', 'read_only']
  isActive: boolean('is_active').default(true).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  createdBy: text('created_by').notNull(), // User ID
}, (table) => ({
  tenantIdIdx: index('api_keys_tenant_id_idx').on(table.tenantId),
  keyPrefixIdx: index('api_keys_key_prefix_idx').on(table.keyPrefix),
  isActiveIdx: index('api_keys_is_active_idx').on(table.isActive),
}));

// Audit Logs table
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id, { onDelete: 'set null' }), // Nullable for platform-level actions
  userId: text('user_id').notNull(),
  action: auditActionEnum('action').notNull(),
  resource: varchar('resource', { length: 100 }).notNull(), // 'animal', 'milk_log', 'subscription', etc.
  resourceId: text('resource_id'),
  details: jsonb('details').$type<Record<string, any>>(), // Additional context
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('audit_logs_tenant_id_idx').on(table.tenantId),
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  tenantResourceIdx: index('audit_logs_tenant_resource_idx').on(table.tenantId, table.resource),
}));

// Custom Fields Configuration table
export const customFieldsConfig = pgTable('custom_fields_config', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  fields: jsonb('fields').$type<Array<{
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'dropdown';
    required?: boolean;
    options?: string[];
    defaultValue?: string | number;
  }>>().notNull().default([]),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: uniqueIndex('custom_fields_config_tenant_id_idx').on(table.tenantId),
}));

// Platform Users table - All users with their platform roles
export const platformUsers = pgTable('platform_users', {
  id: text('id').primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: text('avatar_url'),
  platformRole: userPlatformRoleEnum('platform_role').notNull().default('user'),
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('platform_users_email_idx').on(table.email),
  platformRoleIdx: index('platform_users_platform_role_idx').on(table.platformRole),
}));

// Farm Applications table - When users apply for a new farm
export const farmApplications = pgTable('farm_applications', {
  id: text('id').primaryKey(),
  applicantId: text('applicant_id').notNull().references(() => platformUsers.id),
  farmName: varchar('farm_name', { length: 255 }).notNull(),
  ownerName: varchar('owner_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  province: varchar('province', { length: 100 }),
  animalTypes: jsonb('animal_types').$type<string[]>().default(['cow', 'buffalo']),
  estimatedAnimals: integer('estimated_animals').default(10),
  requestedPlan: subscriptionPlanEnum('requested_plan').notNull().default('free'),
  status: farmApplicationStatusEnum('status').notNull().default('pending'),
  // Payment slip details
  paymentSlipUrl: text('payment_slip_url'),
  paymentSlipProvider: storageProviderEnum('payment_slip_provider'),
  paymentAmount: integer('payment_amount'), // Amount in PKR
  paymentDate: timestamp('payment_date'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  // Admin review
  reviewedBy: text('reviewed_by').references(() => platformUsers.id),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  rejectionReason: text('rejection_reason'),
  // Assigned farm details (after approval)
  assignedTenantId: text('assigned_tenant_id').references(() => tenants.id),
  assignedFarmId: varchar('assigned_farm_id', { length: 50 }), // e.g., MTD-2024-0001
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  applicantIdIdx: index('farm_applications_applicant_id_idx').on(table.applicantId),
  statusIdx: index('farm_applications_status_idx').on(table.status),
  assignedFarmIdIdx: uniqueIndex('farm_applications_assigned_farm_id_idx').on(table.assignedFarmId),
  createdAtIdx: index('farm_applications_created_at_idx').on(table.createdAt),
}));

// File Uploads table - Track all uploaded files (Cloudinary primary, Supabase backup)
export const fileUploads = pgTable('file_uploads', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  uploadedBy: text('uploaded_by').notNull().references(() => platformUsers.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(), // image/jpeg, application/pdf, etc.
  fileSize: integer('file_size').notNull(), // in bytes
  provider: storageProviderEnum('provider').notNull().default('cloudinary'),
  publicId: text('public_id'), // Cloudinary public_id
  url: text('url').notNull(),
  secureUrl: text('secure_url'),
  thumbnailUrl: text('thumbnail_url'),
  folder: varchar('folder', { length: 100 }), // e.g., 'animals', 'payment-slips', 'logos'
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('file_uploads_tenant_id_idx').on(table.tenantId),
  uploadedByIdx: index('file_uploads_uploaded_by_idx').on(table.uploadedBy),
  folderIdx: index('file_uploads_folder_idx').on(table.folder),
}));

// Animals table - Core animal data (moved from Firestore to Supabase)
export const animals = pgTable('animals', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  tag: varchar('tag', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }),
  species: varchar('species', { length: 20 }).notNull(), // cow, buffalo, chicken, goat, sheep, horse
  breed: varchar('breed', { length: 100 }),
  dateOfBirth: timestamp('date_of_birth'),
  gender: varchar('gender', { length: 10 }).notNull(), // male, female
  photoUrl: text('photo_url'),
  photoProvider: storageProviderEnum('photo_provider'),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, sold, deceased, sick
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: integer('purchase_price'),
  weight: integer('weight'), // in kg
  color: varchar('color', { length: 50 }),
  motherId: text('mother_id'),
  fatherId: text('father_id'),
  notes: text('notes'),
  customFields: jsonb('custom_fields').$type<Record<string, unknown>>(),
  createdBy: text('created_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('animals_tenant_id_idx').on(table.tenantId),
  tagIdx: index('animals_tag_idx').on(table.tag),
  speciesIdx: index('animals_species_idx').on(table.species),
  statusIdx: index('animals_status_idx').on(table.status),
  tenantTagIdx: uniqueIndex('animals_tenant_tag_idx').on(table.tenantId, table.tag),
}));

// Milk Logs table - Daily milk production records
export const milkLogs = pgTable('milk_logs', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').notNull().references(() => animals.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
  session: varchar('session', { length: 10 }).notNull(), // morning, evening
  quantity: integer('quantity').notNull(), // in ml (stored as integer for precision)
  quality: integer('quality'), // 1-10 scale
  fat: integer('fat'), // percentage * 100 (e.g., 450 = 4.5%)
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('milk_logs_tenant_id_idx').on(table.tenantId),
  animalIdIdx: index('milk_logs_animal_id_idx').on(table.animalId),
  dateIdx: index('milk_logs_date_idx').on(table.date),
  tenantDateIdx: index('milk_logs_tenant_date_idx').on(table.tenantId, table.date),
}));

// Health Records table
export const healthRecords = pgTable('health_records', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').notNull().references(() => animals.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 20 }).notNull(), // vaccination, treatment, checkup, disease
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  veterinarian: varchar('veterinarian', { length: 100 }),
  cost: integer('cost'),
  nextDueDate: timestamp('next_due_date'),
  attachments: jsonb('attachments').$type<string[]>(),
  recordedBy: text('recorded_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('health_records_tenant_id_idx').on(table.tenantId),
  animalIdIdx: index('health_records_animal_id_idx').on(table.animalId),
  typeIdx: index('health_records_type_idx').on(table.type),
  dateIdx: index('health_records_date_idx').on(table.date),
}));

// Breeding Records table
export const breedingRecords = pgTable('breeding_records', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').notNull().references(() => animals.id, { onDelete: 'cascade' }),
  sireId: text('sire_id').references(() => animals.id),
  breedingDate: timestamp('breeding_date').notNull(),
  expectedCalvingDate: timestamp('expected_calving_date'),
  actualCalvingDate: timestamp('actual_calving_date'),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'), // in_progress, pregnant, calved, failed
  offspringId: text('offspring_id').references(() => animals.id),
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('breeding_records_tenant_id_idx').on(table.tenantId),
  animalIdIdx: index('breeding_records_animal_id_idx').on(table.animalId),
  statusIdx: index('breeding_records_status_idx').on(table.status),
}));

// Expenses table
export const expenses = pgTable('expenses', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  category: varchar('category', { length: 50 }).notNull(), // feed, medicine, labor, equipment, utilities, other
  description: text('description').notNull(),
  amount: integer('amount').notNull(), // in smallest currency unit
  currency: varchar('currency', { length: 3 }).default('PKR'),
  vendorName: varchar('vendor_name', { length: 100 }),
  receiptUrl: text('receipt_url'),
  recordedBy: text('recorded_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('expenses_tenant_id_idx').on(table.tenantId),
  dateIdx: index('expenses_date_idx').on(table.date),
  categoryIdx: index('expenses_category_idx').on(table.category),
}));

// Sales table
export const sales = pgTable('sales', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // milk, animal, egg, other
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 20 }).notNull(), // liters, kg, pieces
  pricePerUnit: integer('price_per_unit').notNull(),
  total: integer('total').notNull(),
  currency: varchar('currency', { length: 3 }).default('PKR'),
  buyerName: varchar('buyer_name', { length: 100 }),
  buyerPhone: varchar('buyer_phone', { length: 20 }),
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('sales_tenant_id_idx').on(table.tenantId),
  dateIdx: index('sales_date_idx').on(table.date),
  typeIdx: index('sales_type_idx').on(table.type),
}));

// Staff/Members table - Users assigned to tenants with roles
export const tenantMembers = pgTable('tenant_members', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => platformUsers.id),
  role: varchar('role', { length: 30 }).notNull(), // farm_owner, farm_manager, veterinarian, etc.
  salary: integer('salary'),
  joinDate: timestamp('join_date').defaultNow(),
  status: varchar('status', { length: 20 }).default('active'), // active, inactive
  permissions: jsonb('permissions').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('tenant_members_tenant_id_idx').on(table.tenantId),
  userIdIdx: index('tenant_members_user_id_idx').on(table.userId),
  tenantUserIdx: uniqueIndex('tenant_members_tenant_user_idx').on(table.tenantId, table.userId),
}));

// Farm ID Sequence table - For generating unique Farm IDs
export const farmIdSequence = pgTable('farm_id_sequence', {
  id: serial('id').primaryKey(),
  year: integer('year').notNull(),
  lastNumber: integer('last_number').notNull().default(0),
}, (table) => ({
  yearIdx: uniqueIndex('farm_id_sequence_year_idx').on(table.year),
}));

// Relations
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  subscription: one(subscriptions, {
    fields: [tenants.id],
    references: [subscriptions.tenantId],
  }),
  payments: many(payments),
  apiKeys: many(apiKeys),
  auditLogs: many(auditLogs),
  customFieldsConfig: one(customFieldsConfig, {
    fields: [tenants.id],
    references: [customFieldsConfig.tenantId],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [payments.tenantId],
    references: [tenants.id],
  }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, {
    fields: [apiKeys.tenantId],
    references: [tenants.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [auditLogs.tenantId],
    references: [tenants.id],
  }),
}));

export const customFieldsConfigRelations = relations(customFieldsConfig, ({ one }) => ({
  tenant: one(tenants, {
    fields: [customFieldsConfig.tenantId],
    references: [tenants.id],
  }),
}));

// New Relations for added tables
export const platformUsersRelations = relations(platformUsers, ({ many }) => ({
  farmApplications: many(farmApplications),
  fileUploads: many(fileUploads),
  tenantMemberships: many(tenantMembers),
}));

export const farmApplicationsRelations = relations(farmApplications, ({ one }) => ({
  applicant: one(platformUsers, {
    fields: [farmApplications.applicantId],
    references: [platformUsers.id],
  }),
  reviewer: one(platformUsers, {
    fields: [farmApplications.reviewedBy],
    references: [platformUsers.id],
  }),
  assignedTenant: one(tenants, {
    fields: [farmApplications.assignedTenantId],
    references: [tenants.id],
  }),
}));

export const fileUploadsRelations = relations(fileUploads, ({ one }) => ({
  tenant: one(tenants, {
    fields: [fileUploads.tenantId],
    references: [tenants.id],
  }),
  uploader: one(platformUsers, {
    fields: [fileUploads.uploadedBy],
    references: [platformUsers.id],
  }),
}));

export const animalsRelations = relations(animals, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [animals.tenantId],
    references: [tenants.id],
  }),
  creator: one(platformUsers, {
    fields: [animals.createdBy],
    references: [platformUsers.id],
  }),
  milkLogs: many(milkLogs),
  healthRecords: many(healthRecords),
  breedingRecords: many(breedingRecords),
}));

export const milkLogsRelations = relations(milkLogs, ({ one }) => ({
  tenant: one(tenants, {
    fields: [milkLogs.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [milkLogs.animalId],
    references: [animals.id],
  }),
  recorder: one(platformUsers, {
    fields: [milkLogs.recordedBy],
    references: [platformUsers.id],
  }),
}));

export const healthRecordsRelations = relations(healthRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [healthRecords.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [healthRecords.animalId],
    references: [animals.id],
  }),
  recorder: one(platformUsers, {
    fields: [healthRecords.recordedBy],
    references: [platformUsers.id],
  }),
}));

export const breedingRecordsRelations = relations(breedingRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [breedingRecords.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [breedingRecords.animalId],
    references: [animals.id],
  }),
  sire: one(animals, {
    fields: [breedingRecords.sireId],
    references: [animals.id],
  }),
  offspring: one(animals, {
    fields: [breedingRecords.offspringId],
    references: [animals.id],
  }),
  recorder: one(platformUsers, {
    fields: [breedingRecords.recordedBy],
    references: [platformUsers.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  tenant: one(tenants, {
    fields: [expenses.tenantId],
    references: [tenants.id],
  }),
  recorder: one(platformUsers, {
    fields: [expenses.recordedBy],
    references: [platformUsers.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  tenant: one(tenants, {
    fields: [sales.tenantId],
    references: [tenants.id],
  }),
  recorder: one(platformUsers, {
    fields: [sales.recordedBy],
    references: [platformUsers.id],
  }),
}));

export const tenantMembersRelations = relations(tenantMembers, ({ one }) => ({
  tenant: one(tenants, {
    fields: [tenantMembers.tenantId],
    references: [tenants.id],
  }),
  user: one(platformUsers, {
    fields: [tenantMembers.userId],
    references: [platformUsers.id],
  }),
}));

// ============================================================================
// VETERINARY SYSTEM TABLES
// ============================================================================

// Diseases table - Comprehensive disease database
export const diseases = pgTable('diseases', {
  id: text('id').primaryKey(),
  category: diseaseCategoryEnum('category').notNull(),
  nameEn: varchar('name_en', { length: 255 }).notNull(),
  nameUr: varchar('name_ur', { length: 255 }),
  symptoms: jsonb('symptoms').$type<string[]>().notNull(),
  diagnosisMethods: jsonb('diagnosis_methods').$type<string[]>().notNull(),
  treatmentProtocols: jsonb('treatment_protocols').$type<Array<{
    medication: string;
    dosage: string;
    duration: string;
    administrationRoute: string;
    veterinaryRequired: boolean;
  }>>().notNull(),
  preventionTips: jsonb('prevention_tips').$type<string[]>().notNull(),
  severity: diseaseSeverityEnum('severity').notNull(),
  zoonoticRisk: boolean('zoonotic_risk').default(false).notNull(),
  estimatedCostMin: integer('estimated_cost_min').default(0),
  estimatedCostMax: integer('estimated_cost_max').default(0),
  commonInAnimalTypes: jsonb('common_in_animal_types').$type<string[]>().default(['cow', 'buffalo']),
  seasonalPrevalence: jsonb('seasonal_prevalence').$type<Array<{
    season: string;
    prevalence: string;
    riskFactors: string[];
  }>>().default([]),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('diseases_category_idx').on(table.category),
  severityIdx: index('diseases_severity_idx').on(table.severity),
  nameEnIdx: index('diseases_name_en_idx').on(table.nameEn),
  isActiveIdx: index('diseases_is_active_idx').on(table.isActive),
}));

// Treatment Records table
export const treatmentRecords = pgTable('treatment_records', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').notNull().references(() => animals.id, { onDelete: 'cascade' }),
  diseaseId: text('disease_id').notNull().references(() => diseases.id, { onDelete: 'restrict' }),
  symptomsObserved: jsonb('symptoms_observed').$type<string[]>().notNull(),
  diagnosis: text('diagnosis').notNull(),
  treatmentGiven: jsonb('treatment_given').$type<Array<{
    medication: string;
    dosage: string;
    duration: string;
    administrationRoute: string;
  }>>().notNull(),
  medications: jsonb('medications').$type<Array<{
    medicationName: string;
    dosage: string;
    administeredAt: string;
    administeredBy: string;
    batchNumber?: string;
    expiryDate?: string;
  }>>().notNull(),
  veterinarianName: varchar('veterinarian_name', { length: 255 }).notNull(),
  veterinarianLicense: varchar('veterinarian_license', { length: 100 }),
  cost: integer('cost').default(0),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  outcome: treatmentOutcomeEnum('outcome').default('pending').notNull(),
  notes: text('notes'),
  followUpRequired: boolean('follow_up_required').default(false).notNull(),
  followUpDate: timestamp('follow_up_date'),
  recoveryPercentage: integer('recovery_percentage'), // 0-100
  createdBy: text('created_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('treatment_records_tenant_id_idx').on(table.tenantId),
  animalIdIdx: index('treatment_records_animal_id_idx').on(table.animalId),
  diseaseIdIdx: index('treatment_records_disease_id_idx').on(table.diseaseId),
  outcomeIdx: index('treatment_records_outcome_idx').on(table.outcome),
  startDateIdx: index('treatment_records_start_date_idx').on(table.startDate),
  veterinarianIdx: index('treatment_records_veterinarian_idx').on(table.veterinarianName),
}));

// Vaccination Schedules table
export const vaccinationSchedules = pgTable('vaccination_schedules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').references(() => animals.id, { onDelete: 'cascade' }), // null for herd-wide
  vaccineName: varchar('vaccine_name', { length: 255 }).notNull(),
  vaccineType: vaccineTypeEnum('vaccine_type').notNull(),
  targetDiseases: jsonb('target_diseases').$type<string[]>().notNull(),
  scheduledDate: timestamp('scheduled_date').notNull(),
  administeredDate: timestamp('administered_date'),
  nextDueDate: timestamp('next_due_date'),
  status: vaccinationStatusEnum('status').default('scheduled').notNull(),
  administeredBy: text('administered_by').references(() => platformUsers.id),
  batchNumber: varchar('batch_number', { length: 100 }).notNull(),
  expiryDate: timestamp('expiry_date').notNull(),
  manufacturer: varchar('manufacturer', { length: 255 }).notNull(),
  adverseReactions: jsonb('adverse_reactions').$type<string[]>(),
  certificateUrl: text('certificate_url'),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('vaccination_schedules_tenant_id_idx').on(table.tenantId),
  animalIdIdx: index('vaccination_schedules_animal_id_idx').on(table.animalId),
  statusIdx: index('vaccination_schedules_status_idx').on(table.status),
  scheduledDateIdx: index('vaccination_schedules_scheduled_date_idx').on(table.scheduledDate),
  nextDueDateIdx: index('vaccination_schedules_next_due_date_idx').on(table.nextDueDate),
}));

// Veterinary Protocols table
export const veterinaryProtocols = pgTable('veterinary_protocols', {
  id: text('id').primaryKey(),
  diseaseId: text('disease_id').notNull().references(() => diseases.id, { onDelete: 'cascade' }),
  protocolType: protocolTypeEnum('protocol_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  steps: jsonb('steps').$type<Array<{
    stepNumber: number;
    description: string;
    duration: number;
    requiredMedications: string[];
    safetyPrecautions: string[];
    expectedOutcome: string;
  }>>().notNull(),
  requiredEquipment: jsonb('required_equipment').$type<string[]>().notNull(),
  estimatedDuration: integer('estimated_duration').notNull(), // in minutes
  difficultyLevel: varchar('difficulty_level', { length: 20 }).default('intermediate').notNull(),
  prerequisites: jsonb('prerequisites').$type<string[]>().default([]),
  complications: jsonb('complications').$type<string[]>().default([]),
  successRate: integer('success_rate').default(80), // percentage
  isActive: boolean('is_active').default(true).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  updatedBy: text('updated_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  diseaseIdIdx: index('veterinary_protocols_disease_id_idx').on(table.diseaseId),
  protocolTypeIdx: index('veterinary_protocols_protocol_type_idx').on(table.protocolType),
  isActiveIdx: index('veterinary_protocols_is_active_idx').on(table.isActive),
}));

// ============================================================================
// FEED MANAGEMENT TABLES
// ============================================================================

// Feed Inventory table
export const feedInventory = pgTable('feed_inventory', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  feedType: feedTypeEnum('feed_type').notNull(),
  feedName: varchar('feed_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(), // in base unit (kg)
  unit: feedUnitEnum('unit').notNull().default('kg'),
  unitPrice: integer('unit_price').notNull(), // price per unit in paise
  purchaseDate: timestamp('purchase_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  supplier: varchar('supplier', { length: 255 }),
  batchNumber: varchar('batch_number', { length: 100 }),
  storageLocation: varchar('storage_location', { length: 255 }),
  minimumStock: integer('minimum_stock').default(100), // alert threshold
  nutritionalInfo: jsonb('nutritional_info').$type<{
    protein: number;
    fat: number;
    fiber: number;
    moisture: number;
    energy: number; // in MJ/kg
  }>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('feed_inventory_tenant_id_idx').on(table.tenantId),
  feedTypeIdx: index('feed_inventory_feed_type_idx').on(table.feedType),
  expiryDateIdx: index('feed_inventory_expiry_date_idx').on(table.expiryDate),
  isActiveIdx: index('feed_inventory_is_active_idx').on(table.isActive),
}));

// Feeding Schedules table
export const feedingSchedules = pgTable('feeding_schedules', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').notNull().references(() => animals.id, { onDelete: 'cascade' }),
  feedType: varchar('feed_type', { length: 255 }).notNull(),
  feedName: varchar('feed_name', { length: 255 }).notNull(),
  quantity: integer('quantity').notNull(),
  unit: feedUnitEnum('unit').notNull().default('kg'),
  timeOfDay: varchar('time_of_day', { length: 50 }).notNull(), // "06:00", "14:00", "18:00"
  frequency: varchar('frequency', { length: 50 }).notNull().default('daily'), // daily, twice_daily, weekly
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  notes: text('notes'),
  createdBy: text('created_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('feeding_schedules_tenant_id_idx').on(table.tenantId),
  animalIdIdx: index('feeding_schedules_animal_id_idx').on(table.animalId),
  timeOfDayIdx: index('feeding_schedules_time_of_day_idx').on(table.timeOfDay),
  isActiveIdx: index('feeding_schedules_is_active_idx').on(table.isActive),
}));

// Nutrition Templates table
export const nutritionTemplates = pgTable('nutrition_templates', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  templateName: varchar('template_name', { length: 255 }).notNull(),
  animalType: varchar('animal_type', { length: 100 }).notNull(), // cow, buffalo, calf, heifer
  animalWeight: integer('animal_weight'), // target weight in kg
  productionStage: varchar('production_stage', { length: 100 }), // lactating, dry, pregnant, growing
  dailyFeedRequirements: jsonb('daily_feed_requirements').$type<Array<{
    feedType: string;
    quantity: number;
    unit: string;
    feedingTime: string;
  }>>().notNull(),
  nutritionalGoals: jsonb('nutritional_goals').$type<{
    dailyMilkYield: number; // liters
    proteinIntake: number; // kg
    energyIntake: number; // MJ
    fiberIntake: number; // kg
  }>(),
  estimatedCost: integer('estimated_cost'), // per day in paise
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('nutrition_templates_tenant_id_idx').on(table.tenantId),
  animalTypeIdx: index('nutrition_templates_animal_type_idx').on(table.animalType),
  productionStageIdx: index('nutrition_templates_production_stage_idx').on(table.productionStage),
  isActiveIdx: index('nutrition_templates_is_active_idx').on(table.isActive),
}));

// ============================================================================
// STAFF MANAGEMENT TABLES
// ============================================================================

// Staff Attendance table
export const staffAttendance = pgTable('staff_attendance', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => platformUsers.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull(),
  checkIn: timestamp('check_in'),
  checkOut: timestamp('check_out'),
  locationLat: varchar('location_lat', { length: 20 }),
  locationLng: varchar('location_lng', { length: 20 }),
  status: attendanceStatusEnum('status').default('present').notNull(),
  workHours: integer('work_hours'), // calculated in minutes
  overtimeHours: integer('overtime_hours'), // in minutes
  notes: text('notes'),
  approvedBy: text('approved_by').references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('staff_attendance_tenant_id_idx').on(table.tenantId),
  userIdIdx: index('staff_attendance_user_id_idx').on(table.userId),
  dateIdx: index('staff_attendance_date_idx').on(table.date),
  statusIdx: index('staff_attendance_status_idx').on(table.status),
}));

// Task Assignments table
export const taskAssignments = pgTable('task_assignments', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  assignedTo: text('assigned_to').notNull().references(() => platformUsers.id, { onDelete: 'cascade' }),
  assignedBy: text('assigned_by').notNull().references(() => platformUsers.id, { onDelete: 'cascade' }),
  taskType: varchar('task_type', { length: 100 }).notNull(), // milking, feeding, cleaning, treatment
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  animalId: text('animal_id').references(() => animals.id, { onDelete: 'cascade' }),
  dueDate: timestamp('due_date').notNull(),
  estimatedDuration: integer('estimated_duration'), // in minutes
  actualDuration: integer('actual_duration'), // in minutes
  status: taskStatusEnum('status').default('pending').notNull(),
  completionPhoto: text('completion_photo'),
  completionNotes: text('completion_notes'),
  rating: integer('rating'), // 1-5 stars
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  tenantIdIdx: index('task_assignments_tenant_id_idx').on(table.tenantId),
  assignedToIdx: index('task_assignments_assigned_to_idx').on(table.assignedTo),
  assignedByIdx: index('task_assignments_assigned_by_idx').on(table.assignedBy),
  statusIdx: index('task_assignments_status_idx').on(table.status),
  priorityIdx: index('task_assignments_priority_idx').on(table.priority),
  dueDateIdx: index('task_assignments_due_date_idx').on(table.dueDate),
}));

// Performance Reviews table
export const performanceReviews = pgTable('performance_reviews', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => platformUsers.id, { onDelete: 'cascade' }),
  reviewPeriod: varchar('review_period', { length: 50 }).notNull(), // "2024-12", "Q4-2024"
  reviewerId: text('reviewer_id').notNull().references(() => platformUsers.id, { onDelete: 'cascade' }),
  overallRating: integer('overall_rating').notNull(), // 1-5
  taskCompletion: integer('task_completion'), // percentage
  punctuality: integer('punctuality'), // 1-5
  qualityOfWork: integer('quality_of_work'), // 1-5
  teamwork: integer('teamwork'), // 1-5
  initiative: integer('initiative'), // 1-5
  strengths: jsonb('strengths').$type<string[]>(),
  areasForImprovement: jsonb('areas_for_improvement').$type<string[]>(),
  goals: jsonb('goals').$type<Array<{
    goal: string;
    targetDate: string;
    status: string;
  }>>(),
  bonusAmount: integer('bonus_amount'), // in paise
  reviewDate: timestamp('review_date').notNull(),
  nextReviewDate: timestamp('next_review_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('performance_reviews_tenant_id_idx').on(table.tenantId),
  userIdIdx: index('performance_reviews_user_id_idx').on(table.userId),
  reviewPeriodIdx: index('performance_reviews_review_period_idx').on(table.reviewPeriod),
  overallRatingIdx: index('performance_reviews_overall_rating_idx').on(table.overallRating),
}));

// ============================================================================
// IOT DEVICE MANAGEMENT TABLES
// ============================================================================

// IoT Devices table
export const iotDevices = pgTable('iot_devices', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  deviceType: deviceTypeEnum('device_type').notNull(),
  deviceName: varchar('device_name', { length: 255 }).notNull(),
  deviceId: varchar('device_id', { length: 255 }).unique().notNull(),
  animalId: text('animal_id').references(() => animals.id, { onDelete: 'set null' }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  model: varchar('model', { length: 100 }),
  firmwareVersion: varchar('firmware_version', { length: 50 }),
  status: deviceStatusEnum('status').default('active').notNull(),
  lastSync: timestamp('last_sync'),
  batteryLevel: integer('battery_level'), // percentage
  signalStrength: integer('signal_strength'), // percentage
  location: varchar('location', { length: 255 }),
  installationDate: timestamp('installation_date').notNull(),
  warrantyExpiry: timestamp('warranty_expiry'),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: text('created_by').notNull().references(() => platformUsers.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('iot_devices_tenant_id_idx').on(table.tenantId),
  deviceTypeIdx: index('iot_devices_device_type_idx').on(table.deviceType),
  deviceIdIdx: index('iot_devices_device_id_idx').on(table.deviceId),
  statusIdx: index('iot_devices_status_idx').on(table.status),
  animalIdIdx: index('iot_devices_animal_id_idx').on(table.animalId),
  isActiveIdx: index('iot_devices_is_active_idx').on(table.isActive),
}));

// Sensor Data table
export const sensorData = pgTable('sensor_data', {
  id: text('id').primaryKey(),
  deviceId: text('device_id').notNull().references(() => iotDevices.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').references(() => animals.id, { onDelete: 'set null' }),
  dataType: varchar('data_type', { length: 100 }).notNull(), // temperature, activity, milk_yield, weight
  value: integer('value').notNull(),
  unit: varchar('unit', { length: 20 }), // C, steps, liters, kg
  timestamp: timestamp('timestamp').notNull(),
  quality: varchar('quality', { length: 20 }).default('good'), // good, fair, poor
  processed: boolean('processed').default(false).notNull(),
  alertTriggered: boolean('alert_triggered').default(false).notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  deviceIdIdx: index('sensor_data_device_id_idx').on(table.deviceId),
  animalIdIdx: index('sensor_data_animal_id_idx').on(table.animalId),
  dataTypeIdx: index('sensor_data_data_type_idx').on(table.dataType),
  timestampIdx: index('sensor_data_timestamp_idx').on(table.timestamp),
  processedIdx: index('sensor_data_processed_idx').on(table.processed),
  alertTriggeredIdx: index('sensor_data_alert_triggered_idx').on(table.alertTriggered),
}));

// ============================================================================
// MILK QUALITY MANAGEMENT TABLES
// ============================================================================

// Milk Quality Tests table
export const milkQualityTests = pgTable('milk_quality_tests', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  milkLogId: text('milk_log_id').references(() => milkLogs.id, { onDelete: 'cascade' }),
  animalId: text('animal_id').references(() => animals.id, { onDelete: 'cascade' }),
  testDate: timestamp('test_date').notNull(),
  fatPercentage: integer('fat_percentage'), // stored as integer (e.g., 3.5% = 350)
  proteinPercentage: integer('protein_percentage'), // stored as integer
  snfPercentage: integer('snf_percentage'), // solids not fat
  lactosePercentage: integer('lactose_percentage'),
  temperature: integer('temperature'), // in Celsius * 10
  phLevel: integer('ph_level'), // stored as integer (e.g., 6.7 = 67)
  conductivity: integer('conductivity'), // microSiemens
  adulterationTest: boolean('adulteration_test').default(false).notNull(),
  adulterationType: varchar('adulteration_type', { length: 100 }),
  grade: qualityGradeEnum('grade'),
  status: testStatusEnum('status').default('pending').notNull(),
  testedBy: text('tested_by').notNull().references(() => platformUsers.id),
  labName: varchar('lab_name', { length: 255 }),
  certificateUrl: text('certificate_url'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantIdIdx: index('milk_quality_tests_tenant_id_idx').on(table.tenantId),
  milkLogIdIdx: index('milk_quality_tests_milk_log_id_idx').on(table.milkLogId),
  animalIdIdx: index('milk_quality_tests_animal_id_idx').on(table.animalId),
  testDateIdx: index('milk_quality_tests_test_date_idx').on(table.testDate),
  statusIdx: index('milk_quality_tests_status_idx').on(table.status),
  gradeIdx: index('milk_quality_tests_grade_idx').on(table.grade),
}));

// ============================================================================
// RELATIONS FOR NEW TABLES
// ============================================================================

// Veterinary Relations
export const diseasesRelations = relations(diseases, ({ one, many }) => ({
  treatmentRecords: many(treatmentRecords),
  vaccinationSchedules: many(vaccinationSchedules),
  veterinaryProtocols: many(veterinaryProtocols),
}));

export const treatmentRecordsRelations = relations(treatmentRecords, ({ one }) => ({
  tenant: one(tenants, {
    fields: [treatmentRecords.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [treatmentRecords.animalId],
    references: [animals.id],
  }),
  disease: one(diseases, {
    fields: [treatmentRecords.diseaseId],
    references: [diseases.id],
  }),
  createdByUser: one(platformUsers, {
    fields: [treatmentRecords.createdBy],
    references: [platformUsers.id],
  }),
}));

export const vaccinationSchedulesRelations = relations(vaccinationSchedules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [vaccinationSchedules.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [vaccinationSchedules.animalId],
    references: [animals.id],
  }),
  administeredByUser: one(platformUsers, {
    fields: [vaccinationSchedules.administeredBy],
    references: [platformUsers.id],
  }),
  createdByUser: one(platformUsers, {
    fields: [vaccinationSchedules.createdBy],
    references: [platformUsers.id],
  }),
}));

export const veterinaryProtocolsRelations = relations(veterinaryProtocols, ({ one, many }) => ({
  disease: one(diseases, {
    fields: [veterinaryProtocols.diseaseId],
    references: [diseases.id],
  }),
  updatedByUser: one(platformUsers, {
    fields: [veterinaryProtocols.updatedBy],
    references: [platformUsers.id],
  }),
}));

// Feed Management Relations
export const feedInventoryRelations = relations(feedInventory, ({ one }) => ({
  tenant: one(tenants, {
    fields: [feedInventory.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(platformUsers, {
    fields: [feedInventory.createdBy],
    references: [platformUsers.id],
  }),
}));

export const feedingSchedulesRelations = relations(feedingSchedules, ({ one }) => ({
  tenant: one(tenants, {
    fields: [feedingSchedules.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [feedingSchedules.animalId],
    references: [animals.id],
  }),
  createdByUser: one(platformUsers, {
    fields: [feedingSchedules.createdBy],
    references: [platformUsers.id],
  }),
}));

export const nutritionTemplatesRelations = relations(nutritionTemplates, ({ one }) => ({
  tenant: one(tenants, {
    fields: [nutritionTemplates.tenantId],
    references: [tenants.id],
  }),
  createdByUser: one(platformUsers, {
    fields: [nutritionTemplates.createdBy],
    references: [platformUsers.id],
  }),
}));

// Staff Management Relations
export const staffAttendanceRelations = relations(staffAttendance, ({ one }) => ({
  tenant: one(tenants, {
    fields: [staffAttendance.tenantId],
    references: [tenants.id],
  }),
  user: one(platformUsers, {
    fields: [staffAttendance.userId],
    references: [platformUsers.id],
  }),
  approvedByUser: one(platformUsers, {
    fields: [staffAttendance.approvedBy],
    references: [platformUsers.id],
  }),
}));

export const taskAssignmentsRelations = relations(taskAssignments, ({ one }) => ({
  tenant: one(tenants, {
    fields: [taskAssignments.tenantId],
    references: [tenants.id],
  }),
  assignedToUser: one(platformUsers, {
    fields: [taskAssignments.assignedTo],
    references: [platformUsers.id],
  }),
  assignedByUser: one(platformUsers, {
    fields: [taskAssignments.assignedBy],
    references: [platformUsers.id],
  }),
  animal: one(animals, {
    fields: [taskAssignments.animalId],
    references: [animals.id],
  }),
}));

export const performanceReviewsRelations = relations(performanceReviews, ({ one }) => ({
  tenant: one(tenants, {
    fields: [performanceReviews.tenantId],
    references: [tenants.id],
  }),
  user: one(platformUsers, {
    fields: [performanceReviews.userId],
    references: [platformUsers.id],
  }),
  reviewerUser: one(platformUsers, {
    fields: [performanceReviews.reviewerId],
    references: [platformUsers.id],
  }),
}));

// IoT Relations
export const iotDevicesRelations = relations(iotDevices, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [iotDevices.tenantId],
    references: [tenants.id],
  }),
  animal: one(animals, {
    fields: [iotDevices.animalId],
    references: [animals.id],
  }),
  createdByUser: one(platformUsers, {
    fields: [iotDevices.createdBy],
    references: [platformUsers.id],
  }),
  sensorData: many(sensorData),
}));

export const sensorDataRelations = relations(sensorData, ({ one }) => ({
  device: one(iotDevices, {
    fields: [sensorData.deviceId],
    references: [iotDevices.id],
  }),
  animal: one(animals, {
    fields: [sensorData.animalId],
    references: [animals.id],
  }),
}));

// Milk Quality Relations
export const milkQualityTestsRelations = relations(milkQualityTests, ({ one }) => ({
  tenant: one(tenants, {
    fields: [milkQualityTests.tenantId],
    references: [tenants.id],
  }),
  milkLog: one(milkLogs, {
    fields: [milkQualityTests.milkLogId],
    references: [milkLogs.id],
  }),
  animal: one(animals, {
    fields: [milkQualityTests.animalId],
    references: [animals.id],
  }),
  testedByUser: one(platformUsers, {
    fields: [milkQualityTests.testedBy],
    references: [platformUsers.id],
  }),
}));

// Export relations for enhanced schema
export { relations };

// ============================================================================
// PHASE 1: ENHANCED DATABASE TABLES
// Added for comprehensive animal management and AI features
// ============================================================================

// Export new tables for enhanced features
export { 
  genetic_profiles,
  feed_inventory,
  nutrition_requirements,
  computer_vision_records,
  financial_accounts,
  staff_certifications,
  regulatory_compliance,
  blockchain_transactions,
  drone_flights
} from './schema-enhanced';

// Export enhanced types
export type { 
  EnhancedAnimalProfile,
  AnimalSearchFilters,
  BatchOperation
} from './schema-enhanced';

