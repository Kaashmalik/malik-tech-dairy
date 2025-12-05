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

