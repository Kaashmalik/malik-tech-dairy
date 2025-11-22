// Rate Limiting Middleware
import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit, authRateLimit } from "@/lib/ratelimit";

export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const pathname = request.nextUrl.pathname;

  // Apply different rate limits based on path
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/api/sign")) {
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  } else if (pathname.startsWith("/api/")) {
    const { success } = await apiRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return null; // Continue to next middleware
}

