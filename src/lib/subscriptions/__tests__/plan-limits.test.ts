import {
  isWithinPlanLimit,
  planLimitReachedMessage,
  featureNotAvailableMessage,
} from '@/lib/subscriptions/plan-limits';
import { PLAN_FEATURES, PLAN_LIMITS } from '@/lib/subscriptions/constants';

describe('plan-limits helpers', () => {
  describe('isWithinPlanLimit', () => {
    it('allows adding when under the max', () => {
      expect(isWithinPlanLimit(4, 5)).toBe(true);
    });

    it('blocks when at or over the max', () => {
      expect(isWithinPlanLimit(5, 5)).toBe(false);
      expect(isWithinPlanLimit(6, 5)).toBe(false);
    });

    it('treats negative max as unlimited', () => {
      expect(isWithinPlanLimit(0, -1)).toBe(true);
      expect(isWithinPlanLimit(10_000, -1)).toBe(true);
    });
  });

  describe('messages', () => {
    it('formats animal limit messages for upgrade UX', () => {
      expect(planLimitReachedMessage('animals', 5, 'free')).toContain('PLAN_LIMIT_REACHED');
      expect(planLimitReachedMessage('animals', 5, 'free')).toContain('upgrade');
    });

    it('formats feature gate messages for upgrade UX', () => {
      expect(featureNotAvailableMessage('breeding_tracking')).toContain('FEATURE_NOT_AVAILABLE');
      expect(featureNotAvailableMessage('breeding_tracking')).toContain('breeding_tracking');
    });
  });

  describe('PLAN_LIMITS / PLAN_FEATURES alignment', () => {
    it('keeps free tier at 5 animals / 1 user with health, without breeding or expenses', () => {
      expect(PLAN_LIMITS.free.maxAnimals).toBe(5);
      expect(PLAN_LIMITS.free.maxUsers).toBe(1);
      expect(PLAN_FEATURES.free).toContain('health_records');
      expect(PLAN_FEATURES.free).not.toContain('breeding_tracking');
      expect(PLAN_FEATURES.free).not.toContain('expense_tracking');
    });

    it('marks enterprise animals and users as unlimited', () => {
      expect(PLAN_LIMITS.enterprise.maxAnimals).toBe(-1);
      expect(PLAN_LIMITS.enterprise.maxUsers).toBe(-1);
    });

    it('includes breeding and expense tracking from professional upward', () => {
      expect(PLAN_FEATURES.professional).toContain('breeding_tracking');
      expect(PLAN_FEATURES.professional).toContain('expense_tracking');
      expect(PLAN_FEATURES.farm).toContain('breeding_tracking');
      expect(PLAN_FEATURES.enterprise).toContain('expense_tracking');
    });
  });
});
