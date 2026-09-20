import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { isPlatformSuperAdmin } from '@/lib/admin/require-super-admin';

export const dynamic = 'force-dynamic';

function periodDays(period: string): number {
  if (period === '7d') return 7;
  if (period === '90d') return 90;
  if (period === '1y') return 365;
  return 30;
}

function startOfDayIso(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function bucketKey(iso: string, days: number): string {
  const d = new Date(iso);
  if (days >= 365) {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return d.toISOString().slice(0, 10);
}

function percentChange(current: number, previous: number): number {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isPlatformSuperAdmin(userId))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Super Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const days = periodDays(period);

    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setUTCDate(currentStart.getUTCDate() - days);
    const previousStart = new Date(currentStart);
    previousStart.setUTCDate(previousStart.getUTCDate() - days);

    const currentFrom = startOfDayIso(currentStart);
    const previousFrom = startOfDayIso(previousStart);
    const nowIso = now.toISOString();

    const supabase = getSupabaseClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    const [tenantsRes, usersRes, paymentsRes, appsRes, animalsRes] = await Promise.all([
      sb.from('tenants').select('id, farm_name, created_at').is('deleted_at', null),
      sb.from('platform_users').select('id, created_at'),
      sb.from('payments').select('id, tenant_id, amount, status, created_at, plan'),
      sb.from('farm_applications').select('id, status, created_at'),
      sb.from('animals').select('tenant_id').neq('status', 'deleted'),
    ]);

    const tenants = tenantsRes.data || [];
    const users = usersRes.data || [];
    const payments = paymentsRes.data || [];
    const apps = appsRes.data || [];
    const animals = animalsRes.data || [];

    const inRange = (iso: string, from: string, to: string) => iso >= from && iso < to;

    const newFarms = tenants.filter((t: { created_at: string }) =>
      inRange(t.created_at, currentFrom, nowIso)
    ).length;
    const prevFarms = tenants.filter((t: { created_at: string }) =>
      inRange(t.created_at, previousFrom, currentFrom)
    ).length;

    const newUsers = users.filter((u: { created_at: string }) =>
      inRange(u.created_at, currentFrom, nowIso)
    ).length;
    const prevUsers = users.filter((u: { created_at: string }) =>
      inRange(u.created_at, previousFrom, currentFrom)
    ).length;

    const completed = (p: { status: string }) => p.status === 'completed';
    const currentRevenue = payments
      .filter(
        (p: { status: string; created_at: string }) =>
          completed(p) && inRange(p.created_at, currentFrom, nowIso)
      )
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount || 0), 0);
    const prevRevenue = payments
      .filter(
        (p: { status: string; created_at: string }) =>
          completed(p) && inRange(p.created_at, previousFrom, currentFrom)
      )
      .reduce((sum: number, p: { amount: number }) => sum + Number(p.amount || 0), 0);

    const currentApps = apps.filter((a: { created_at: string }) =>
      inRange(a.created_at, currentFrom, nowIso)
    );
    const prevApps = apps.filter((a: { created_at: string }) =>
      inRange(a.created_at, previousFrom, currentFrom)
    );
    const conversion =
      currentApps.length > 0
        ? Math.round(
            (currentApps.filter((a: { status: string }) => a.status === 'approved').length /
              currentApps.length) *
              100
          )
        : 0;
    const prevConversion =
      prevApps.length > 0
        ? Math.round(
            (prevApps.filter((a: { status: string }) => a.status === 'approved').length /
              prevApps.length) *
              100
          )
        : 0;

    const revenueTrendMap = new Map<string, number>();
    const userTrendMap = new Map<string, number>();

    for (const p of payments) {
      if (!completed(p) || p.created_at < currentFrom) continue;
      const key = bucketKey(p.created_at, days);
      revenueTrendMap.set(key, (revenueTrendMap.get(key) || 0) + Number(p.amount || 0));
    }
    for (const u of users) {
      if (u.created_at < currentFrom) continue;
      const key = bucketKey(u.created_at, days);
      userTrendMap.set(key, (userTrendMap.get(key) || 0) + 1);
    }

    const animalCountByTenant = new Map<string, number>();
    for (const a of animals) {
      animalCountByTenant.set(a.tenant_id, (animalCountByTenant.get(a.tenant_id) || 0) + 1);
    }
    const revenueByTenant = new Map<string, number>();
    for (const p of payments) {
      if (!completed(p)) continue;
      revenueByTenant.set(
        p.tenant_id,
        (revenueByTenant.get(p.tenant_id) || 0) + Number(p.amount || 0)
      );
    }

    const topFarms = tenants
      .map((t: { id: string; farm_name: string }) => ({
        id: t.id,
        farmName: t.farm_name,
        revenue: revenueByTenant.get(t.id) || 0,
        animalCount: animalCountByTenant.get(t.id) || 0,
      }))
      .sort(
        (
          a: { revenue: number; animalCount: number },
          b: { revenue: number; animalCount: number }
        ) => {
          if (b.revenue !== a.revenue) return b.revenue - a.revenue;
          return b.animalCount - a.animalCount;
        }
      )
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      data: {
        period,
        stats: {
          totalRevenue: currentRevenue,
          totalRevenueChange: percentChange(currentRevenue, prevRevenue),
          newFarms,
          newFarmsChange: percentChange(newFarms, prevFarms),
          newUsers,
          newUsersChange: percentChange(newUsers, prevUsers),
          conversionRate: conversion,
          conversionRateChange: conversion - prevConversion,
        },
        revenueTrend: Array.from(revenueTrendMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, amount]) => ({ date, amount })),
        userTrend: Array.from(userTrendMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, count]) => ({ date, count })),
        topFarms,
        totals: {
          farms: tenants.length,
          users: users.length,
          applications: apps.length,
        },
      },
    });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load analytics' },
      { status: 500 }
    );
  }
}
