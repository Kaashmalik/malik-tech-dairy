// API Route: Initialize Tenant (called after Clerk org creation)
// Uses Supabase for data persistence
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeTenant } from '@/lib/supabase/tenant';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { tenantSlug, ownerEmail } = body;

    if (!tenantSlug || !ownerEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: tenantSlug, ownerEmail' },
        { status: 400 }
      );
    }

    logger.info('Initializing tenant', { tenantId: orgId, tenantSlug });

    // Initialize tenant in Supabase (creates tenant, subscription, custom fields)
    await initializeTenant(orgId, tenantSlug, userId, ownerEmail);

    logger.info('Tenant initialized successfully', { tenantId: orgId });

    return NextResponse.json({
      success: true,
      tenantId: orgId,
      message: 'Tenant initialized successfully',
    });
  } catch (error: any) {
    logger.error('Failed to initialize tenant', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
