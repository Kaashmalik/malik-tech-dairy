import { handleCorsPreflight, getCorsHeaders } from '@/lib/cors';
import { getNoOrgFallbackPath } from '@/lib/auth/post-login-destination';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import {
  checkRateLimit,
  createRateLimitResponse,
  lenientRateLimit,
  strictRateLimit,
  uploadRateLimit,
} from '@/lib/ratelimit';
import type { NextRequest } from 'next/server';

// Note: Using middleware.ts (not deprecated proxy) - Next.js 15+ supports this

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/features(.*)',
  '/pricing(.*)',
  '/about(.*)',
  '/contact(.*)',
  '/faq(.*)',
  '/guides(.*)',
  '/tools(.*)',
  '/ads.txt',
  '/privacy-policy(.*)',
  '/terms-of-service(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/login',
  '/signup',
  '/unsubscribe(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
  '/google(.*)',
  '/.well-known(.*)',
  '/api/seo(.*)',
  '/api/webhooks(.*)',
  '/api/system/health(.*)',
  '/api/cron(.*)',
  '/api/payments/callback(.*)',
  '/api/weather/sync(.*)',
  '/api/auth/redirect(.*)',
  '/api/unsubscribe(.*)',
  '/api/contact',
]);

// Authenticated routes that work WITHOUT an active farm (organization).
// Everything else that is authenticated requires one - tenant scope is the default,
// so a newly added page or API cannot accidentally skip the org check.
const isNoOrgRoute = createRouteMatcher([
  '/apply(.*)',
  '/onboarding(.*)',
  '/select-farm(.*)',
  '/admin(.*)', // Super admin routes
  '/super-admin(.*)', // Super admin routes
  '/payments(.*)', // Super admin payments
  '/api/farm-applications(.*)',
  '/api/user(.*)',
  '/api/upload(.*)',
  '/api/admin(.*)',
]);

const IDENTITY_HEADERS = ['x-tenant-id', 'x-tenant-slug', 'x-user-id'];

// Machine-to-machine endpoints authenticate themselves and are not user-rate-limited
const isRateLimitExempt = createRouteMatcher([
  '/api/webhooks(.*)',
  '/api/cron(.*)',
  '/api/payments/callback(.*)',
  '/api/system/health(.*)',
]);

// Abuse-prone writes: applications, invites, contact, uploads
const STRICT_WRITE_PATHS = ['/api/farm-applications', '/api/staff', '/api/contact'];

/**
 * Central API rate limiting (Upstash; a no-op when Redis is not configured).
 * Keyed by user when signed in, otherwise by client IP.
 */
async function rateLimitApi(req: NextRequest, userId: string | null) {
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/api') || isRateLimitExempt(req)) return null;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
  const key = userId ? `user:${userId}` : `ip:${ip}`;
  const isWrite = req.method !== 'GET' && req.method !== 'HEAD';

  const limiter =
    path.startsWith('/api/upload') && isWrite
      ? uploadRateLimit
      : isWrite && STRICT_WRITE_PATHS.some(p => path === p)
        ? strictRateLimit
        : lenientRateLimit;

  const result = await checkRateLimit(limiter, key);
  return result.success ? null : createRateLimitResponse(result);
}

// Pages a user with an active farm should not see again
const ONBOARDING_PATHS = new Set(['/onboarding', '/apply', '/select-farm']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Google Search Console Instant HTML File Verification
  if (req.nextUrl.pathname.startsWith('/google') && req.nextUrl.pathname.endsWith('.html')) {
    const filename = req.nextUrl.pathname.replace('/', '');
    return new NextResponse(`google-site-verification: ${filename}`, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Handle API CORS preflight OPTIONS requests before auth checks
  if (req.nextUrl.pathname.startsWith('/api') && req.method === 'OPTIONS') {
    const preflight = handleCorsPreflight(req);
    if (preflight) {
      return new NextResponse(null, {
        status: preflight.status,
        headers: preflight.headers,
      });
    }
  }
  const { userId, orgId, orgSlug } = await auth();

  // Extract subdomain from hostname
  const hostname = req.headers.get('host') || '';
  const subdomain = hostname.split('.')[0];
  const isTenantSubdomain =
    hostname.includes('dairy.mtkcodex.site') &&
    !subdomain.includes('www') &&
    subdomain !== 'dairy' &&
    subdomain !== 'maliktechdairy';

  // Identity headers are trusted downstream (lib/api/middleware.ts), so never let a
  // client supply them - strip on every request and re-set only from the Clerk session.
  const requestHeaders = new Headers(req.headers);
  for (const header of IDENTITY_HEADERS) {
    requestHeaders.delete(header);
  }

  const limited = await rateLimitApi(req, userId);
  if (limited) return limited;

  // Allow public routes
  if (isPublicRoute(req)) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    if (req.nextUrl.pathname.startsWith('/api')) {
      const origin = req.headers.get('origin');
      const corsHeaders = getCorsHeaders(origin);
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
    }
    return response;
  }

  // Redirect to sign-in if not authenticated on protected routes
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(signInUrl);
  }

  const pathname = req.nextUrl.pathname;

  // Users who already have an active farm skip apply/onboarding
  if (orgId && ONBOARDING_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Everything else that is authenticated is tenant-scoped
  if (!isNoOrgRoute(req)) {
    // On a tenant subdomain the active org must be that tenant. (Previously this
    // redirected to the same URL, which looped forever.)
    if (isTenantSubdomain && orgSlug !== subdomain) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, error: 'Active farm does not match this farm address.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL(getNoOrgFallbackPath(), req.url));
    }

    // No active org → farm picker (not apply). Apply is only for brand-new users.
    if (!orgId) {
      if (pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, error: 'Select a farm organization before continuing.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL(getNoOrgFallbackPath(), req.url));
    }
  }

  // Add tenant context to headers for API routes
  if (orgId) {
    requestHeaders.set('x-tenant-id', orgId);
    requestHeaders.set('x-tenant-slug', orgSlug || subdomain || '');
  }
  requestHeaders.set('x-user-id', userId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (req.nextUrl.pathname.startsWith('/api')) {
    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);
    for (const [key, value] of Object.entries(corsHeaders)) {
      response.headers.set(key, value);
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|manifest\\.json|sw\\.js|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|json|xml|txt)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
