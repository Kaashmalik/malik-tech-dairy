/**
 * @jest-environment node
 */
import { createSupabaseFake } from '@/mocks/supabase-rest';

const fake = createSupabaseFake();
jest.mock('@/lib/supabase/server', () => ({ getSupabaseClient: () => fake.client }));

import { MilkService } from '../milk.service';

const ctx = { tenantId: 'farm_a', userId: 'user_1' } as never;

beforeEach(() => fake.reset());

describe('MilkService.bulkLogMilk', () => {
  it('validates all animals in one query and inserts all valid rows in one insert', async () => {
    fake.respond('animals', 'select', {
      data: [
        { id: 'a1', status: 'active' },
        { id: 'a2', status: 'sold' },
        { id: 'a3', status: 'active' },
      ],
    });
    fake.respond('milk_logs', 'select', { data: [{ animal_id: 'a3' }] }); // already logged
    fake.respond('milk_logs', 'insert', {
      data: [{ id: 'm1', animal_id: 'a1', date: '2026-10-30', session: 'morning', quantity: 12.5 }],
    });

    const result = await MilkService.bulkLogMilk(ctx, {
      date: '2026-10-30',
      session: 'morning',
      entries: [
        { animalId: 'a1', quantity: 12.46, fat: 4.5, snf: 8.6 },
        { animalId: 'a2', quantity: 5 },
        { animalId: 'a3', quantity: 7 },
        { animalId: 'missing', quantity: 3 },
      ],
    });

    expect(result.loggedCount).toBe(1);
    expect(result.errors.map(e => e.error.split(':')[0])).toEqual([
      'INVALID_STATE',
      'DUPLICATE_ENTRY',
      'NOT_FOUND',
    ]);

    const inserts = fake.queries.filter(q => q.op === 'insert');
    expect(inserts).toHaveLength(1);
    const [row] = inserts[0].payload as Array<Record<string, unknown>>;
    expect(row).toMatchObject({
      tenant_id: 'farm_a',
      animal_id: 'a1',
      quantity: 12.5,
      fat: 450,
      snf: 860,
      recorded_by: 'user_1',
    });
  });

  it('rejects the same animal twice in one batch', async () => {
    fake.respond('animals', 'select', { data: [{ id: 'a1', status: 'active' }] });
    fake.respond('milk_logs', 'select', { data: [] });
    fake.respond('milk_logs', 'insert', { data: [{ id: 'm1', animal_id: 'a1', quantity: 5 }] });

    const result = await MilkService.bulkLogMilk(ctx, {
      date: '2026-10-30',
      session: 'evening',
      entries: [
        { animalId: 'a1', quantity: 5 },
        { animalId: 'a1', quantity: 6 },
      ],
    });
    expect(result.loggedCount).toBe(1);
    expect(result.errors[0].error).toMatch(/^DUPLICATE_ENTRY/);
  });

  it('maps a unique-index race (23505) to DUPLICATE_ENTRY', async () => {
    fake.respond('animals', 'select', { data: [{ id: 'a1', status: 'active' }] });
    fake.respond('milk_logs', 'select', { data: [] });
    fake.respond('milk_logs', 'insert', { error: { message: 'dup', code: '23505' } });

    await expect(
      MilkService.logMilk(ctx, {
        animalId: 'a1',
        date: '2026-10-30',
        session: 'morning',
        quantity: 5,
      })
    ).rejects.toThrow(/^DUPLICATE_ENTRY/);
  });
});

describe('MilkService.getMonthlyReport', () => {
  it('totals per animal and per day for the month', async () => {
    fake.respond('milk_logs', 'select', {
      data: [
        {
          id: '1',
          animal_id: 'a1',
          date: '2026-10-01',
          session: 'morning',
          quantity: '10.5',
          fat: 400,
        },
        {
          id: '2',
          animal_id: 'a1',
          date: '2026-10-01',
          session: 'evening',
          quantity: 9.5,
          fat: 500,
        },
        {
          id: '3',
          animal_id: 'a2',
          date: '2026-10-02',
          session: 'morning',
          quantity: 6,
          fat: null,
        },
      ],
    });
    fake.respond('animals', 'select', {
      data: [
        { id: 'a1', tag: 'PK-1', name: 'Rani' },
        { id: 'a2', tag: 'PK-2', name: null },
      ],
    });

    const report = await MilkService.getMonthlyReport(ctx, '2026-10');

    expect(report.endDate).toBe('2026-10-31');
    expect(report.totalLiters).toBe(26);
    expect(report.daysRecorded).toBe(2);
    expect(report.animals[0]).toMatchObject({
      tag: 'PK-1',
      totalLiters: 20,
      daysMilked: 1,
      averagePerDay: 20,
      averageFat: 4.5,
    });
    expect(report.daily).toEqual([
      { date: '2026-10-01', liters: 20 },
      { date: '2026-10-02', liters: 6 },
    ]);
    // Every query stays inside the farm
    for (const q of fake.queries) {
      expect(fake.filters(q)[0]).toEqual(['eq', 'tenant_id', 'farm_a']);
    }
  });
});
