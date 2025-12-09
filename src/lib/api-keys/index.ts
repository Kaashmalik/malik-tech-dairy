// API Key Management System for IoT Devices
import { adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  keyHash: string; // Hashed API key (never store plain key)
  keyPrefix: string; // First 8 chars for identification (e.g., "mt_abc123")
  permissions: ('milk_logs' | 'health_records' | 'read_only')[];
  isActive: boolean;
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
}

/**
 * Generate a secure API key
 * Format: mt_{tenantId}_{random32chars}
 */
export function generateApiKey(tenantId: string): { key: string; hash: string; prefix: string } {
  const randomBytes = crypto.randomBytes(16).toString('hex');
  const key = `mt_${tenantId.slice(0, 8)}_${randomBytes}`;
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 11); // "mt_abc1234"

  return { key, hash, prefix };
}

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Verify API key against hash
 */
export function verifyApiKey(key: string, hash: string): boolean {
  const keyHash = hashApiKey(key);
  return crypto.timingSafeEqual(Buffer.from(keyHash), Buffer.from(hash));
}

/**
 * Create a new API key
 */
export async function createApiKey(
  tenantId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    permissions: ('milk_logs' | 'health_records' | 'read_only')[];
    expiresAt?: Date;
  }
): Promise<{ apiKey: ApiKey; plainKey: string }> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  const { key, hash, prefix } = generateApiKey(tenantId);

  const apiKeyData: Omit<ApiKey, 'id'> = {
    tenantId,
    name: data.name,
    description: data.description,
    keyHash: hash,
    keyPrefix: prefix,
    permissions: data.permissions,
    isActive: true,
    expiresAt: data.expiresAt,
    createdAt: new Date(),
    createdBy: userId,
  };

  const docRef = await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('api_keys')
    .add(apiKeyData);

  return {
    apiKey: { id: docRef.id, ...apiKeyData },
    plainKey: key, // Only returned once during creation
  };
}

/**
 * Validate API key and return tenant/permissions
 */
export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; tenantId?: string; permissions?: string[]; error?: string }> {
  if (!adminDb) {
    return { valid: false, error: 'Database not initialized' };
  }

  try {
    // Extract tenant ID from key prefix (format: mt_{tenantId8chars}_{random})
    const parts = key.split('_');
    if (parts.length < 3 || parts[0] !== 'mt') {
      return { valid: false, error: 'Invalid API key format' };
    }

    const tenantPrefix = parts[1];
    const keyHash = hashApiKey(key);

    // Search for API key by prefix (optimization)
    const apiKeysRef = adminDb.collectionGroup('api_keys');
    const snapshot = await apiKeysRef
      .where('keyPrefix', '==', key.substring(0, 11))
      .where('isActive', '==', true)
      .get();

    for (const doc of snapshot.docs) {
      const apiKeyData = doc.data() as ApiKey;

      // Verify hash
      if (verifyApiKey(key, apiKeyData.keyHash)) {
        // Check expiration
        if (apiKeyData.expiresAt && apiKeyData.expiresAt.toDate() < new Date()) {
          return { valid: false, error: 'API key has expired' };
        }

        // Update last used
        await doc.ref.update({ lastUsedAt: new Date() });

        return {
          valid: true,
          tenantId: apiKeyData.tenantId,
          permissions: apiKeyData.permissions,
        };
      }
    }

    return { valid: false, error: 'Invalid API key' };
  } catch (error) {
    console.error('Error validating API key:', error);
    return { valid: false, error: 'Failed to validate API key' };
  }
}

/**
 * List API keys for a tenant
 */
export async function listApiKeys(
  tenantId: string,
  options?: { includeInactive?: boolean }
): Promise<ApiKey[]> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  let query = adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('api_keys')
    .orderBy('createdAt', 'desc');

  if (!options?.includeInactive) {
    query = query.where('isActive', '==', true) as any;
  }

  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    expiresAt: doc.data().expiresAt?.toDate(),
    lastUsedAt: doc.data().lastUsedAt?.toDate(),
  })) as ApiKey[];
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(tenantId: string, keyId: string): Promise<void> {
  if (!adminDb) {
    throw new Error('Database not initialized');
  }

  await adminDb
    .collection('tenants')
    .doc(tenantId)
    .collection('api_keys')
    .doc(keyId)
    .update({ isActive: false });
}
