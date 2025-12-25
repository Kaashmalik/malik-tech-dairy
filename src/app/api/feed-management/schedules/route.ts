import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { feedingSchedules, animals, feedingSchedulesRelations } from '@/db/schema';
import { eq, and, or, isNull, ilike, desc, gte, lte, sql, SQL } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const feedingScheduleQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  animalId: z.string().optional(),
  feedType: z.string().optional(),
  timeOfDay: z.string().optional(),
  frequency: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
  date: z.string().datetime().optional(), // Filter schedules for specific date
  month: z.string().optional(), // Format: "2024-12"
});
const createFeedingScheduleSchema = z.object({
  animalId: z.string().min(1),
  feedType: z.string().min(2).max(255),
  feedName: z.string().min(2).max(255),
  quantity: z.number().min(0),
  unit: z.enum(['kg', 'liters', 'grams', 'tons']).default('kg'),
  timeOfDay: z.string().min(1), // "06:00", "14:00", "18:00"
  frequency: z.string().min(1).default('daily'), // daily, twice_daily, weekly
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});
// GET /api/feed-management/schedules - List feeding schedules
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = feedingScheduleQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [
      eq(feedingSchedules.tenantId, tenantContext.tenantId),
      eq(feedingSchedules.isActive, query.isActive),
    ];
    if (query.animalId) {
      whereConditions.push(eq(feedingSchedules.animalId, query.animalId));
    }
    if (query.feedType) {
      whereConditions.push(ilike(feedingSchedules.feedType, `%${query.feedType}%`));
    }
    if (query.timeOfDay) {
      whereConditions.push(eq(feedingSchedules.timeOfDay, query.timeOfDay));
    }
    if (query.frequency) {
      whereConditions.push(eq(feedingSchedules.frequency, query.frequency));
    }
    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereConditions.push(
        gte(feedingSchedules.startDate, startDate),
        lte(feedingSchedules.startDate, endDate)
      );
    }
    if (query.date) {
      // Filter schedules that are active on the specified date
      const targetDate = new Date(query.date);
      whereConditions.push(
        lte(feedingSchedules.startDate, targetDate),
        sql`${feedingSchedules.endDate} IS NULL OR ${feedingSchedules.endDate} >= ${targetDate}`
      );
    }
    // Get total count
    const filteredConditions = whereConditions.filter((c): c is SQL<unknown> => c !== undefined);
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedingSchedules)
      .where(and(...filteredConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get feeding schedules with relations
    const schedulesList = await db
      .select({
        // Feeding schedule fields
        id: feedingSchedules.id,
        tenantId: feedingSchedules.tenantId,
        animalId: feedingSchedules.animalId,
        feedType: feedingSchedules.feedType,
        feedName: feedingSchedules.feedName,
        quantity: feedingSchedules.quantity,
        unit: feedingSchedules.unit,
        timeOfDay: feedingSchedules.timeOfDay,
        frequency: feedingSchedules.frequency,
        startDate: feedingSchedules.startDate,
        endDate: feedingSchedules.endDate,
        isActive: feedingSchedules.isActive,
        notes: feedingSchedules.notes,
        createdAt: feedingSchedules.createdAt,
        updatedAt: feedingSchedules.updatedAt,
        // Related animal data
        animal: {
          id: animals.id,
          tag: animals.tag,
          name: animals.name,
          breed: animals.breed,
          dateOfBirth: animals.dateOfBirth,
          weight: animals.weight,
        },
      })
      .from(feedingSchedules)
      .leftJoin(animals, eq(feedingSchedules.animalId, animals.id))
      .where(and(...filteredConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(feedingSchedules.timeOfDay, feedingSchedules.animalId);
    // Calculate next feeding times for each schedule
    const schedulesWithNextFeeding = schedulesList.map(schedule => {
      const now = new Date();
      const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
      let nextFeeding = new Date();
      nextFeeding.setHours(hours, minutes, 0, 0);
      // If today's feeding time has passed, schedule for tomorrow
      if (nextFeeding <= now) {
        nextFeeding.setDate(nextFeeding.getDate() + 1);
      }
      // Check if schedule is still active
      const isActive = schedule.endDate ? nextFeeding <= new Date(schedule.endDate) : true;
      return {
        ...schedule,
        nextFeedingTime: nextFeeding.toISOString(),
        isNextFeedingActive: isActive,
        minutesUntilNextFeeding: Math.floor((nextFeeding.getTime() - now.getTime()) / (1000 * 60)),
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        schedules: schedulesWithNextFeeding,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalSchedules: schedulesList.length,
          activeSchedules: schedulesList.filter(s => s.isActive).length,
          upcomingFeedings: schedulesWithNextFeeding.filter(
            s => s.isNextFeedingActive && s.minutesUntilNextFeeding <= 60
          ).length, // Next hour
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/feed-management/schedules - Create new feeding schedule
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createFeedingScheduleSchema.parse(body);
    const db = getDrizzle();
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Verify animal exists and user has access
    const animal = await db
      .select()
      .from(animals)
      .where(eq(animals.id, validatedData.animalId))
      .limit(1);
    if (!animal.length) {
      return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
    }
    // Get tenant context
    const tenantContext = await getTenantContext();
    const newSchedule = await db
      .insert(feedingSchedules)
      .values({
        id: scheduleId,
        tenantId: tenantContext.tenantId,
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        createdBy: tenantContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({
      success: true,
      data: newSchedule[0],
      message: 'Feeding schedule created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}