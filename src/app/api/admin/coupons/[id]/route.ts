// API Route: Super Admin - Update/Delete Coupon
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase/admin';
export const dynamic = 'force-dynamic';
async function isSuperAdmin(userId: string): Promise<boolean> {
  if (!adminDb) return false;
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    return userData?.role === 'super_admin' || userData?.isSuperAdmin === true;
  } catch {
    return false;
  }
}
// PUT: Update coupon
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    const body = await request.json();
    const updates: any = {
      updatedAt: new Date(),
    };
    // Allow updating these fields
    if (body.type !== undefined) updates.type = body.type;
    if (body.value !== undefined) updates.value = body.value;
    if (body.targetPlans !== undefined) updates.targetPlans = body.targetPlans;
    if (body.minAmount !== undefined) updates.minAmount = body.minAmount;
    if (body.maxDiscount !== undefined) updates.maxDiscount = body.maxDiscount;
    if (body.validFrom !== undefined) updates.validFrom = new Date(body.validFrom);
    if (body.validUntil !== undefined) updates.validUntil = new Date(body.validUntil);
    if (body.maxUses !== undefined) updates.maxUses = body.maxUses;
    if (body.maxUsesPerUser !== undefined) updates.maxUsesPerUser = body.maxUsesPerUser;
    if (body.isActive !== undefined) updates.isActive = body.isActive;
    if (body.description !== undefined) updates.description = body.description;
    await adminDb.collection('coupons').doc(id).update(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// DELETE: Delete coupon (soft delete by setting isActive = false)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    if (!userId || !(await isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: 'Unauthorized - Super admin access required' },
        { status: 403 }
      );
    }
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }
    await adminDb.collection('coupons').doc(id).update({
      isActive: false,
      updatedAt: new Date(),
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}