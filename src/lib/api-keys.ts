/**
 * API Key Management with Rotation
 * Handles API key creation, validation, and rotation
 */

import { getSupabaseClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export interface ApiKey {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  scopes: string[];
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  lastRotatedAt: Date;
  rotationRequired: boolean;
  rotationNotificationSent: boolean;
  isActive: boolean;
  createdAt: Date;
}

const API_KEY_LENGTH = 32;
const API_KEY_PREFIX_LENGTH = 8;
const API_KEY_ROTATION_DAYS = 90;
const API_KEY_EXPIRY_DAYS = 365;

/**
 * Generate a secure API key
 */
export function generateApiKey(): string {
  const prefix = crypto.randomBytes(API_KEY_PREFIX_LENGTH).toString('hex');
  const key = crypto.randomBytes(API_KEY_LENGTH).toString('hex');
  return `${prefix}_${key}`;
}

/**
 * Hash an API key for secure storage
 */
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Extract prefix from API key for display
 */
export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.split('_')[0];
}

/**
 * Create a new API key
 */
export async function createApiKey(params: {
  tenantId: string;
  userId: string;
  name: string;
  scopes: string[];
  expiresInDays?: number;
}): Promise<{ apiKey: string; prefix: string }> {
  const supabase = getSupabaseClient();

  const apiKey = generateApiKey();
  const prefix = getApiKeyPrefix(apiKey);
  const keyHash = hashApiKey(apiKey);
  const now = new Date();
  const expiresAt = params.expiresInDays
    ? new Date(now.getTime() + params.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const { error } = await supabase.from('api_keys').insert({
    tenant_id: params.tenantId,
    user_id: params.userId,
    name: params.name,
    key_prefix: prefix,
    key_hash: keyHash,
    scopes: params.scopes,
    expires_at: expiresAt?.toISOString() || null,
    last_used_at: null,
    last_rotated_at: now.toISOString(),
    rotation_required: false,
    rotation_notification_sent: false,
    is_active: true,
    created_at: now.toISOString(),
  });

  if (error) {
    throw new Error('Failed to create API key');
  }

  return { apiKey, prefix };
}

/**
 * Validate an API key
 */
export async function validateApiKey(apiKey: string): Promise<ApiKey | null> {
  const supabase = getSupabaseClient();

  const prefix = getApiKeyPrefix(apiKey);
  const keyHash = hashApiKey(apiKey);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if key has expired
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await deactivateApiKey(data.id);
    return null;
  }

  // Update last used timestamp
  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    id: data.id,
    tenantId: data.tenant_id,
    userId: data.user_id,
    name: data.name,
    keyPrefix: data.key_prefix,
    keyHash: data.key_hash,
    scopes: data.scopes,
    expiresAt: data.expires_at ? new Date(data.expires_at) : null,
    lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : null,
    lastRotatedAt: new Date(data.last_rotated_at),
    rotationRequired: data.rotation_required,
    rotationNotificationSent: data.rotation_notification_sent,
    isActive: data.is_active,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Rotate an API key
 */
export async function rotateApiKey(apiKeyId: string): Promise<{ apiKey: string; prefix: string }> {
  const supabase = getSupabaseClient();

  // Get existing key
  const { data: existingKey, error: fetchError } = await supabase
    .from('api_keys')
    .select('*')
    .eq('id', apiKeyId)
    .single();

  if (fetchError || !existingKey) {
    throw new Error('API key not found');
  }

  // Generate new key
  const newApiKey = generateApiKey();
  const newPrefix = getApiKeyPrefix(newApiKey);
  const newKeyHash = hashApiKey(newApiKey);
  const now = new Date();

  // Update key
  const { error: updateError } = await supabase
    .from('api_keys')
    .update({
      key_prefix: newPrefix,
      key_hash: newKeyHash,
      last_rotated_at: now.toISOString(),
      rotation_required: false,
      rotation_notification_sent: false,
      updated_at: now.toISOString(),
    })
    .eq('id', apiKeyId);

  if (updateError) {
    throw new Error('Failed to rotate API key');
  }

  return { apiKey: newApiKey, prefix: newPrefix };
}

/**
 * Deactivate an API key
 */
export async function deactivateApiKey(apiKeyId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', apiKeyId);

  if (error) {
    throw new Error('Failed to deactivate API key');
  }
}

/**
 * Delete an API key
 */
export async function deleteApiKey(apiKeyId: string): Promise<void> {
  const supabase = getSupabaseClient();

  const { error } = await supabase.from('api_keys').delete().eq('id', apiKeyId);

  if (error) {
    throw new Error('Failed to delete API key');
  }
}

/**
 * Check if API key rotation is required
 */
export async function checkRotationRequired(): Promise<ApiKey[]> {
  const supabase = getSupabaseClient();

  const rotationThreshold = new Date();
  rotationThreshold.setDate(rotationThreshold.getDate() - API_KEY_ROTATION_DAYS);

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('is_active', true)
    .lt('last_rotated_at', rotationThreshold.toISOString())
    .eq('rotation_required', false);

  if (error) {
    throw new Error('Failed to check rotation requirements');
  }

  // Mark keys as requiring rotation
  const apiKeyIds = (data || []).map(key => key.id);

  if (apiKeyIds.length > 0) {
    await supabase.from('api_keys').update({ rotation_required: true }).in('id', apiKeyIds);
  }

  return (data || []).map(key => ({
    id: key.id,
    tenantId: key.tenant_id,
    userId: key.user_id,
    name: key.name,
    keyPrefix: key.key_prefix,
    keyHash: key.key_hash,
    scopes: key.scopes,
    expiresAt: key.expires_at ? new Date(key.expires_at) : null,
    lastUsedAt: key.last_used_at ? new Date(key.last_used_at) : null,
    lastRotatedAt: new Date(key.last_rotated_at),
    rotationRequired: true,
    rotationNotificationSent: key.rotation_notification_sent,
    isActive: key.is_active,
    createdAt: new Date(key.created_at),
  }));
}

/**
 * Get API keys for a tenant
 */
export async function getTenantApiKeys(tenantId: string): Promise<ApiKey[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('api_keys')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch API keys');
  }

  return (data || []).map(key => ({
    id: key.id,
    tenantId: key.tenant_id,
    userId: key.user_id,
    name: key.name,
    keyPrefix: key.key_prefix,
    keyHash: key.key_hash,
    scopes: key.scopes,
    expiresAt: key.expires_at ? new Date(key.expires_at) : null,
    lastUsedAt: key.last_used_at ? new Date(key.last_used_at) : null,
    lastRotatedAt: new Date(key.last_rotated_at),
    rotationRequired: key.rotation_required,
    rotationNotificationSent: key.rotation_notification_sent,
    isActive: key.is_active,
    createdAt: new Date(key.created_at),
  }));
}

/**
 * Send rotation notification for API keys
 */
export async function sendRotationNotifications(apiKeys: ApiKey[]): Promise<void> {
  // This would integrate with your email/notification system
  // For now, we'll just mark them as sent
  const supabase = getSupabaseClient();

  const apiKeyIds = apiKeys.map(key => key.id);

  if (apiKeyIds.length > 0) {
    await supabase
      .from('api_keys')
      .update({ rotation_notification_sent: true })
      .in('id', apiKeyIds);
  }
}
