import { PlanService, FeatureGate } from '../plan.service';

describe('SaaS Subscription PlanService & FeatureGate Unit Tests', () => {
  describe('PlanService', () => {
    it('should return all configured plans', () => {
      const plans = PlanService.getAllPlans();
      expect(plans.length).toBeGreaterThanOrEqual(4);
      const planIds = plans.map(p => p.id);
      expect(planIds).toContain('free');
      expect(planIds).toContain('professional');
      expect(planIds).toContain('farm');
      expect(planIds).toContain('enterprise');
    });

    it('should retrieve a specific plan correctly', () => {
      const freePlan = PlanService.getPlan('free');
      expect(freePlan).toBeDefined();
      expect(freePlan?.price).toBe(0);
      expect(freePlan?.name).toBe('Free');

      const enterprisePlan = PlanService.getPlan('enterprise');
      expect(enterprisePlan).toBeDefined();
      expect(enterprisePlan?.name).toBe('Enterprise');
    });

    it('should validate plan identifiers', () => {
      expect(PlanService.isValidPlan('free')).toBe(true);
      expect(PlanService.isValidPlan('professional')).toBe(true);
      expect(PlanService.isValidPlan('enterprise')).toBe(true);
      expect(PlanService.isValidPlan('nonexistent_plan')).toBe(false);
    });

    it('should retrieve limits and features for a given plan', () => {
      const limits = PlanService.getLimits('free');
      expect(limits.maxAnimals).toBe(10);
      expect(limits.maxUsers).toBe(1);

      const features = PlanService.getFeatures('free');
      expect(features.milk_logging).toBe(true);
      expect(features.custom_reports).toBeUndefined();
    });
  });

  describe('FeatureGate', () => {
    it('should correctly gate features based on tier', async () => {
      // Free tier
      expect(await FeatureGate.canUseFeature('free', 'milk_logging')).toBe(true);
      expect(await FeatureGate.canUseFeature('free', 'custom_reports')).toBe(false);
      expect(await FeatureGate.canUseFeature('free', 'staff_management')).toBe(false);

      // Farm tier
      expect(await FeatureGate.canUseFeature('farm', 'staff_management')).toBe(true);
      expect(await FeatureGate.canUseFeature('farm', 'api_access')).toBe(false);

      // Enterprise tier
      expect(await FeatureGate.canUseFeature('enterprise', 'staff_management')).toBe(true);
      expect(await FeatureGate.canUseFeature('enterprise', 'api_access')).toBe(true);
      expect(await FeatureGate.canUseFeature('enterprise', 'custom_reports')).toBe(true);
    });

    it('should enforce quota usage limits for animals and users', () => {
      // Free plan: 10 animals
      const underAnimalLimit = FeatureGate.checkPlanUsageLimit('free', 'animals', 5);
      expect(underAnimalLimit.allowed).toBe(true);
      expect(underAnimalLimit.remaining).toBe(5);
      expect(underAnimalLimit.percentage).toBe(50);

      const atAnimalLimit = FeatureGate.checkPlanUsageLimit('free', 'animals', 10);
      expect(atAnimalLimit.allowed).toBe(false);
      expect(atAnimalLimit.isAtLimit).toBe(true);
      expect(atAnimalLimit.remaining).toBe(0);
      expect(atAnimalLimit.percentage).toBe(100);

      const overAnimalLimit = FeatureGate.checkPlanUsageLimit('free', 'animals', 12);
      expect(overAnimalLimit.allowed).toBe(false);
      expect(overAnimalLimit.remaining).toBe(0);

      // Enterprise plan: 10000 animals
      const enterpriseCheck = FeatureGate.checkPlanUsageLimit('enterprise', 'animals', 5000);
      expect(enterpriseCheck.allowed).toBe(true);
      expect(enterpriseCheck.limit).toBe(10000);
      expect(enterpriseCheck.remaining).toBe(5000);
      expect(enterpriseCheck.percentage).toBe(50);
    });

    it('should compute usage percentage accurately', () => {
      expect(FeatureGate.calculateUsagePercentage(0, 100)).toBe(0);
      expect(FeatureGate.calculateUsagePercentage(25, 100)).toBe(25);
      expect(FeatureGate.calculateUsagePercentage(150, 100)).toBe(100);
      expect(FeatureGate.calculateUsagePercentage(50, -1)).toBe(0); // unlimited
      expect(FeatureGate.calculateUsagePercentage(10, 0)).toBe(100);
    });
  });
});
