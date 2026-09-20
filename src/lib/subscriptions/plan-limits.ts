/**
 * Pure plan-limit helpers (testable without DB).
 */

/** Returns true when another unit can be added under the plan max. max < 0 means unlimited. */
export function isWithinPlanLimit(currentCount: number, maxAllowed: number): boolean {
  if (maxAllowed < 0) return true;
  return currentCount < maxAllowed;
}

export function planLimitReachedMessage(
  resource: 'animals' | 'users',
  limit: number,
  plan: string
) {
  const label = resource === 'animals' ? 'animals' : 'team members';
  return `PLAN_LIMIT_REACHED: Your farm has reached its limit of ${limit} ${label} under the ${plan} plan. Please upgrade your subscription.`;
}

export function featureNotAvailableMessage(feature: string) {
  return `FEATURE_NOT_AVAILABLE: "${feature}" is not included in your current plan. Please upgrade to unlock this feature.`;
}
