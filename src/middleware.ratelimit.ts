// Rate Limiting Middleware - Enterprise Grade
import { NextRequest, NextResponse } from 'next/server';
import { ipRateLimit, tenantRateLimit, authRateLimit } from '@/lib/ratelimit';
import { auth } from '@clerk/nextjs/server';
export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const pathname = request.nextUrl.pathname;
  // Apply different rate limits based on path
  if (pathname.startsWith('/api/auth') || pathname.startsWith('/api/sign')) {
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  } else if (pathname.startsWith('/api/')) {
    // IP-based rate limiting: 100 req/min per IP
    const ipLimit = await ipRateLimit.limit(ip);
    if (!ipLimit.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests from this IP address. Limit: 100 requests per minute.',
          retryAfter: ipLimit.reset,
        },
        { status: 429 }
      );
    }
    // Tenant-based rate limiting: 1000 req/min per tenant
    try {
      const { orgId } = await auth();
      if (orgId) {
        const tenantLimit = await tenantRateLimit.limit(orgId);
        if (!tenantLimit.success) {
          return NextResponse.json(
            {
              error: 'Rate limit exceeded',
              message: 'Too many requests for this organization. Limit: 1000 requests per minute.',
              retryAfter: tenantLimit.reset,
            },
            { status: 429 }
          );
        }
      }
    } catch (error) {
      // If auth fails, continue with IP-based limiting only
    }
  }
  return null; // Continue to next middleware
}