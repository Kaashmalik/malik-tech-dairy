/**
 * Soft Delete Utilities
 * Provides consistent soft delete pattern across all resources
 */

import { getSupabaseClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

/**
 * Soft delete an animal
 */
export async function softDeleteAnimal(animalId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('animals')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'deleted',
      updated_at: new Date().toISOString(),
    })
    .eq('id', animalId);

  if (error) {
    throw new Error('Failed to soft delete animal');
  }
}

/**
 * Soft delete a milk log
 */
export async function softDeleteMilkLog(milkLogId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('milk_logs')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', milkLogId);

  if (error) {
    throw new Error('Failed to soft delete milk log');
  }
}

/**
 * Soft delete a health record
 */
export async function softDeleteHealthRecord(healthRecordId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('health_records')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', healthRecordId);

  if (error) {
    throw new Error('Failed to soft delete health record');
  }
}

/**
 * Soft delete a breeding record
 */
export async function softDeleteBreedingRecord(breedingRecordId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('breeding_records')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', breedingRecordId);

  if (error) {
    throw new Error('Failed to soft delete breeding record');
  }
}

/**
 * Soft delete an expense
 */
export async function softDeleteExpense(expenseId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('expenses')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', expenseId);

  if (error) {
    throw new Error('Failed to soft delete expense');
  }
}

/**
 * Soft delete a sale
 */
export async function softDeleteSale(saleId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('sales')
    .update({
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', saleId);

  if (error) {
    throw new Error('Failed to soft delete sale');
  }
}

/**
 * Restore a soft-deleted animal
 */
export async function restoreAnimal(animalId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('animals')
    .update({
      deleted_at: null,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', animalId);

  if (error) {
    throw new Error('Failed to restore animal');
  }
}

/**
 * Permanently delete soft-deleted records older than specified days
 */
export async function permanentlyDeleteOldRecords(daysOld: number = 90): Promise<number> {
  const supabase = getSupabaseClient();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  let totalDeleted = 0;

  // Delete old animals
  const { count: animalCount } = await supabase
    .from('animals')
    .delete()
    .lt('deleted_at', cutoffDate.toISOString())
    .not('deleted_at', 'is', null);

  totalDeleted += animalCount || 0;

  // Delete old milk logs
  const { count: milkLogCount } = await supabase
    .from('milk_logs')
    .delete()
    .lt('deleted_at', cutoffDate.toISOString())
    .not('deleted_at', 'is', null);

  totalDeleted += milkLogCount || 0;

  // Delete old health records
  const { count: healthRecordCount } = await supabase
    .from('health_records')
    .delete()
    .lt('deleted_at', cutoffDate.toISOString())
    .not('deleted_at', 'is', null);

  totalDeleted += healthRecordCount || 0;

  // Delete old breeding records
  const { count: breedingRecordCount } = await supabase
    .from('breeding_records')
    .delete()
    .lt('deleted_at', cutoffDate.toISOString())
    .not('deleted_at', 'is', null);

  totalDeleted += breedingRecordCount || 0;

  // Delete old expenses
  const { count: expenseCount } = await supabase
    .from('expenses')
    .delete()
    .lt('deleted_at', cutoffDate.toISOString())
    .not('deleted_at', 'is', null);

  totalDeleted += expenseCount || 0;

  // Delete old sales
  const { count: saleCount } = await supabase
    .from('sales')
    .delete()
    .lt('deleted_at', cutoffDate.toISOString())
    .not('deleted_at', 'is', null);

  totalDeleted += saleCount || 0;

  return totalDeleted;
}

/**
 * Get soft-deleted records for a tenant
 */
export async function getSoftDeletedRecords(
  tenantId: string,
  resource: 'animals' | 'milk_logs' | 'health_records' | 'breeding_records' | 'expenses' | 'sales'
): Promise<unknown[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from(resource)
    .select('*')
    .eq('tenant_id', tenantId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch soft-deleted ${resource}`);
  }

  return data || [];
}
