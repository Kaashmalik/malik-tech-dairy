import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { staffAttendance, platformUsers, staffAttendanceRelations } from '@/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const attendanceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  userId: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'on_leave']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  month: z.string().optional(), // Format: "2024-12"
});
const createAttendanceSchema = z.object({
  userId: z.string().min(1),
  date: z.string().datetime(),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'on_leave']).default('present'),
  notes: z.string().optional(),
});
const updateAttendanceSchema = z.object({
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['present', 'absent', 'late', 'on_leave']).optional(),
  notes: z.string().optional(),
});
// GET /api/staff-management/attendance - List attendance records
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = attendanceQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [eq(staffAttendance.tenantId, tenantContext.tenantId)];
    if (query.userId) {
      whereConditions.push(eq(staffAttendance.userId, query.userId));
    }
    if (query.status) {
      whereConditions.push(eq(staffAttendance.status, query.status));
    }
    if (query.startDate) {
      whereConditions.push(gte(staffAttendance.date, new Date(query.startDate)));
    }
    if (query.endDate) {
      whereConditions.push(lte(staffAttendance.date, new Date(query.endDate)));
    }
    if (query.month) {
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      whereConditions.push(
        and(gte(staffAttendance.date, startDate), lte(staffAttendance.date, endDate))
      );
    }
    if (query.overdue === true) {
      whereConditions.push(
        and(lte(staffAttendance.checkOut, new Date()), eq(staffAttendance.status, 'present'))
      );
    }
    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(staffAttendance)
      .where(and(...whereConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get attendance records with user relations
    const attendanceList = await db
      .select({
        // Attendance fields
        id: staffAttendance.id,
        tenantId: staffAttendance.tenantId,
        userId: staffAttendance.userId,
        date: staffAttendance.date,
        checkIn: staffAttendance.checkIn,
        checkOut: staffAttendance.checkOut,
        locationLat: staffAttendance.locationLat,
        locationLng: staffAttendance.locationLng,
        status: staffAttendance.status,
        workHours: staffAttendance.workHours,
        overtimeHours: staffAttendance.overtimeHours,
        notes: staffAttendance.notes,
        approvedBy: staffAttendance.approvedBy,
        createdAt: staffAttendance.createdAt,
        updatedAt: staffAttendance.updatedAt,
        // User fields
        user: {
          id: platformUsers.id,
          name: platformUsers.name,
          email: platformUsers.email,
          phone: platformUsers.phone,
        },
      })
      .from(staffAttendance)
      .leftJoin(platformUsers, eq(staffAttendance.userId, platformUsers.id))
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(staffAttendance.date));
    // Calculate work hours and overtime for each record
    const attendanceWithCalculatedHours = attendanceList.map(record => {
      let workHours = 0;
      let overtimeHours = 0;
      if (record.checkIn && record.checkOut) {
        const checkInTime = new Date(record.checkIn);
        const checkOutTime = new Date(record.checkOut);
        const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60);
        workHours = Math.round(totalMinutes);
        // Calculate overtime (hours beyond 8 regular hours)
        const regularHours = 8 * 60; // 8 hours in minutes
        if (workHours > regularHours) {
          overtimeHours = workHours - regularHours;
        }
      }
      return {
        ...record,
        workHours,
        overtimeHours,
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        attendance: attendanceWithCalculatedHours,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalRecords: attendanceList.length,
          presentDays: attendanceList.filter(r => r.status === 'present').length,
          absentDays: attendanceList.filter(r => r.status === 'absent').length,
          lateDays: attendanceList.filter(r => r.status === 'late').length,
          totalWorkHours: attendanceWithCalculatedHours.reduce((sum, r) => sum + r.workHours, 0),
          totalOvertimeHours: attendanceWithCalculatedHours.reduce(
            (sum, r) => sum + r.overtimeHours,
            0
          ),
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/staff-management/attendance - Create attendance record
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createAttendanceSchema.parse(body);
    const db = getDrizzle();
    const attendanceId = `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Get tenant context
    const tenantContext = await getTenantContext();
    // Check if attendance record already exists for this user and date
    const existingRecord = await db
      .select()
      .from(staffAttendance)
      .where(
        and(
          eq(staffAttendance.userId, validatedData.userId),
          eq(staffAttendance.date, new Date(validatedData.date))
        )
      )
      .limit(1);
    if (existingRecord.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Attendance record already exists for this date' },
        { status: 409 }
      );
    }
    const newAttendance = await db
      .insert(staffAttendance)
      .values({
        id: attendanceId,
        tenantId: tenantContext.tenantId,
        ...validatedData,
        date: new Date(validatedData.date),
        checkIn: validatedData.checkIn ? new Date(validatedData.checkIn) : null,
        checkOut: validatedData.checkOut ? new Date(validatedData.checkOut) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({
      success: true,
      data: newAttendance[0],
      message: 'Attendance record created successfully',
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
// PUT /api/staff-management/attendance?id=xxx - Update attendance record
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Attendance ID required' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const validatedData = updateAttendanceSchema.parse(body);
    const db = getDrizzle();
    // Check if record exists and validate tenant ownership
    const existingRecord = await db
      .select()
      .from(staffAttendance)
      .where(eq(staffAttendance.id, id))
      .limit(1);
    if (!existingRecord.length) {
      return NextResponse.json(
        { success: false, error: 'Attendance record not found' },
        { status: 404 }
      );
    }
    // Get tenant context for ownership validation
    const tenantContext = await getTenantContext();
    // Validate tenant ownership to prevent cross-tenant updates
    if (existingRecord[0].tenantId !== tenantContext.tenantId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }
    const updateData = {
      ...validatedData,
      checkIn: validatedData.checkIn ? new Date(validatedData.checkIn) : undefined,
      checkOut: validatedData.checkOut ? new Date(validatedData.checkOut) : undefined,
      updatedAt: new Date(),
    };
    const updatedAttendance = await db
      .update(staffAttendance)
      .set(updateData)
      .where(eq(staffAttendance.id, id))
      .returning();
    return NextResponse.json({
      success: true,
      data: updatedAttendance[0],
      message: 'Attendance record updated successfully',
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