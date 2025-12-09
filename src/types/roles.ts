// Complete Role System for MTK Dairy SaaS

export enum PlatformRole {
  SUPER_ADMIN = 'super_admin',
}

export enum TenantRole {
  FARM_OWNER = 'farm_owner',
  FARM_MANAGER = 'farm_manager',
  VETERINARIAN = 'veterinarian',
  BREEDER = 'breeder',
  MILKING_STAFF = 'milking_staff',
  FEED_MANAGER = 'feed_manager',
  ACCOUNTANT = 'accountant',
  GUEST = 'guest',
}

export type UserRole = PlatformRole | TenantRole;

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export const ROLE_PERMISSIONS: Record<TenantRole, Permission[]> = {
  [TenantRole.FARM_OWNER]: [
    { resource: 'animals', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'milk', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'health', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'breeding', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'staff', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'expenses', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'settings', actions: ['read', 'update'] },
    { resource: 'subscription', actions: ['read', 'update'] },
    { resource: 'feed', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'eggs', actions: ['create', 'read', 'update', 'delete'] },
  ],

  [TenantRole.FARM_MANAGER]: [
    { resource: 'animals', actions: ['create', 'read', 'update'] },
    { resource: 'milk', actions: ['create', 'read', 'update'] },
    { resource: 'health', actions: ['create', 'read', 'update'] },
    { resource: 'breeding', actions: ['create', 'read', 'update'] },
    { resource: 'staff', actions: ['read', 'update'] },
    { resource: 'expenses', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'feed', actions: ['create', 'read', 'update'] },
    { resource: 'eggs', actions: ['create', 'read', 'update'] },
  ],

  [TenantRole.VETERINARIAN]: [
    { resource: 'animals', actions: ['read'] },
    { resource: 'health', actions: ['create', 'read', 'update'] },
    { resource: 'breeding', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }, // health reports only
    { resource: 'milk', actions: ['read'] }, // quality issues
  ],

  [TenantRole.BREEDER]: [
    { resource: 'animals', actions: ['read'] },
    { resource: 'breeding', actions: ['create', 'read', 'update'] },
    { resource: 'health', actions: ['read'] }, // basic info
  ],

  [TenantRole.MILKING_STAFF]: [
    { resource: 'animals', actions: ['read'] }, // assigned only
    { resource: 'milk', actions: ['create', 'read'] },
  ],

  [TenantRole.FEED_MANAGER]: [
    { resource: 'animals', actions: ['read'] },
    { resource: 'feed', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'expenses', actions: ['create', 'read'] }, // feed costs only
  ],

  [TenantRole.ACCOUNTANT]: [
    { resource: 'expenses', actions: ['create', 'read', 'update'] },
    { resource: 'milk', actions: ['read'] }, // sales data
    { resource: 'reports', actions: ['read'] }, // financial only
    { resource: 'staff', actions: ['read'] }, // payroll
    { resource: 'animals', actions: ['read'] }, // valuation
  ],

  [TenantRole.GUEST]: [
    { resource: 'animals', actions: ['read'] },
    { resource: 'reports', actions: ['read'] },
  ],
};

// Module access control
export const MODULE_ACCESS: Record<string, UserRole[]> = {
  dashboard: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.VETERINARIAN,
    TenantRole.BREEDER,
    TenantRole.ACCOUNTANT,
    TenantRole.GUEST,
  ],
  animals: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.VETERINARIAN,
    TenantRole.BREEDER,
    TenantRole.MILKING_STAFF,
    TenantRole.FEED_MANAGER,
    TenantRole.ACCOUNTANT,
  ],
  milk: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.MILKING_STAFF,
    TenantRole.ACCOUNTANT,
  ],
  health: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.VETERINARIAN,
  ],
  breeding: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.BREEDER,
  ],
  staff: [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
  expenses: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.ACCOUNTANT,
    TenantRole.FEED_MANAGER,
  ],
  reports: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.ACCOUNTANT,
    TenantRole.VETERINARIAN,
  ],
  settings: [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER],
  feed: [
    PlatformRole.SUPER_ADMIN,
    TenantRole.FARM_OWNER,
    TenantRole.FARM_MANAGER,
    TenantRole.FEED_MANAGER,
  ],
  eggs: [PlatformRole.SUPER_ADMIN, TenantRole.FARM_OWNER, TenantRole.FARM_MANAGER],
};

// Role display names
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  [PlatformRole.SUPER_ADMIN]: 'Super Admin',
  [TenantRole.FARM_OWNER]: 'Farm Owner',
  [TenantRole.FARM_MANAGER]: 'Farm Manager',
  [TenantRole.VETERINARIAN]: 'Veterinarian',
  [TenantRole.BREEDER]: 'Breeder',
  [TenantRole.MILKING_STAFF]: 'Milking Staff',
  [TenantRole.FEED_MANAGER]: 'Feed Manager',
  [TenantRole.ACCOUNTANT]: 'Accountant',
  [TenantRole.GUEST]: 'Guest',
};

// Role hierarchy (for permission inheritance)
export const ROLE_HIERARCHY: Record<TenantRole, number> = {
  [TenantRole.FARM_OWNER]: 9,
  [TenantRole.FARM_MANAGER]: 8,
  [TenantRole.VETERINARIAN]: 7,
  [TenantRole.BREEDER]: 6,
  [TenantRole.ACCOUNTANT]: 5,
  [TenantRole.FEED_MANAGER]: 4,
  [TenantRole.MILKING_STAFF]: 3,
  [TenantRole.GUEST]: 1,
};
