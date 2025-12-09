// Tenant Limits Enforcement Utilities
import type { TenantLimits } from '@/types';

/**
 * Check if tenant can add more animals
 */
export function canAddAnimal(limits: TenantLimits | null, currentAnimalCount: number): boolean {
  if (!limits) return false;
  if (limits.maxAnimals === -1) return true; // Unlimited
  return currentAnimalCount < limits.maxAnimals;
}

/**
 * Check if tenant can add more users
 */
export function canAddUser(limits: TenantLimits | null, currentUserCount: number): boolean {
  if (!limits) return false;
  if (limits.maxUsers === -1) return true; // Unlimited
  return currentUserCount < limits.maxUsers;
}

/**
 * Check if tenant has a specific feature enabled
 */
export function hasFeature(limits: TenantLimits | null, feature: string): boolean {
  if (!limits) return false;
  return limits.features.includes(feature);
}

/**
 * Get remaining animal slots
 */
export function getRemainingAnimalSlots(
  limits: TenantLimits | null,
  currentAnimalCount: number
): number | null {
  if (!limits) return null;
  if (limits.maxAnimals === -1) return null; // Unlimited
  return Math.max(0, limits.maxAnimals - currentAnimalCount);
}

/**
 * Get remaining user slots
 */
export function getRemainingUserSlots(
  limits: TenantLimits | null,
  currentUserCount: number
): number | null {
  if (!limits) return null;
  if (limits.maxUsers === -1) return null; // Unlimited
  return Math.max(0, limits.maxUsers - currentUserCount);
}
