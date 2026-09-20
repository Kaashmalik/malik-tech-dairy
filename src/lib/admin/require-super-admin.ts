import { getSupabaseClient } from '@/lib/supabase/server';

/**
 * Platform super-admin gate via platform_users.platform_role.
 * Prefer this over tenant-scoped hasRole('super_admin').
 */
export async function isPlatformSuperAdmin(userId: string): Promise<boolean> {
  if (!userId) return false;
  const supabase = getSupabaseClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user } = await (supabase.from('platform_users') as any)
    .select('platform_role')
    .eq('id', userId)
    .maybeSingle();
  return user?.platform_role === 'super_admin';
}
