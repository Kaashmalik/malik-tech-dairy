// IoT Device API: Create Health Records via API Key
import { NextRequest, NextResponse } from 'next/server';
import { withApiKeyAuth, hasApiKeyPermission } from '@/lib/api/middleware-api-key';
import { getTenantSubcollection } from '@/lib/firebase/tenant';
import { adminDb } from '@/lib/firebase/admin';
import { createHealthRecordSchema } from '@/lib/validations/health';
import { encrypt } from '@/lib/encryption';
import type { HealthRecord } from '@/types';
export const dynamic = 'force-dynamic';
// POST: Create health record via API key (IoT device)
export async function POST(request: NextRequest) {
  return withApiKeyAuth(async (req, { tenantId, permissions }) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }
      // Check API key permission
      if (!hasApiKeyPermission(permissions, 'health_records')) {
        return NextResponse.json(
          { error: 'API key does not have permission to create health records' },
          { status: 403 }
        );
      }
      const body = await req.json();
      // Validate with Zod
      let validated;
      try {
        validated = createHealthRecordSchema.parse(body);
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }
      const { animalId, type, date, description, veterinarian, cost, nextDueDate, notes } =
        validated;
      const healthRef = getTenantSubcollection(tenantId, 'health', 'records');
      // Encrypt sensitive notes
      const encryptedNotes = notes ? encrypt(notes) : undefined;
      const recordData: Omit<HealthRecord, 'id' | 'tenantId' | 'createdAt'> = {
        animalId,
        type: type as HealthRecord['type'],
        date: typeof date === 'string' ? new Date(date) : date,
        description,
        veterinarian,
        cost,
        nextDueDate: nextDueDate
          ? typeof nextDueDate === 'string'
            ? new Date(nextDueDate)
            : nextDueDate
          : undefined,
      };
      const docRef = await healthRef.add({
        ...recordData,
        notes: encryptedNotes, // Store encrypted notes
        createdAt: new Date(),
      });
      return NextResponse.json({
        success: true,
        record: {
          id: docRef.id,
          ...recordData,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}