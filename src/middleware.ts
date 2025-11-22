import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimitMiddleware } from "./middleware.ratelimit";

// Note: Using middleware.ts (not deprecated proxy) - Next.js 15+ supports this

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/",
  "/pricing",
  "/about",
]);

// Define routes that require organization (tenant) context
const isOrganizationRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/onboarding(.*)",
  "/api/tenants(.*)",
  "/api/animals(.*)",
  "/api/milk(.*)",
  "/api/health(.*)",
  "/api/breeding(.*)",
  "/api/expenses(.*)",
  "/api/reports(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Apply rate limiting first
  const rateLimitResponse = await rateLimitMiddleware(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const { userId, orgId, orgSlug } = await auth();

  // Extract subdomain from hostname
  const hostname = req.headers.get("host") || "";
  const subdomain = hostname.split(".")[0];
  const isMainDomain = hostname.includes("maliktechdairy.com") && !subdomain.includes("www") && subdomain !== "maliktechdairy";

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Redirect to sign-in if not authenticated on protected routes
  if (!userId && !isPublicRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Handle organization (tenant) routes
  if (isOrganizationRoute(req) && userId) {
    // If subdomain exists and user is authenticated, ensure they belong to that tenant
    if (isMainDomain && subdomain) {
      // User should be in the organization matching the subdomain
      if (orgSlug !== subdomain) {
        // Redirect to correct tenant or show error
        const redirectUrl = new URL(`https://${subdomain}.maliktechdairy.com${req.nextUrl.pathname}`, req.url);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // If no orgId and user is on organization route, redirect to onboarding
    if (!orgId && req.nextUrl.pathname.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Add tenant context to headers for API routes
  const requestHeaders = new Headers(req.headers);
  if (orgId) {
    requestHeaders.set("x-tenant-id", orgId);
    requestHeaders.set("x-tenant-slug", orgSlug || subdomain || "");
  }
  if (userId) {
    requestHeaders.set("x-user-id", userId);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

