// Farm data export and deletion (owner self-service). Server-only.
import JSZip from 'jszip';
import { clerkClient } from '@clerk/nextjs/server';
import { db, fetchAllRows, tenantDb } from '@/lib/supabase/tenant-db';
import { downgradeToFree } from '@/lib/subscriptions/management';
import { logger } from '@/lib/logger';

/** Every table holding farm data (api_keys excluded: secrets, not farm data). */
export const TENANT_DATA_TABLES = [
  'animals',
  'milk_logs',
  'health_records',
  'breeding_records',
  'pregnancy_checks',
  'heat_detections',
  'semen_inventory',
  'animal_treatments',
  'animal_vaccinations',
  'treatment_records',
  'vaccination_schedules',
  'expenses',
  'sales',
  'feed_inventory',
  'feeding_schedules',
  'nutrition_templates',
  'tenant_medicine_inventory',
  'task_assignments',
  'staff_attendance',
  'performance_reviews',
  'tenant_members',
  'subscriptions',
  'payments',
  'coupon_usage',
  'custom_fields_config',
  'file_uploads',
  'notifications',
  'audit_logs',
] as const;

// "relation does not exist" - table not created in this deployment
const MISSING_TABLE_CODES = new Set(['42P01', 'PGRST205']);

export interface ExportResult {
  zip: Buffer;
  counts: Record<string, number>;
  skipped: string[];
}

/** ZIP with farm.json + one JSON file per table + manifest.json. */
export async function exportTenantData(tenantId: string): Promise<ExportResult> {
  const t = tenantDb(tenantId);
  const zip = new JSZip();
  const counts: Record<string, number> = {};
  const skipped: string[] = [];

  const { data: farm } = await db().from('tenants').select('*').eq('id', tenantId).maybeSingle();
  zip.file('farm.json', JSON.stringify(farm, null, 2));

  for (const table of TENANT_DATA_TABLES) {
    try {
      const rows = await fetchAllRows<Record<string, unknown>>(
        () => t.select(table).order('id'),
        `Export ${table}`,
        500_000
      );
      counts[table] = rows.length;
      zip.file(`${table}.json`, JSON.stringify(rows, null, 2));
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code && MISSING_TABLE_CODES.has(code)) {
        skipped.push(table);
        continue;
      }
      throw error;
    }
  }

  zip.file(
    'manifest.json',
    JSON.stringify(
      { tenantId, exportedAt: new Date().toISOString(), counts, skippedTables: skipped },
      null,
      2
    )
  );
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  return { zip: buffer, counts, skipped };
}

/**
 * Close a farm: cancel billing, soft-delete the tenant (rows retained for
 * recovery - see docs/SETUP.md), deactivate members and delete the Clerk
 * organization so nobody can select it again.
 */
export async function deleteTenant(tenantId: string): Promise<void> {
  await downgradeToFree(tenantId);

  const now = new Date().toISOString();
  const { error } = await db()
    .from('tenants')
    .update({ deleted_at: now, updated_at: now })
    .eq('id', tenantId);
  if (error) throw new Error(`Soft delete farm: ${error.message}`);

  await tenantDb(tenantId).update('tenant_members', { status: 'inactive', updated_at: now });

  try {
    const clerk = await clerkClient();
    await clerk.organizations.deleteOrganization(tenantId);
  } catch (error) {
    // Data access is already closed (deleted_at -> 410); a leftover Clerk org is harmless
    logger.error('Clerk organization delete failed', error, { tenantId });
  }
}
