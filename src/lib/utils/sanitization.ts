/**
 * Input Sanitization Utilities
 * Provides secure input sanitization to prevent XSS, SQL injection, and other attacks
 */

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = input.trim();

  // Escape HTML entities
  sanitized = validator.escape(sanitized);

  // Remove potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '');

  return sanitized;
}

/**
 * Sanitize HTML content (allow safe HTML tags)
 */
export function sanitizeHtml(input: string, allowedTags?: string[]): string {
  if (typeof input !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: allowedTags || ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const sanitized = input.trim().toLowerCase();

  if (!validator.isEmail(sanitized)) {
    throw new Error('Invalid email address');
  }

  return sanitized;
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const sanitized = input.trim();

  if (!validator.isURL(sanitized, { protocols: ['http', 'https'] })) {
    throw new Error('Invalid URL');
  }

  return sanitized;
}

/**
 * Sanitize phone number
 */
export function sanitizePhone(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove all non-digit characters
  const sanitized = input.replace(/\D/g, '');

  // Validate length (10-15 digits)
  if (sanitized.length < 10 || sanitized.length > 15) {
    throw new Error('Invalid phone number');
  }

  return sanitized;
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number {
  if (typeof input === 'number') {
    if (!isFinite(input)) {
      throw new Error('Invalid number');
    }
    return input;
  }

  const sanitized = input.trim();
  const parsed = parseFloat(sanitized);

  if (isNaN(parsed)) {
    throw new Error('Invalid number');
  }

  return parsed;
}

/**
 * Sanitize integer input
 */
export function sanitizeInteger(input: string | number): number {
  const num = sanitizeNumber(input);

  if (!Number.isInteger(num)) {
    throw new Error('Invalid integer');
  }

  return num;
}

/**
 * Sanitize date string
 */
export function sanitizeDate(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid date');
  }

  const sanitized = input.trim();

  if (!validator.isISO8601(sanitized)) {
    throw new Error('Invalid date format');
  }

  return sanitized;
}

/**
 * Sanitize boolean input
 */
export function sanitizeBoolean(input: string | boolean): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  const sanitized = input.trim().toLowerCase();

  if (sanitized === 'true' || sanitized === '1' || sanitized === 'yes') {
    return true;
  }

  if (sanitized === 'false' || sanitized === '0' || sanitized === 'no') {
    return false;
  }

  throw new Error('Invalid boolean value');
}

/**
 * Sanitize array of strings
 */
export function sanitizeStringArray(input: string[]): string[] {
  if (!Array.isArray(input)) {
    throw new Error('Invalid array');
  }

  return input.map(item => sanitizeString(String(item)));
}

/**
 * Sanitize object keys and values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  input: Record<string, unknown>
): T {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    // Sanitize key
    const sanitizedKey = sanitizeString(key);

    // Sanitize value based on type
    if (typeof value === 'string') {
      sanitized[sanitizedKey] = sanitizeString(value);
    } else if (typeof value === 'number') {
      sanitized[sanitizedKey] = sanitizeNumber(String(value));
    } else if (typeof value === 'boolean') {
      sanitized[sanitizedKey] = value;
    } else if (Array.isArray(value)) {
      sanitized[sanitizedKey] = sanitizeStringArray(value as string[]);
    } else if (value === null || value === undefined) {
      sanitized[sanitizedKey] = value;
    } else {
      // For complex objects, recursively sanitize
      sanitized[sanitizedKey] = sanitizeObject(value as Record<string, unknown>);
    }
  }

  return sanitized as T;
}

/**
 * Validate and sanitize tag/identifier
 */
export function sanitizeTag(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid tag');
  }

  const sanitized = input.trim().toUpperCase();

  // Only allow alphanumeric and hyphens
  if (!/^[A-Z0-9-]+$/.test(sanitized)) {
    throw new Error('Tag can only contain letters, numbers, and hyphens');
  }

  return sanitized;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input.trim();

  // Remove special SQL characters
  sanitized = sanitized.replace(/['";\\]/g, '');

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  return sanitized;
}

/**
 * Sanitize file name
 */
export function sanitizeFileName(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid file name');
  }

  let sanitized = input.trim();

  // Remove path traversal attempts
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // Remove special characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * Validate and sanitize JSON
 */
export function sanitizeJson(input: string): Record<string, unknown> {
  if (typeof input !== 'string') {
    throw new Error('Invalid JSON');
  }

  try {
    const parsed = JSON.parse(input);
    return sanitizeObject(parsed);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Sanitize database identifier (table name, column name)
 */
export function sanitizeDbIdentifier(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Invalid identifier');
  }

  const sanitized = input.trim().toLowerCase();

  // Only allow alphanumeric and underscores
  if (!/^[a-z][a-z0-9_]*$/.test(sanitized)) {
    throw new Error('Invalid database identifier');
  }

  return sanitized;
}

/**
 * Sanitize enum value
 */
export function sanitizeEnumValue<T extends string>(input: string, allowedValues: readonly T[]): T {
  const sanitized = sanitizeString(input).toLowerCase();

  if (!allowedValues.includes(sanitized as T)) {
    throw new Error(`Invalid enum value. Must be one of: ${allowedValues.join(', ')}`);
  }

  return sanitized as T;
}
