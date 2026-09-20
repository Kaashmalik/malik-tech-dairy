// PATCH /api/admin/users/[id]/role — update platform role
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export const dynamic = 'force-dynamic';

const schema = z.object({
  role: z.enum(['super_admin', 'admin', 'user']),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    if (id === userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own platform role' },
        { status: 400 }
      );
    }

    const body = schema.parse(await request.json());
    const supabase = getSupabaseClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('platform_users') as any)
      .update({
        platform_role: body.role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Update user role error:', error);
      return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Role updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid role', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Update user role unexpected:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
