/**
 * System Health Check Endpoint
 * 
 * Enterprise-grade health monitoring for:
 * - Database connectivity
 * - Redis cache status
 * - External service availability
 * - Application metrics
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { checkCacheHealth } from '@/lib/cache/redis-cache';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: ServiceCheck;
    cache: ServiceCheck;
    clerk: ServiceCheck;
  };
  metrics?: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
}

interface ServiceCheck {
  status: 'up' | 'down' | 'degraded';
  latencyMs?: number;
  error?: string;
}

const startTime = Date.now();

async function checkDatabase(): Promise<ServiceCheck> {
  try {
    const start = performance.now();
    const supabase = getSupabaseClient();
    
    // Simple query to verify connection
    const { error } = await supabase
      .from('tenants')
      .select('id')
      .limit(1);
    
    const latencyMs = Math.round(performance.now() - start);
    
    if (error) {
      return { status: 'down', latencyMs, error: error.message };
    }
    
    // Consider degraded if latency > 500ms
    if (latencyMs > 500) {
      return { status: 'degraded', latencyMs };
    }
    
    return { status: 'up', latencyMs };
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

async function checkClerk(): Promise<ServiceCheck> {
  try {
    const start = performance.now();
    
    // Check if Clerk env vars are configured
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      return { status: 'down', error: 'Clerk not configured' };
    }
    
    const latencyMs = Math.round(performance.now() - start);
    return { status: 'up', latencyMs };
  } catch (error) {
    return { 
      status: 'down', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function GET() {
  const timestamp = new Date().toISOString();
  const uptime = Math.round((Date.now() - startTime) / 1000);
  
  // Run all health checks in parallel
  const [dbCheck, cacheCheck, clerkCheck] = await Promise.all([
    checkDatabase(),
    checkCacheHealth().then(result => ({
      status: result.connected ? 'up' : 'down',
      latencyMs: result.latencyMs,
      error: result.error,
    } as ServiceCheck)),
    checkClerk(),
  ]);

  // Determine overall status
  const checks = {
    database: dbCheck,
    cache: cacheCheck,
    clerk: clerkCheck,
  };

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  
  // Database is critical
  if (dbCheck.status === 'down') {
    overallStatus = 'unhealthy';
  } else if (dbCheck.status === 'degraded') {
    overallStatus = 'degraded';
  }
  
  // Cache being down is degraded (not critical)
  if (cacheCheck.status === 'down' && overallStatus === 'healthy') {
    overallStatus = 'degraded';
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks,
    metrics: {
      memoryUsage: process.memoryUsage(),
    },
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(health, { 
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

// HEAD request for simple health checks (load balancers)
export async function HEAD() {
  try {
    const supabase = getSupabaseClient();
    await supabase.from('tenants').select('id').limit(1);
    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
