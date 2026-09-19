import { getDrizzle, getSupabaseClient } from '@/lib/supabase/server';
import { animals, milkLogs, healthRecords, breedingRecords } from '@/db/schema';
import { eq, and, or, ilike, desc, sql, count } from 'drizzle-orm';
import { ServiceContext, PaginatedResult } from '../types';
import { SubscriptionService } from '@/lib/subscriptions/management';
import { AnimalSpecies } from '@/types';
import { logAuditEvent } from '@/lib/audit';

export interface AnimalListFilters {
  page?: number;
  limit?: number;
  species?: string;
  status?: string;
  gender?: string;
  breed?: string;
  search?: string;
}

export interface CreateAnimalDTO {
  tag: string;
  name?: string;
  species: string;
  breed?: string;
  dateOfBirth?: string | Date;
  gender: 'male' | 'female';
  photoUrl?: string;
  status?: string;
  weight?: number;
  color?: string;
  notes?: string;
  motherId?: string;
  fatherId?: string;
  purchaseDate?: string | Date;
  purchasePrice?: number;
}

export interface UpdateAnimalDTO extends Partial<CreateAnimalDTO> {}

export class AnimalService {
  /**
   * List animals with server-side pagination, search and filtering
   */
  static async listAnimals(
    ctx: ServiceContext,
    filters: AnimalListFilters = {}
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const offset = (page - 1) * limit;

    const db = getDrizzle();

    const conditions = [eq(animals.tenantId, ctx.tenantId)];

    if (filters.species) {
      conditions.push(eq(animals.species, filters.species));
    }
    if (filters.status) {
      conditions.push(eq(animals.status, filters.status));
    }
    if (filters.gender) {
      conditions.push(eq(animals.gender, filters.gender));
    }
    if (filters.breed) {
      conditions.push(eq(animals.breed, filters.breed));
    }
    if (filters.search) {
      const sanitized = `%${filters.search.trim()}%`;
      conditions.push(or(ilike(animals.tag, sanitized), ilike(animals.name, sanitized))!);
    }

    const whereClause = and(...conditions);

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(animals)
      .where(whereClause);

    const total = Number(totalCount?.count || 0);

    // Get items
    const rows = await db
      .select()
      .from(animals)
      .where(whereClause)
      .orderBy(desc(animals.createdAt))
      .limit(limit)
      .offset(offset);

    // Transform to camelCase format
    const items = rows.map(r => ({
      id: r.id,
      tenantId: r.tenantId,
      tag: r.tag,
      name: r.name,
      species: r.species,
      breed: r.breed,
      dateOfBirth: r.dateOfBirth,
      gender: r.gender,
      photoUrl: r.photoUrl,
      status: r.status,
      weight: r.weight,
      color: r.color,
      notes: r.notes,
      motherId: r.motherId,
      fatherId: r.fatherId,
      purchaseDate: r.purchaseDate,
      purchasePrice: r.purchasePrice,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
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
   * Get animal by ID ensuring tenant ownership
   */
  static async getAnimalById(ctx: ServiceContext, animalId: string) {
    const db = getDrizzle();
    const rows = await db
      .select()
      .from(animals)
      .where(and(eq(animals.id, animalId), eq(animals.tenantId, ctx.tenantId)))
      .limit(1);

    if (!rows.length) return null;

    const r = rows[0];
    return {
      id: r.id,
      tenantId: r.tenantId,
      tag: r.tag,
      name: r.name,
      species: r.species,
      breed: r.breed,
      dateOfBirth: r.dateOfBirth,
      gender: r.gender,
      photoUrl: r.photoUrl,
      status: r.status,
      weight: r.weight,
      color: r.color,
      notes: r.notes,
      motherId: r.motherId,
      fatherId: r.fatherId,
      purchaseDate: r.purchaseDate,
      purchasePrice: r.purchasePrice,
      customFields: r.customFields,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /**
   * Get comprehensive animal profile with related summary stats
   */
  static async getAnimalProfile(ctx: ServiceContext, animalId: string) {
    const animal = await this.getAnimalById(ctx, animalId);
    if (!animal) return null;

    const db = getDrizzle();

    // Fetch recent 10 milk logs
    const recentMilk = await db
      .select()
      .from(milkLogs)
      .where(and(eq(milkLogs.animalId, animalId), eq(milkLogs.tenantId, ctx.tenantId)))
      .orderBy(desc(milkLogs.date))
      .limit(10);

    // Fetch recent 5 health records
    const recentHealth = await db
      .select()
      .from(healthRecords)
      .where(and(eq(healthRecords.animalId, animalId), eq(healthRecords.tenantId, ctx.tenantId)))
      .orderBy(desc(healthRecords.date))
      .limit(5);

    // Fetch recent 5 breeding records
    const recentBreeding = await db
      .select()
      .from(breedingRecords)
      .where(and(eq(breedingRecords.animalId, animalId), eq(breedingRecords.tenantId, ctx.tenantId)))
      .orderBy(desc(breedingRecords.breedingDate))
      .limit(5);

    // Calculate 30-day milk average
    const [milkStats] = await db
      .select({
        totalQuantity: sql<number>`coalesce(sum(${milkLogs.quantity}), 0)`,
        countLogs: count(),
      })
      .from(milkLogs)
      .where(and(eq(milkLogs.animalId, animalId), eq(milkLogs.tenantId, ctx.tenantId)));

    return {
      animal,
      recentMilk,
      recentHealth,
      recentBreeding,
      summary: {
        totalMilkLogs: Number(milkStats?.countLogs || 0),
        totalMilkedLiters: Math.round(Number(milkStats?.totalQuantity || 0) * 10) / 10,
      },
    };
  }

  /**
   * Register a new animal with subscription enforcement, uniqueness check, and audit log
   */
  static async createAnimal(ctx: ServiceContext, data: CreateAnimalDTO) {
    // Normalize species: allow 'cattle' or 'cow' interchangeably
    const normalizedSpecies = data.species === 'cattle' ? 'cow' : data.species;

    // Enforce subscription plan quota
    const subscriptionService = new SubscriptionService(ctx.tenantId);
    const allowed = await subscriptionService.checkLimit('animals');
    if (!allowed) {
      throw new Error('PLAN_LIMIT_REACHED: You have reached the maximum animals allowed on your subscription plan.');
    }

    // Enforce species permission
    const speciesAllowed = await subscriptionService.isSpeciesAllowed(normalizedSpecies as AnimalSpecies);
    if (!speciesAllowed) {
      throw new Error(`SPECIES_NOT_ALLOWED: The species '${data.species}' is not available on your current subscription plan.`);
    }

    const db = getDrizzle();

    // Check duplicate tag within tenant
    const existing = await db
      .select({ id: animals.id })
      .from(animals)
      .where(and(eq(animals.tenantId, ctx.tenantId), eq(animals.tag, data.tag.trim())))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('DUPLICATE_TAG: An animal with this ear tag number already exists on your farm.');
    }

    const animalId = `animal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const [created] = await db
      .insert(animals)
      .values({
        id: animalId,
        tenantId: ctx.tenantId,
        tag: data.tag.trim(),
        name: data.name?.trim() || null,
        species: normalizedSpecies,
        breed: data.breed?.trim() || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender,
        photoUrl: data.photoUrl || null,
        status: data.status || 'active',
        weight: data.weight ? Math.round(data.weight) : null,
        color: data.color?.trim() || null,
        notes: data.notes?.trim() || null,
        motherId: data.motherId || null,
        fatherId: data.fatherId || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice ? Math.round(data.purchasePrice) : null,
        createdBy: ctx.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Record audit event
    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'create',
        resource: 'animals',
        resourceId: created.id,
        details: { tag: created.tag, species: created.species },
      });
    } catch {
      // Audit failure must not fail the mutation
    }

    return created;
  }

  /**
   * Update animal details
   */
  static async updateAnimal(ctx: ServiceContext, animalId: string, data: UpdateAnimalDTO) {
    const db = getDrizzle();

    // Verify animal exists
    const existing = await this.getAnimalById(ctx, animalId);
    if (!existing) {
      throw new Error('NOT_FOUND: Animal not found.');
    }

    // If tag changed, ensure new tag is unique within tenant
    if (data.tag && data.tag.trim() !== existing.tag) {
      const duplicate = await db
        .select({ id: animals.id })
        .from(animals)
        .where(
          and(
            eq(animals.tenantId, ctx.tenantId),
            eq(animals.tag, data.tag.trim()),
            sql`${animals.id} != ${animalId}`
          )
        )
        .limit(1);

      if (duplicate.length > 0) {
        throw new Error('DUPLICATE_TAG: An animal with this ear tag number already exists.');
      }
    }

    const updateValues: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (data.tag !== undefined) updateValues.tag = data.tag.trim();
    if (data.name !== undefined) updateValues.name = data.name ? data.name.trim() : null;
    if (data.species !== undefined) updateValues.species = data.species === 'cattle' ? 'cow' : data.species;
    if (data.breed !== undefined) updateValues.breed = data.breed ? data.breed.trim() : null;
    if (data.dateOfBirth !== undefined) updateValues.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateValues.gender = data.gender;
    if (data.photoUrl !== undefined) updateValues.photoUrl = data.photoUrl || null;
    if (data.status !== undefined) updateValues.status = data.status;
    if (data.weight !== undefined) updateValues.weight = data.weight ? Math.round(data.weight) : null;
    if (data.color !== undefined) updateValues.color = data.color ? data.color.trim() : null;
    if (data.notes !== undefined) updateValues.notes = data.notes ? data.notes.trim() : null;
    if (data.motherId !== undefined) updateValues.motherId = data.motherId || null;
    if (data.fatherId !== undefined) updateValues.fatherId = data.fatherId || null;
    if (data.purchaseDate !== undefined) updateValues.purchaseDate = data.purchaseDate ? new Date(data.purchaseDate) : null;
    if (data.purchasePrice !== undefined) updateValues.purchasePrice = data.purchasePrice ? Math.round(data.purchasePrice) : null;

    const [updated] = await db
      .update(animals)
      .set(updateValues)
      .where(and(eq(animals.id, animalId), eq(animals.tenantId, ctx.tenantId)))
      .returning();

    // Record audit event
    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'update',
        resource: 'animals',
        resourceId: animalId,
        details: { changes: Object.keys(updateValues) },
      });
    } catch {
      // Audit failure must not fail the mutation
    }

    return updated;
  }

  /**
   * Soft archive / deactivate animal (preserves historical milk, health, and breeding records)
   */
  static async archiveAnimal(ctx: ServiceContext, animalId: string, status: 'sold' | 'deceased' | 'quarantine' = 'deceased') {
    const existing = await this.getAnimalById(ctx, animalId);
    if (!existing) {
      throw new Error('NOT_FOUND: Animal not found.');
    }

    const db = getDrizzle();
    const [archived] = await db
      .update(animals)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(eq(animals.id, animalId), eq(animals.tenantId, ctx.tenantId)))
      .returning();

    try {
      await logAuditEvent({
        tenantId: ctx.tenantId,
        userId: ctx.userId,
        action: 'update',
        resource: 'animals',
        resourceId: animalId,
        details: { newStatus: status, previousStatus: existing.status },
      });
    } catch {
      // Ignore audit failure
    }

    return archived;
  }
}
