import {
  calculateExpectedDueDate,
  determineBreedingStatus,
  calculateDaysRemaining,
  GESTATION_PERIODS,
} from '@/lib/breeding-constants';
import { PLAN_LIMITS } from '@/lib/subscriptions/constants';

describe('Domain Services & Dairy Business Logic Unit Tests', () => {
  describe('Breeding Calculations & Gestation', () => {
    it('should correctly calculate expected due dates for dairy cow (283 days)', () => {
      const breedingDate = new Date('2026-01-01T00:00:00.000Z');
      const expectedDue = calculateExpectedDueDate(breedingDate, 'cow');
      const expectedTime = new Date(breedingDate.getTime() + 283 * 24 * 60 * 60 * 1000);
      expect(expectedDue.toISOString()).toBe(expectedTime.toISOString());
    });

    it('should correctly calculate expected due dates for buffalo (310 days)', () => {
      const breedingDate = new Date('2026-01-01T00:00:00.000Z');
      const expectedDue = calculateExpectedDueDate(breedingDate, 'buffalo');
      const expectedTime = new Date(breedingDate.getTime() + 310 * 24 * 60 * 60 * 1000);
      expect(expectedDue.toISOString()).toBe(expectedTime.toISOString());
    });

    it('should correctly calculate expected due dates for goat (150 days)', () => {
      const breedingDate = new Date('2026-01-01T00:00:00.000Z');
      const expectedDue = calculateExpectedDueDate(breedingDate, 'goat');
      const expectedTime = new Date(breedingDate.getTime() + 150 * 24 * 60 * 60 * 1000);
      expect(expectedDue.toISOString()).toBe(expectedTime.toISOString());
    });

    it('should accurately calculate positive days remaining for future due dates', () => {
      const futureDue = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days ahead
      const days = calculateDaysRemaining(futureDue);
      expect(days).toBeGreaterThanOrEqual(9);
      expect(days).toBeLessThanOrEqual(11);
    });

    it('should transition breeding status to delivered when birth date is recorded', () => {
      const breedingDate = new Date('2025-01-01');
      const birthDate = new Date('2025-10-12');
      const status = determineBreedingStatus(breedingDate, 'cow', true, birthDate);
      expect(status).toBe('delivered');
    });

    it('should transition breeding status to not_pregnant when check result is negative', () => {
      const breedingDate = new Date('2026-01-01');
      const status = determineBreedingStatus(breedingDate, 'cow', false, undefined, 'negative');
      expect(status).toBe('not_pregnant');
    });

    it('should identify pregnant status when pregnancy is confirmed', () => {
      const breedingDate = new Date();
      const status = determineBreedingStatus(breedingDate, 'cow', true);
      expect(status).toBe('pregnant');
    });
  });

  describe('Milk Production Math & Aggregation', () => {
    it('should correctly compute daily summary totals, differences and percent change', () => {
      const todayLogs = [
        { session: 'morning', quantity: 15.5 },
        { session: 'morning', quantity: 12.0 },
        { session: 'evening', quantity: 14.0 },
        { session: 'evening', quantity: 11.5 },
      ];

      const morningTotal = todayLogs
        .filter(l => l.session === 'morning')
        .reduce((sum, l) => sum + l.quantity, 0);

      const eveningTotal = todayLogs
        .filter(l => l.session === 'evening')
        .reduce((sum, l) => sum + l.quantity, 0);

      const todayTotal = morningTotal + eveningTotal;
      expect(morningTotal).toBe(27.5);
      expect(eveningTotal).toBe(25.5);
      expect(todayTotal).toBe(53.0);

      const yesterdayTotal = 50.0;
      const difference = todayTotal - yesterdayTotal;
      const percentChange = Math.round((difference / yesterdayTotal) * 100 * 10) / 10;

      expect(difference).toBe(3.0);
      expect(percentChange).toBe(6.0); // +6%
    });
  });

  describe('Subscription Plan Quotas & Species Enforcement', () => {
    it('should have defined limits for free, professional, farm, and enterprise tiers', () => {
      expect(PLAN_LIMITS.free).toBeDefined();
      expect(PLAN_LIMITS.professional).toBeDefined();
      expect(PLAN_LIMITS.farm).toBeDefined();
      expect(PLAN_LIMITS.enterprise).toBeDefined();

      expect(PLAN_LIMITS.free.maxAnimals).toBe(5);
      expect(PLAN_LIMITS.professional.maxAnimals).toBe(100);
      expect(PLAN_LIMITS.farm.maxAnimals).toBe(500);
      expect(PLAN_LIMITS.enterprise.maxAnimals).toBe(-1);
      expect(PLAN_LIMITS.free.maxUsers).toBe(1);
      expect(PLAN_LIMITS.farm.maxUsers).toBe(15);
    });

    it('should allow cow and buffalo for dairy plans', () => {
      expect(PLAN_LIMITS.free.allowedSpecies).toContain('cow');
      expect(PLAN_LIMITS.free.allowedSpecies).toContain('buffalo');
      expect(PLAN_LIMITS.professional.allowedSpecies).toContain('cow');
      expect(PLAN_LIMITS.professional.allowedSpecies).toContain('buffalo');
      expect(PLAN_LIMITS.farm.allowedSpecies).toContain('cow');
    });
  });

  describe('CSV Generation & Export Formatting', () => {
    it('should correctly format CSV records with quotes for strings containing commas', () => {
      const sampleRecord = {
        id: 'rec_1',
        tag: 'PK-COW-001',
        name: 'Daisy, The Champion',
        species: 'cow',
      };

      const escapeCSV = (val: string) => `"${val.replace(/"/g, '""')}"`;
      const formatted = [
        sampleRecord.id,
        escapeCSV(sampleRecord.tag),
        escapeCSV(sampleRecord.name),
        sampleRecord.species,
      ].join(',');

      expect(formatted).toBe('rec_1,"PK-COW-001","Daisy, The Champion",cow');
    });
  });
});
