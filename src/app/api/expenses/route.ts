// API Route: Expenses
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getTenantSubcollection } from '@/lib/firebase/tenant';
import type { Expense } from '@/types';

export const dynamic = 'force-dynamic';

// GET: List expenses
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(req.url);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      const category = searchParams.get('category');

      const expensesRef = getTenantSubcollection(context.tenantId, 'expenses', 'records');

      let query: any = expensesRef;

      if (category) {
        query = query.where('category', '==', category);
      }

      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        query = query.where('date', '>=', start).where('date', '<=', end);
      }

      query = query.orderBy('date', 'desc');

      const snapshot = await query.limit(100).get();
      const expenses = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));

      return NextResponse.json({ expenses });
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// POST: Create expense
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const { date, category, description, amount } = body;

      if (!date || !category || !description || !amount) {
        return NextResponse.json(
          { error: 'Missing required fields: date, category, description, amount' },
          { status: 400 }
        );
      }

      const expensesRef = getTenantSubcollection(context.tenantId, 'expenses', 'records');

      const expenseData: Omit<
        Expense,
        'id' | 'tenantId' | 'createdAt' | 'recordedBy' | 'currency'
      > = {
        date: new Date(date),
        category: category as Expense['category'],
        description,
        amount: parseFloat(amount),
      };

      const docRef = await expensesRef.add({
        ...expenseData,
        currency: 'PKR',
        recordedBy: context.userId,
        createdAt: new Date(),
      });

      return NextResponse.json({
        id: docRef.id,
        ...expenseData,
        currency: 'PKR',
        recordedBy: context.userId,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
