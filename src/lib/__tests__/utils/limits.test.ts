import {
  canAddAnimal,
  canAddUser,
  hasFeature,
  getRemainingAnimalSlots,
  getRemainingUserSlots,
} from '@/lib/utils/limits';
import type { TenantLimits } from '@/types';

describe('Limits Utilities', () => {
  const mockLimits: TenantLimits = {
    maxAnimals: 10,
    maxUsers: 5,
    features: ['reports', 'analytics'],
  };

  describe('canAddAnimal', () => {
    it('should return true when under limit', () => {
      expect(canAddAnimal(mockLimits, 5)).toBe(true);
      expect(canAddAnimal(mockLimits, 9)).toBe(true);
    });

    it('should return false when at or over limit', () => {
      expect(canAddAnimal(mockLimits, 10)).toBe(false);
      expect(canAddAnimal(mockLimits, 11)).toBe(false);
    });

    it('should return true for unlimited (-1)', () => {
      const unlimitedLimits = { ...mockLimits, maxAnimals: -1 };
      expect(canAddAnimal(unlimitedLimits, 100)).toBe(true);
    });

    it('should return false when limits is null', () => {
      expect(canAddAnimal(null, 5)).toBe(false);
    });
  });

  describe('canAddUser', () => {
    it('should return true when under limit', () => {
      expect(canAddUser(mockLimits, 3)).toBe(true);
      expect(canAddUser(mockLimits, 4)).toBe(true);
    });

    it('should return false when at or over limit', () => {
      expect(canAddUser(mockLimits, 5)).toBe(false);
      expect(canAddUser(mockLimits, 6)).toBe(false);
    });

    it('should return true for unlimited (-1)', () => {
      const unlimitedLimits = { ...mockLimits, maxUsers: -1 };
      expect(canAddUser(unlimitedLimits, 100)).toBe(true);
    });

    it('should return false when limits is null', () => {
      expect(canAddUser(null, 3)).toBe(false);
    });
  });

  describe('hasFeature', () => {
    it('should return true for enabled features', () => {
      expect(hasFeature(mockLimits, 'reports')).toBe(true);
      expect(hasFeature(mockLimits, 'analytics')).toBe(true);
    });

    it('should return false for disabled features', () => {
      expect(hasFeature(mockLimits, 'custom_domain')).toBe(false);
      expect(hasFeature(mockLimits, 'api_access')).toBe(false);
    });

    it('should return false when limits is null', () => {
      expect(hasFeature(null, 'reports')).toBe(false);
    });
  });

  describe('getRemainingAnimalSlots', () => {
    it('should return correct remaining slots', () => {
      expect(getRemainingAnimalSlots(mockLimits, 5)).toBe(5);
      expect(getRemainingAnimalSlots(mockLimits, 8)).toBe(2);
      expect(getRemainingAnimalSlots(mockLimits, 10)).toBe(0);
    });

    it('should return 0 when over limit', () => {
      expect(getRemainingAnimalSlots(mockLimits, 15)).toBe(0);
    });

    it('should return null for unlimited', () => {
      const unlimitedLimits = { ...mockLimits, maxAnimals: -1 };
      expect(getRemainingAnimalSlots(unlimitedLimits, 100)).toBe(null);
    });

    it('should return null when limits is null', () => {
      expect(getRemainingAnimalSlots(null, 5)).toBe(null);
    });
  });

  describe('getRemainingUserSlots', () => {
    it('should return correct remaining slots', () => {
      expect(getRemainingUserSlots(mockLimits, 2)).toBe(3);
      expect(getRemainingUserSlots(mockLimits, 4)).toBe(1);
      expect(getRemainingUserSlots(mockLimits, 5)).toBe(0);
    });

    it('should return 0 when over limit', () => {
      expect(getRemainingUserSlots(mockLimits, 10)).toBe(0);
    });

    it('should return null for unlimited', () => {
      const unlimitedLimits = { ...mockLimits, maxUsers: -1 };
      expect(getRemainingUserSlots(unlimitedLimits, 100)).toBe(null);
    });

    it('should return null when limits is null', () => {
      expect(getRemainingUserSlots(null, 2)).toBe(null);
    });
  });
});
