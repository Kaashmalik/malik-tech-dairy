import { getDrizzle } from '@/lib/supabase/server';
import { healthRecords, animals } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { ServiceContext, PaginatedResult } from '../types';
import { logAuditEvent } from '@/lib/audit';

export interface HealthRecordFilters {
  animalId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CreateHealthRecordDTO {
  animalId: string;
  type: string; // 'vaccination' | 'treatment' | 'checkup' | 'disease' | 'surgery'
  date: string | Date;
  description: string;
  diagnosis?: string;
  treatment?: string;
  cost?: number;
  veterinarian?: string;
  nextDueDate?: string | Date;
  notes?: string;
}

export class HealthService {
  /**
   * List health records with animal details and pagination
   */
  static async listRecords(ctx: ServiceContext, filters: HealthRecordFilters = {}): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const db = getDrizzle();

    const conditions = [eq(healthRecords.tenantId, ctx.tenantId)];

    if (filters.animalId) {
      conditions.push(eq(healthRecords.animalId, filters.animalId));
    }
    if (filters.type) {
      conditions.push(eq(healthRecords.type, filters.type));
    }
    if (filters.startDate && filters.endDate) {
      conditions.push(
        and(
          gte(healthRecords.date, new Date(filters.startDate)),
          lte(healthRecords.date, new Date(filters.endDate))
        )!
      );
    }

    const whereClause = and(...conditions);

    const [totalCount] = await db
      .select({ count: count() })
      .from(healthRecords)
      .where(whereClause);

    const total = Number(totalCount?.count || 0);

    const rows = await db
      .select({
        id: healthRecords.id,
        tenantId: healthRecords.tenantId,
        animalId: healthRecords.animalId,
        type: healthRecords.type,
        date: healthRecords.date,
        description: healthRecords.description,
        cost: healthRecords.cost,
        veterinarian: healthRecords.veterinarian,
        nextDueDate: healthRecords.nextDueDate,
        createdAt: healthRecords.createdAt,
        animalTag: animals.tag,
        animalName: animals.name,
        animalSpecies: animals.species,
      })
      .from(healthRecords)
      .leftJoin(animals, eq(healthRecords.animalId, animals.id))
      .where(whereClause)
      .orderBy(desc(healthRecords.date))
      .limit(limit)
      .offset(offset);

    const items = rows.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      animalId: r.animalId,
      animalTag: r.animalTag || 'Unknown',
      animalName: r.animalName || '',
      animalSpecies: r.animalSpecies || 'cow',
      type: r.type,
      date: r.date,
      description: r.description,
      diagnosis: r.description,
      treatment: r.description,
      cost: r.cost,
      veterinarian: r.veterinarian,
      nextDueDate: r.nextDueDate,
      createdAt: r.createdAt,
    }));

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
   * Create a health record
   */
  static async createRecord(ctx: ServiceContext, data: CreateHealthRecordDTO) {
    const db = getDrizzle();

    // Verify animal exists
    const [animal] = await db
      .select({ id: animals.id, tag: animals.tag })
      .from(animals)
      .where(and(eq(animals.id, data.animalId), eq(animals.tenantId, ctx.tenantId)))
      .limit(1);

    if (!animal) {
      throw new Error('NOT_FOUND: Animal not found in your farm.');
    }

    const recordId = `health_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const fullDesc = data.description || [data.diagnosis, data.treatment, data.notes].filter(Boolean).join(' - ') || 'Health check';

    const [created] = await db
      .insert(healthRecords)
      .values({
        id: recordId,
        tenantId: ctx.tenantId,
        animalId: data.animalId,
        type: data.type,
        date: new Date(data.date),
        description: fullDesc,
        cost: data.cost ? Math.round(data.cost) : null,
        veterinarian: data.veterinarian?.trim() || null,
        nextDueDate: data.nextDueDate ? new Date(data.nextDueDate) : null,
        recordedBy: ctx.userId,
        createdAt: new Date(),
      })
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'health_records',
        resourceId: created.id,
        details: { animalId: data.animalId, type: data.type },
      });
    } catch {
      // Ignore audit failure
    }

    return created;
  }

  /**
   * Get recent health alerts and summary statistics
   */
  static async getHealthAlerts(ctx: ServiceContext) {
    const db = getDrizzle();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await db
      .select({
        id: healthRecords.id,
        type: healthRecords.type,
        date: healthRecords.date,
        description: healthRecords.description,
        animalId: healthRecords.animalId,
        animalTag: animals.tag,
        animalName: animals.name,
      })
      .from(healthRecords)
      .leftJoin(animals, eq(healthRecords.animalId, animals.id))
      .where(
        and(
          eq(healthRecords.tenantId, ctx.tenantId),
          gte(healthRecords.date, thirtyDaysAgo)
        )
      )
      .orderBy(desc(healthRecords.date))
      .limit(10);

    const totalVaccinations = recentRecords.filter(r => r.type === 'vaccination').length;
    const totalTreatments = recentRecords.filter(r => r.type === 'treatment').length;

    return {
      recentAlerts: recentRecords,
      totalVaccinationsLast30Days: totalVaccinations,
      totalTreatmentsLast30Days: totalTreatments,
    };
  }
}
