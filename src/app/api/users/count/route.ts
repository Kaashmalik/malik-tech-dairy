// API Route: Get User Count for Tenant (Supabase)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getUserCount } from '@/lib/supabase/limits';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantContext(async (_req, context) => {
    try {
      const count = await getUserCount(context.tenantId);
      return NextResponse.json({ success: true, count });
    } catch (error) {
      console.error('User count error:', error);
      return NextResponse.json({ success: true, count: 0 });
    }
  })(request);
}
