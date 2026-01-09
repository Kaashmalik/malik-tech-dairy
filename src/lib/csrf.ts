/**
 * CSRF Protection Middleware
 * Provides Cross-Site Request Forgery protection for state-changing operations
 */

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate a secure CSRF token
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Validate CSRF token
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (!token || !storedToken) {
    return false;
  }

  // Use constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(storedToken, 'hex'));
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value || null;
}

/**
 * Set CSRF token in cookie
 */
export async function setCsrfTokenInCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

/**
 * Get CSRF token from request header
 */
export function getCsrfTokenFromHeader(request: NextRequest): string | null {
  return request.headers.get(CSRF_HEADER_NAME);
}

/**
 * Middleware to check CSRF token for state-changing operations
 */
export async function requireCsrfProtection(request: NextRequest): Promise<NextResponse | null> {
  const method = request.method.toUpperCase();

  // Only check CSRF for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!stateChangingMethods.includes(method)) {
    return null; // Skip CSRF check for GET, HEAD, OPTIONS
  }

  // Get tokens
  const headerToken = getCsrfTokenFromHeader(request);
  const cookieToken = await getCsrfTokenFromCookie();

  // Validate
  if (!headerToken || !cookieToken || !validateCsrfToken(headerToken, cookieToken)) {
    return NextResponse.json(
      {
        success: false,
        error: 'CSRF token validation failed',
        code: 'CSRF_ERROR',
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Middleware wrapper to add CSRF protection to handlers
 */
export function withCsrfProtection(handler: (request: NextRequest) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    // Check CSRF protection
    const csrfError = await requireCsrfProtection(request);
    if (csrfError) {
      return csrfError;
    }

    // Call the original handler
    return handler(request);
  };
}

/**
 * Generate and set CSRF token (for GET requests to provide token to client)
 */
export async function generateAndSetCsrfToken(): Promise<string> {
  const token = generateCsrfToken();
  await setCsrfTokenInCookie(token);
  return token;
}

/**
 * Refresh CSRF token
 */
export async function refreshCsrfToken(): Promise<string> {
  return generateAndSetCsrfToken();
}
