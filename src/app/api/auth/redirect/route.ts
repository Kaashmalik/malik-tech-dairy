// Smart redirect after sign-in based on user role and org status
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.redirect(
        new URL('/sign-in', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    const supabase = getSupabaseClient();

    // Check if user is super_admin
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase.from('platform_users') as any)
      .select('platform_role')
      .eq('id', userId)
      .single();

    // Super admin goes to super-admin dashboard
    if (user?.platform_role === 'super_admin') {
      return NextResponse.redirect(
        new URL('/super-admin', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    // User with organization goes to dashboard
    if (orgId) {
      return NextResponse.redirect(
        new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    // Check if user has any tenant memberships
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: memberships } = await (supabase.from('tenant_members') as any)
      .select('tenant_id')
      .eq('user_id', userId)
      .limit(1);

    if (memberships && memberships.length > 0) {
      // User has memberships but no active org - go to select farm
      return NextResponse.redirect(
        new URL('/select-farm', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      );
    }

    // Check for pending application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application } = await (supabase.from('farm_applications') as any)
      .select('id, status')
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (application) {
      // Has application - check status
      if (application.status === 'approved') {
        return NextResponse.redirect(
          new URL('/select-farm', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
        );
      }
      // Pending or other status - show application status
      return NextResponse.redirect(
        new URL(
          `/apply/status?id=${application.id}`,
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        )
      );
    }

    // No org, no memberships, no application - go to apply
    return NextResponse.redirect(
      new URL('/apply', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  } catch (error) {
    console.error('Auth redirect error:', error);
    // Fallback to apply page on error
    return NextResponse.redirect(
      new URL('/apply', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
    );
  }
}
