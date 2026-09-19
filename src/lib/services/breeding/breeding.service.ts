import { getDrizzle } from '@/lib/supabase/server';
import { breedingRecords, animals } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { ServiceContext, PaginatedResult } from '../types';
import { calculateExpectedDueDate } from '@/lib/breeding-constants';
import { AnimalSpecies } from '@/types/database';
import { logAuditEvent } from '@/lib/audit';

export interface BreedingRecordFilters {
  animalId?: string;
  pregnantOnly?: boolean;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CreateBreedingRecordDTO {
  animalId: string;
  breedingDate: string | Date;
  breedingMethod: 'natural' | 'artificial_insemination';
  sireId?: string;
  semenStrawId?: string;
  inseminationTechnician?: string;
  notes?: string;
}

export interface PregnancyCheckDTO {
  breedingRecordId: string;
  checkDate: string | Date;
  result: 'pregnant' | 'not_pregnant' | 'recheck_needed';
  checkMethod?: string;
  notes?: string;
}

export class BreedingService {
  /**
   * List breeding records with animal details and expected due dates
   */
  static async listRecords(ctx: ServiceContext, filters: BreedingRecordFilters = {}): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const db = getDrizzle();
    const conditions = [eq(breedingRecords.tenantId, ctx.tenantId)];

    if (filters.animalId) {
      conditions.push(eq(breedingRecords.animalId, filters.animalId));
    }
    if (filters.pregnantOnly) {
      conditions.push(eq(breedingRecords.pregnancyConfirmed, true));
    }
    if (filters.status) {
      conditions.push(eq(breedingRecords.status, filters.status));
    }

    const whereClause = and(...conditions);

    const [totalCount] = await db
      .select({ count: count() })
      .from(breedingRecords)
      .where(whereClause);

    const total = Number(totalCount?.count || 0);

    const rows = await db
      .select({
        id: breedingRecords.id,
        tenantId: breedingRecords.tenantId,
        animalId: breedingRecords.animalId,
        breedingDate: breedingRecords.breedingDate,
        breedingMethod: breedingRecords.breedingMethod,
        sireId: breedingRecords.sireId,
        semenStrawId: breedingRecords.semenStrawId,
        inseminationTechnician: breedingRecords.inseminationTechnician,
        expectedDueDate: breedingRecords.expectedDueDate,
        pregnancyConfirmed: breedingRecords.pregnancyConfirmed,
        pregnancyConfirmedDate: breedingRecords.pregnancyConfirmedDate,
        status: breedingRecords.status,
        notes: breedingRecords.notes,
        createdAt: breedingRecords.createdAt,
        animalTag: animals.tag,
        animalName: animals.name,
        animalSpecies: animals.species,
      })
      .from(breedingRecords)
      .leftJoin(animals, eq(breedingRecords.animalId, animals.id))
      .where(whereClause)
      .orderBy(desc(breedingRecords.breedingDate))
      .limit(limit)
      .offset(offset);

