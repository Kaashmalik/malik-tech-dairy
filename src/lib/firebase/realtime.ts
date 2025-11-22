// Firebase Realtime Database Setup
import { ref, onValue, off, push, set, serverTimestamp } from "firebase/database";
import { realtimeDb } from "./client";

/**
 * Subscribe to milk logs updates for a tenant
 */
export function subscribeToMilkLogs(
  tenantId: string,
  callback: (logs: any[]) => void
): () => void {
  if (!realtimeDb) {
    console.warn("Realtime Database not available");
    return () => {};
  }

  const logsRef = ref(realtimeDb, `tenants/${tenantId}/milk_logs`);
  
  const unsubscribe = onValue(logsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const logs = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
      }));
      callback(logs);
    } else {
      callback([]);
    }
  });

  return () => {
    off(logsRef);
  };
}

/**
 * Subscribe to health records updates for a tenant
 */
export function subscribeToHealthRecords(
  tenantId: string,
  callback: (records: any[]) => void
): () => void {
  if (!realtimeDb) {
    console.warn("Realtime Database not available");
    return () => {};
  }

  const recordsRef = ref(realtimeDb, `tenants/${tenantId}/health_records`);
  
  const unsubscribe = onValue(recordsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const records = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
      }));
      callback(records);
    } else {
      callback([]);
    }
  });

  return () => {
    off(recordsRef);
  };
}

/**
 * Write milk log to Realtime Database (for real-time updates)
 * Note: This is in addition to Firestore, not a replacement
 */
export async function writeMilkLogToRealtime(
  tenantId: string,
  logData: any
): Promise<void> {
  if (!realtimeDb) {
    console.warn("Realtime Database not available");
    return;
  }

  const logsRef = ref(realtimeDb, `tenants/${tenantId}/milk_logs`);
  const newLogRef = push(logsRef);
  
  await set(newLogRef, {
    ...logData,
    timestamp: serverTimestamp(),
  });
}

/**
 * Write health record to Realtime Database (for real-time updates)
 */
export async function writeHealthRecordToRealtime(
  tenantId: string,
  recordData: any
): Promise<void> {
  if (!realtimeDb) {
    console.warn("Realtime Database not available");
    return;
  }

  const recordsRef = ref(realtimeDb, `tenants/${tenantId}/health_records`);
  const newRecordRef = push(recordsRef);
  
  await set(newRecordRef, {
    ...recordData,
    timestamp: serverTimestamp(),
  });
}

