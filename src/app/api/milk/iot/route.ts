// IoT Device API: Create Milk Logs via API Key
import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth, hasApiKeyPermission } from '@/lib/api/middleware-api-key';
import { getTenantSubcollection } from '@/lib/firebase/tenant';
import { adminDb } from '@/lib/firebase/admin';
import { createMilkLogSchema } from '@/lib/validations/milk';
import type { MilkLog } from '@/types';

export const dynamic = 'force-dynamic';

// POST: Create milk log via API key (IoT device)
export async function POST(request: NextRequest) {
  return withApiKeyAuth(async (req, { tenantId, permissions }) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      // Check API key permission
      if (!hasApiKeyPermission(permissions, 'milk_logs')) {
        return NextResponse.json(
          { error: 'API key does not have permission to create milk logs' },
          { status: 403 }
        );
      }

      const body = await req.json();

      // Validate with Zod
      let validated;
      try {
        validated = createMilkLogSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      const { animalId, date, session, quantity, quality, notes } = validated;

      // Check if log already exists
      const milkLogsRef = getTenantSubcollection(tenantId, 'milkLogs', 'logs');

      const existing = await milkLogsRef
        .where('animalId', '==', animalId)
        .where('date', '==', date)
        .where('session', '==', session)
        .limit(1)
        .get();

      if (!existing.empty) {
        return NextResponse.json(
          { error: 'Milk log already exists for this animal, date, and session' },
          { status: 409 }
        );
      }

      const milkLogData: Omit<MilkLog, 'id'> = {
        tenantId,
        animalId,
        date,
        session,
        quantity,
        quality: quality || undefined,
        notes: notes || undefined,
        recordedBy: 'api_key', // Mark as API key entry
        createdAt: new Date(),
      };

      const docRef = await milkLogsRef.add(milkLogData);

      return NextResponse.json({
        success: true,
        log: { id: docRef.id, ...milkLogData },
      });
    } catch (error) {
      console.error('Error creating milk log via API key:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