    const now = new Date();
    const items = rows.map(r => {
      const dueDate = r.expectedDueDate ? new Date(r.expectedDueDate) : null;
      const daysRemaining = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

      return {
        id: r.id,
        tenantId: r.tenantId,
        animalId: r.animalId,
        animalTag: r.animalTag || 'Unknown',
        animalName: r.animalName || '',
        animalSpecies: r.animalSpecies || 'cow',
        breedingDate: r.breedingDate,
        method: r.breedingMethod || 'natural',
        breedingMethod: r.breedingMethod || 'natural',
        sireId: r.sireId,
        semenStrawId: r.semenStrawId,
        technician: r.inseminationTechnician,
        dueDate: r.expectedDueDate,
        expectedDueDate: r.expectedDueDate,
        daysRemaining,
        pregnancyConfirmed: r.pregnancyConfirmed,
        pregnancyConfirmedDate: r.pregnancyConfirmedDate,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt,
      };
    });

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create breeding record with impossible-state validation
   */
  static async createRecord(ctx: ServiceContext, data: CreateBreedingRecordDTO) {
    const db = getDrizzle();

    // 1. Verify female animal exists and is active
    const [animal] = await db
      .select({ id: animals.id, gender: animals.gender, status: animals.status, species: animals.species })
      .from(animals)
      .where(and(eq(animals.id, data.animalId), eq(animals.tenantId, ctx.tenantId)))
      .limit(1);

    if (!animal) {
      throw new Error('NOT_FOUND: Animal not found in your farm.');
    }

    if (animal.gender !== 'female') {
      throw new Error('INVALID_STATE: Breeding records can only be created for female animals.');
    }

    if (['deceased', 'sold'].includes(animal.status)) {
      throw new Error(`INVALID_STATE: Cannot breed animal with status '${animal.status}'.`);
    }

    // 2. Prevent duplicate active breeding/pregnancy
    const activeBreeding = await db
      .select({ id: breedingRecords.id })
      .from(breedingRecords)
      .where(
        and(
          eq(breedingRecords.tenantId, ctx.tenantId),
          eq(breedingRecords.animalId, data.animalId),
          eq(breedingRecords.pregnancyConfirmed, true),
          sql`${breedingRecords.actualBirthDate} is null`
        )
      )
      .limit(1);

    if (activeBreeding.length > 0) {
      throw new Error('CONFLICT: This animal already has an active confirmed pregnancy.');
    }

    // 3. Calculate expected due date based on species
    const breedingDateObj = new Date(data.breedingDate);
    const expectedDueDate = calculateExpectedDueDate(breedingDateObj, (animal.species as AnimalSpecies) || 'cow');

    const recordId = `breeding_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(breedingRecords)
      .values({
        id: recordId,
        tenantId: ctx.tenantId,
        animalId: data.animalId,
        breedingDate: breedingDateObj,
        breedingMethod: data.breedingMethod,
        sireId: data.sireId || null,
        semenStrawId: data.semenStrawId?.trim() || null,
        inseminationTechnician: data.inseminationTechnician?.trim() || null,
        species: animal.species,
        pregnancyConfirmed: false,
        expectedDueDate,
        status: 'inseminated',
        notes: data.notes?.trim() || null,
        recordedBy: ctx.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'breeding_records',
        resourceId: created.id,
        details: { animalId: data.animalId, method: data.breedingMethod },
      });
    } catch {
      // Ignore audit failure
    }

    return created;
  }

  /**
   * Record pregnancy check and update breeding record status
   */
  static async recordPregnancyCheck(ctx: ServiceContext, data: PregnancyCheckDTO) {
    const db = getDrizzle();

    const [breeding] = await db
      .select()
      .from(breedingRecords)
      .where(and(eq(breedingRecords.id, data.breedingRecordId), eq(breedingRecords.tenantId, ctx.tenantId)))
      .limit(1);

    if (!breeding) {
      throw new Error('NOT_FOUND: Breeding record not found.');
    }

    const checkDateObj = new Date(data.checkDate);
    const breedingDateObj = new Date(breeding.breedingDate);

    if (checkDateObj < breedingDateObj) {
      throw new Error('INVALID_DATE: Pregnancy check date cannot be earlier than breeding date.');
    }

    const isPregnant = data.result === 'pregnant';
    const newStatus = isPregnant ? 'confirmed' : data.result === 'not_pregnant' ? 'not_pregnant' : 'check_pending';

    const [updated] = await db
      .update(breedingRecords)
      .set({
        pregnancyConfirmed: isPregnant,
        pregnancyConfirmedDate: isPregnant ? checkDateObj : null,
        pregnancyCheckMethod: data.checkMethod || 'ultrasound',
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(breedingRecords.id, data.breedingRecordId), eq(breedingRecords.tenantId, ctx.tenantId)))
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'update',
        resource: 'breeding_records',
        resourceId: breeding.id,
        details: { pregnancyConfirmed: isPregnant, status: newStatus },
      });
    } catch {
      // Ignore audit failure
    }

    return updated;
  }

  /**
   * Get breeding dashboard KPIs
   */
  static async getBreedingKPIs(ctx: ServiceContext) {
    const db = getDrizzle();
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

    // Confirmed pregnant animals
    const [pregnantCount] = await db
      .select({ count: count() })
      .from(breedingRecords)
      .where(
        and(
          eq(breedingRecords.tenantId, ctx.tenantId),
          eq(breedingRecords.pregnancyConfirmed, true),
          sql`${breedingRecords.actualBirthDate} is null`
        )
      );

    // Expected calvings in next 30 days
    const [upcomingCalvings] = await db
      .select({ count: count() })
      .from(breedingRecords)
      .where(
        and(
          eq(breedingRecords.tenantId, ctx.tenantId),
          eq(breedingRecords.pregnancyConfirmed, true),
          sql`${breedingRecords.actualBirthDate} is null`,
          gte(breedingRecords.expectedDueDate, now),
          lte(breedingRecords.expectedDueDate, thirtyDaysAhead)
        )
      );

    // Pending pregnancy checks
    const [checksDue] = await db
      .select({ count: count() })
      .from(breedingRecords)
      .where(
        and(
          eq(breedingRecords.tenantId, ctx.tenantId),
          eq(breedingRecords.pregnancyConfirmed, false),
          eq(breedingRecords.status, 'inseminated')
        )
      );

    return {
      confirmedPregnant: Number(pregnantCount?.count || 0),
      upcomingCalvingsNext30Days: Number(upcomingCalvings?.count || 0),
      pregnancyChecksDue: Number(checksDue?.count || 0),
    };
  }
}
