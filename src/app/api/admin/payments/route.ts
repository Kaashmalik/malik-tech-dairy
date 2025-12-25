// Admin API - List all payments
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { getSupabaseClient } = await import('@/lib/supabase');
    const supabase = getSupabaseClient();
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*, tenants(farm_name)')
      .order('created_at', { ascending: false });
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }
    const formattedPayments = (payments || []).map((payment: Record<string, unknown>) => ({
      id: payment.id,
      farmName: (payment.tenants as Record<string, unknown>)?.farm_name || 'Unknown',
      amount: payment.amount,
      currency: payment.currency,
      gateway: payment.gateway,
      status: payment.status,
      plan: payment.plan,
      transactionId: payment.transaction_id,
      createdAt: payment.created_at,
    }));
    return NextResponse.json({ success: true, data: formattedPayments });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}