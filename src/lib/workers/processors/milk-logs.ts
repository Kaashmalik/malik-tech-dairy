// Background job processor for IoT milk logs
import type { Job } from 'bullmq';
import { adminDb } from '@/lib/firebase/admin';
import { getTenantSubcollection } from '@/lib/firebase/tenant';
import type { MilkLog } from '@/types';
interface MilkLogJobData {
  tenantId: string;
  animalId: string;
  date: string;
  session: 'morning' | 'evening';
  quantity: number;
  quality?: number;
  notes?: string;
  recordedBy: string;
  source: 'iot' | 'manual';
}
export async function processMilkLogJob(job: Job<MilkLogJobData>) {
  const { tenantId, animalId, date, session, quantity, quality, notes, recordedBy, source } =
    job.data;
  try {
    if (!adminDb) {
      throw new Error('Database not initialized');
    }
    // Check if log already exists
    const milkLogsRef = getTenantSubcollection(tenantId, 'milkLogs', 'logs');
    const existing = await milkLogsRef
      .where('animalId', '==', animalId)
      .where('date', '==', date)
      .where('session', '==', session)
      .limit(1)
      .get();
    if (!existing.empty) {
      // Update existing log instead of creating duplicate
      const existingDoc = existing.docs[0];
      await existingDoc.ref.update({
        quantity,
        quality: quality || existingDoc.data().quality,
        notes: notes || existingDoc.data().notes,
        updatedAt: new Date(),
      });
      job.updateProgress(100);
      return {
        success: true,
        logId: existingDoc.id,
        action: 'updated',
      };
    }
    // Create new milk log
    const milkLogData: Omit<MilkLog, 'id'> = {
      tenantId,
      animalId,
      date,
      session,
      quantity,
      quality: quality || undefined,
      notes: notes || undefined,
      recordedBy,
      createdAt: new Date(),
    };
    const docRef = await milkLogsRef.add(milkLogData);
    job.updateProgress(100);
    return {
      success: true,
      logId: docRef.id,
      action: 'created',
    };
  } catch (error) {
    throw new Error(`Milk log processing failed: ${error}`);
  }
}