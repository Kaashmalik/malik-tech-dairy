// API Route: Create Clerk Organization
import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
export const dynamic = 'force-dynamic';
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const { name, slug } = body;
    if (!name || !slug) {
      return NextResponse.json({ error: 'Missing required fields: name, slug' }, { status: 400 });
    }
    // Create organization in Clerk
    const client = await clerkClient();
    const organization = await client.organizations.createOrganization({
      name,
      slug,
      createdBy: userId,
    });
    return NextResponse.json({
      success: true,
      organizationId: organization.id,
      organization,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create organization' },
      { status: 500 }
    );
  }
}