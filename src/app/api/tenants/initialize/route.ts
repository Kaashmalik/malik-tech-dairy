// API Route: Initialize Tenant (called after Clerk org creation)
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { initializeTenant } from '@/lib/firebase/tenant';

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

    // Initialize tenant in Firestore
    await initializeTenant(orgId, tenantSlug, userId, ownerEmail);

    return NextResponse.json({
      success: true,
      tenantId: orgId,
      message: 'Tenant initialized successfully',
    });
  } catch (error) {
    console.error('Error initializing tenant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
