// AES-256 Encryption for Sensitive Health Data
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES
const SALT_LENGTH = 64; // 64 bytes for salt
const TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const KEY_LENGTH = 32; // 32 bytes for AES-256

/**
 * Get encryption key from environment variable
 * In production, this should be stored securely (e.g., AWS KMS, HashiCorp Vault)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }

  // If key is hex-encoded, decode it; otherwise use it directly
  if (key.length === 64) {
    // Assume hex-encoded 32-byte key
    return Buffer.from(key, 'hex');
  }

  // Derive key from string using PBKDF2
  return crypto.pbkdf2Sync(key, 'malik-tech-dairy-salt', 100000, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt sensitive data (e.g., health notes)
 * Returns base64-encoded string: salt:iv:tag:encryptedData
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) {
    return plaintext;
  }

  try {
    const key = getEncryptionKey();
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const tag = cipher.getAuthTag();

    // Return format: salt:iv:tag:encryptedData
    return `${salt.toString('base64')}:${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 * Expects base64-encoded string: salt:iv:tag:encryptedData
 */
export function decrypt(encryptedData: string): string {
  if (!encryptedData || !encryptedData.includes(':')) {
    // If not encrypted format, return as-is (for backward compatibility)
    return encryptedData;
  }

  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');

    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltBase64, ivBase64, tagBase64, encrypted] = parts;

    const salt = Buffer.from(saltBase64, 'base64');
    const iv = Buffer.from(ivBase64, 'base64');
    const tag = Buffer.from(tagBase64, 'base64');

    // Derive key from master key and salt
    const derivedKey = crypto.pbkdf2Sync(key, salt, 100000, KEY_LENGTH, 'sha256');

    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Check if a string is encrypted (has the encrypted format)
 */
export function isEncrypted(data: string): boolean {
  return data.includes(':') && data.split(':').length === 4;
}
