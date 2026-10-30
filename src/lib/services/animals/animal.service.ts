import { fetchAllRows, tenantDb, toCamel, toSnake, unwrap } from '@/lib/supabase/tenant-db';
import { ServiceContext, PaginatedResult } from '../types';
import { SubscriptionService } from '@/lib/subscriptions/management';
import { checkTenantAnimalQuota } from '@/lib/tenant/context';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimalRecord = Record<string, any>;

const toIso = (value?: string | Date | null) => (value ? new Date(value).toISOString() : null);

/** Strip PostgREST filter syntax (, ( ) * etc.) so a search term cannot alter the query. */
export function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[^\p{L}\p{N}\s\-_.]/gu, '')
    .trim()
    .slice(0, 50);
}

function mapAnimal(row: Record<string, unknown>): AnimalRecord {
  return toCamel<AnimalRecord>(row)!;
}

async function auditSafely(params: Parameters<typeof logAuditEvent>[0]) {
  try {
    await logAuditEvent(params);
  } catch {
    // Audit failure must not fail the mutation
  }
}

export class AnimalService {
  /**
   * List animals with server-side pagination, search and filtering
   */
  static async listAnimals(
    ctx: ServiceContext,
    filters: AnimalListFilters = {}
  ): Promise<PaginatedResult<AnimalRecord>> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 50));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = tenantDb(ctx.tenantId)
      .select('animals', '*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.species) query = query.eq('species', filters.species);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.gender) query = query.eq('gender', filters.gender);
    if (filters.breed) query = query.eq('breed', filters.breed);
    if (filters.search) {
      const term = sanitizeSearchTerm(filters.search);
      if (term) {
        query = query.or(`tag.ilike.%${term}%,name.ilike.%${term}%`);
      }
    }

    const { data, error, count } = await query;
    if (error) {
      throw new Error(`Failed to list animals: ${error.message}`);
    }

    const total = count || 0;
    return {
      items: ((data || []) as unknown as Record<string, unknown>[]).map(mapAnimal),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 0,
      },
    };
  }

  /**
   * Get animal by ID ensuring tenant ownership
   */
  static async getAnimalById(ctx: ServiceContext, animalId: string) {
    const row = unwrap(
      await tenantDb(ctx.tenantId).select('animals').eq('id', animalId).maybeSingle(),
      'Load animal'
    ) as Record<string, unknown> | null;
    return row ? mapAnimal(row) : null;
  }

  /**
   * Get comprehensive animal profile with related summary stats
   */
  static async getAnimalProfile(ctx: ServiceContext, animalId: string) {
    const animal = await this.getAnimalById(ctx, animalId);
    if (!animal) return null;

    const t = tenantDb(ctx.tenantId);
    const [milk, health, breeding, quantities] = await Promise.all([
      t.select('milk_logs').eq('animal_id', animalId).order('date', { ascending: false }).limit(10),
      t
        .select('health_records')
        .eq('animal_id', animalId)
        .order('date', { ascending: false })
        .limit(5),
      t
        .select('breeding_records')
        .eq('animal_id', animalId)
        .order('breeding_date', { ascending: false })
        .limit(5),
      // Lifetime totals: quantities only, paged past the PostgREST row cap
      fetchAllRows<{ quantity: number | null }>(
        () => t.select('milk_logs', 'quantity').eq('animal_id', animalId).order('id'),
        'Load milk totals'
      ),
    ]);

    const rows = (r: { data: unknown }) =>
      ((r.data || []) as Record<string, unknown>[]).map(row => toCamel(row)!);
    const totalQuantity = quantities.reduce((sum, r) => sum + Number(r.quantity || 0), 0);

    return {
      animal,
      recentMilk: rows(milk),
      recentHealth: rows(health),
      recentBreeding: rows(breeding),
      summary: {
        totalMilkLogs: quantities.length,
        totalMilkedLiters: Math.round(totalQuantity * 10) / 10,
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
      throw new Error(
        'PLAN_LIMIT_REACHED: You have reached the maximum animals allowed on your subscription plan.'
      );
    }

    // Enforce species permission
    const speciesAllowed = await subscriptionService.isSpeciesAllowed(
      normalizedSpecies as AnimalSpecies
    );
    if (!speciesAllowed) {
      throw new Error(
        `SPECIES_NOT_ALLOWED: The species '${data.species}' is not available on your current subscription plan.`
      );
    }

    // Enforce tenant animal quota
    const quota = await checkTenantAnimalQuota(ctx.tenantId);
    if (!quota.allowed) {
      throw new Error(
        `PLAN_LIMIT_REACHED: Your farm has reached its limit of ${quota.limit} animals under the ${quota.plan} plan. Please upgrade your subscription to add more animals.`
      );
    }

    const t = tenantDb(ctx.tenantId);
    const tag = data.tag.trim();

    // Check duplicate tag within tenant
    const existing = unwrap(
      await t.select('animals', 'id').eq('tag', tag).limit(1),
      'Check duplicate tag'
    ) as unknown[];
    if (existing.length > 0) {
      throw new Error(
        'DUPLICATE_TAG: An animal with this ear tag number already exists on your farm.'
      );
    }

    const now = new Date().toISOString();
    const created = unwrap(
      await t
        .insert('animals', {
          id: `animal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          tag,
          name: data.name?.trim() || null,
          species: normalizedSpecies,
          breed: data.breed?.trim() || null,
          date_of_birth: toIso(data.dateOfBirth),
          gender: data.gender,
          photo_url: data.photoUrl || null,
          status: data.status || 'active',
          weight: data.weight ? Math.round(data.weight) : null,
          color: data.color?.trim() || null,
          notes: data.notes?.trim() || null,
          mother_id: data.motherId || null,
          father_id: data.fatherId || null,
          purchase_date: toIso(data.purchaseDate),
          purchase_price: data.purchasePrice ? Math.round(data.purchasePrice) : null,
          created_by: ctx.userId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single(),
      'Create animal'
    ) as Record<string, unknown>;

    const animal = mapAnimal(created);
    await auditSafely({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'create',
      resource: 'animals',
      resourceId: animal.id,
      details: { tag: animal.tag, species: animal.species },
    });

    return animal;
  }

  /**
   * Update animal details
   */
  static async updateAnimal(ctx: ServiceContext, animalId: string, data: UpdateAnimalDTO) {
    const existing = await this.getAnimalById(ctx, animalId);
    if (!existing) {
      throw new Error('NOT_FOUND: Animal not found.');
    }

    const t = tenantDb(ctx.tenantId);

    // If tag changed, ensure new tag is unique within tenant
    if (data.tag && data.tag.trim() !== existing.tag) {
      const duplicate = unwrap(
        await t.select('animals', 'id').eq('tag', data.tag.trim()).neq('id', animalId).limit(1),
        'Check duplicate tag'
      ) as unknown[];
      if (duplicate.length > 0) {
        throw new Error('DUPLICATE_TAG: An animal with this ear tag number already exists.');
      }
    }

    const trimOrNull = (v?: string) => (v ? v.trim() : null);
    const changes: Record<string, unknown> = {
      tag: data.tag?.trim(),
      name: data.name !== undefined ? trimOrNull(data.name) : undefined,
      species:
        data.species !== undefined ? (data.species === 'cattle' ? 'cow' : data.species) : undefined,
      breed: data.breed !== undefined ? trimOrNull(data.breed) : undefined,
      dateOfBirth: data.dateOfBirth !== undefined ? toIso(data.dateOfBirth) : undefined,
      gender: data.gender,
      photoUrl: data.photoUrl !== undefined ? data.photoUrl || null : undefined,
      status: data.status,
      weight:
        data.weight !== undefined ? (data.weight ? Math.round(data.weight) : null) : undefined,
      color: data.color !== undefined ? trimOrNull(data.color) : undefined,
      notes: data.notes !== undefined ? trimOrNull(data.notes) : undefined,
      motherId: data.motherId !== undefined ? data.motherId || null : undefined,
      fatherId: data.fatherId !== undefined ? data.fatherId || null : undefined,
      purchaseDate: data.purchaseDate !== undefined ? toIso(data.purchaseDate) : undefined,
      purchasePrice:
        data.purchasePrice !== undefined
          ? data.purchasePrice
            ? Math.round(data.purchasePrice)
            : null
          : undefined,
    };
    const updateValues = { ...toSnake(changes), updated_at: new Date().toISOString() };

    const updated = unwrap(
      await t.update('animals', updateValues).eq('id', animalId).select().single(),
      'Update animal'
    ) as Record<string, unknown>;

    await auditSafely({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'update',
      resource: 'animals',
      resourceId: animalId,
      details: { changes: Object.keys(updateValues) },
    });

    return mapAnimal(updated);
  }

  /**
   * Soft archive / deactivate animal (preserves historical milk, health, and breeding records)
   */
  static async archiveAnimal(
    ctx: ServiceContext,
    animalId: string,
    status: 'sold' | 'deceased' | 'quarantine' = 'deceased'
  ) {
    const existing = await this.getAnimalById(ctx, animalId);
    if (!existing) {
      throw new Error('NOT_FOUND: Animal not found.');
    }

    const archived = unwrap(
      await tenantDb(ctx.tenantId)
        .update('animals', { status, updated_at: new Date().toISOString() })
        .eq('id', animalId)
        .select()
        .single(),
      'Archive animal'
    ) as Record<string, unknown>;

    await auditSafely({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      action: 'update',
      resource: 'animals',
      resourceId: animalId,
      details: { newStatus: status, previousStatus: existing.status },
    });

    return mapAnimal(archived);
  }
}
