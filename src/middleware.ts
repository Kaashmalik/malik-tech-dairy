import { handleCorsPreflight, getCorsHeaders } from '@/lib/cors';
import { getNoOrgFallbackPath } from '@/lib/auth/post-login-destination';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
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
  '/privacy-policy(.*)',
  '/terms-of-service(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
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
  '/api/migration/schedule(.*)',
  '/api/payments/callback(.*)',
  '/api/weather/sync(.*)',
  '/api/auth/redirect(.*)',
]);

// Routes that require authentication but NOT organization
const isAuthOnlyRoute = createRouteMatcher([
  '/apply(.*)',
  '/onboarding(.*)',
  '/select-farm(.*)',
  '/api/farm-applications(.*)',
  '/api/user/farms(.*)',
  '/api/user/join-org(.*)',
  '/api/upload(.*)',
  '/admin(.*)', // Super admin routes
  '/super-admin(.*)', // Super admin routes
  '/api/admin(.*)',
]);

// Define routes that require organization (tenant) context
const isOrganizationRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/api/tenants(.*)',
  '/api/animals(.*)',
  '/api/milk(.*)',
  '/api/health(.*)',
  '/api/breeding(.*)',
  '/api/expenses(.*)',
  '/api/reports(.*)',
  '/api/weather(.*)',
]);

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
  const isMainDomain =
    hostname.includes('dairy.mtkcodex.site') &&
    !subdomain.includes('www') &&
    subdomain !== 'dairy' &&
    subdomain !== 'maliktechdairy';

  // Allow public routes
  if (isPublicRoute(req)) {
    const response = NextResponse.next();
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
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    if (req.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(signInUrl);
  }

  // Handle auth-only routes (apply, onboarding, select-farm, etc.)
  if (isAuthOnlyRoute(req) && userId) {
    // Users who already have an active farm skip apply/onboarding
    if (
      orgId &&
      (req.nextUrl.pathname === '/onboarding' ||
        req.nextUrl.pathname === '/apply' ||
        req.nextUrl.pathname === '/select-farm')
    ) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Handle organization (tenant) routes
  if (isOrganizationRoute(req) && userId) {
    // If subdomain exists and user is authenticated, ensure they belong to that tenant
    if (isMainDomain && subdomain) {
      // User should be in the organization matching the subdomain
      if (orgSlug !== subdomain) {
        // Redirect to correct tenant or show error
        const redirectUrl = new URL(
          `https://${subdomain}.dairy.mtkcodex.site${req.nextUrl.pathname}`,
          req.url
        );
        return NextResponse.redirect(redirectUrl);
      }
    }

    // No active org → farm picker (not apply). Apply is only for brand-new users.
    if (!orgId) {
      if (req.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.json(
          { success: false, error: 'Select a farm organization before continuing.' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL(getNoOrgFallbackPath(), req.url));
    }
  }

  // Add tenant context to headers for API routes
  const requestHeaders = new Headers(req.headers);
  if (orgId) {
    requestHeaders.set('x-tenant-id', orgId);
    requestHeaders.set('x-tenant-slug', orgSlug || subdomain || '');
  }
  if (userId) {
    requestHeaders.set('x-user-id', userId);
  }

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
