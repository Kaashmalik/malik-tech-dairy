// API Route: Get Animal Count (Supabase)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getAnimalCount } from '@/lib/supabase/limits';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantContext(async (_req, context) => {
    try {
      const count = await getAnimalCount(context.tenantId);
      return NextResponse.json({ success: true, count });
    } catch (error) {
      console.error('Animal count error:', error);
      return NextResponse.json({ success: true, count: 0 });
    }
  })(request);
}
