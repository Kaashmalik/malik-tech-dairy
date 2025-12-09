// API Route: Get Milk Production Predictions
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { adminDb } from '@/lib/firebase/admin';
import { getTenantSubcollection } from '@/lib/firebase/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      // Get predictions from Firestore
      const predictionsRef = adminDb
        .collection('tenants')
        .doc(context.tenantId)
        .collection('predictions')
        .doc('milk_7d');

      const predictionDoc = await predictionsRef.get();

      if (!predictionDoc.exists) {
        return NextResponse.json({
          predictions: [],
          lastUpdated: null,
          message: 'No predictions available yet. Predictions are generated daily.',
        });
      }

      const data = predictionDoc.data();

      return NextResponse.json({
        predictions: data?.predictions || [],
        confidenceBand: data?.confidenceBand || [],
        lastUpdated: data?.lastUpdated?.toDate?.()?.toISOString() || null,
        modelVersion: data?.modelVersion || '1.0',
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
