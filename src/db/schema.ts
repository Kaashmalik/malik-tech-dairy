// Drizzle ORM Schema for Supabase PostgreSQL
// All relational data migrated from Firestore
import { pgTable, text, timestamp, boolean, jsonb, integer, varchar, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'starter', 'professional', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'trial', 'expired', 'cancelled', 'past_due']);
export const paymentGatewayEnum = pgEnum('payment_gateway', ['jazzcash', 'easypaisa', 'xpay', 'bank_transfer']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'read', 'login', 'logout']);

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

