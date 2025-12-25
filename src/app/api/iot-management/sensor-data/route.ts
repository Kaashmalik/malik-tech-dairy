import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { sensorData, iotDevices, animals, sensorDataRelations } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const sensorDataQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  deviceId: z.string().optional(),
  animalId: z.string().optional(),
  dataType: z.string().optional(), // temperature, activity, milk_yield, weight
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  processed: z.coerce.boolean().optional(),
  alertTriggered: z.coerce.boolean().optional(),
  quality: z.enum(['good', 'fair', 'poor']).optional(),
});
const createSensorDataSchema = z.object({
  deviceId: z.string().min(1),
  animalId: z.string().optional(),
  dataType: z.string().min(1), // temperature, activity, milk_yield, weight
  value: z.number(),
  unit: z.string().optional(), // C, steps, liters, kg
  timestamp: z.string().datetime(),
  quality: z.enum(['good', 'fair', 'poor']).default('good'),
  metadata: z.record(z.any()).optional(),
});
// GET /api/iot-management/sensor-data - List sensor data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = sensorDataQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    // Since sensorData doesn't have tenantId, we'll verify device ownership separately or through join
    const whereConditions = [];
    if (query.deviceId) {
      whereConditions.push(eq(sensorData.deviceId, query.deviceId));
    }
    if (query.animalId) {
      whereConditions.push(eq(sensorData.animalId, query.animalId));
    }
    if (query.dataType) {
      whereConditions.push(eq(sensorData.dataType, query.dataType));
    }
    if (query.processed !== undefined) {
      whereConditions.push(eq(sensorData.processed, query.processed));
    }
    if (query.alertTriggered !== undefined) {
      whereConditions.push(eq(sensorData.alertTriggered, query.alertTriggered));
    }
    if (query.quality) {
      whereConditions.push(eq(sensorData.quality, query.quality));
    }
    if (query.startDate) {
      whereConditions.push(gte(sensorData.timestamp, new Date(query.startDate)));
    }
    if (query.endDate) {
      whereConditions.push(lte(sensorData.timestamp, new Date(query.endDate)));
    }
    // Get total count (needs join for tenant check)
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(sensorData)
      .leftJoin(iotDevices, eq(sensorData.deviceId, iotDevices.id))
      .where(and(eq(iotDevices.tenantId, tenantContext.tenantId), ...whereConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get sensor data with relations
    const sensorDataList = await db
      .select({
        // Sensor data fields
        id: sensorData.id,
        deviceId: sensorData.deviceId,
        animalId: sensorData.animalId,
        dataType: sensorData.dataType,
        value: sensorData.value,
        unit: sensorData.unit,
        timestamp: sensorData.timestamp,
        quality: sensorData.quality,
        processed: sensorData.processed,
        alertTriggered: sensorData.alertTriggered,
        metadata: sensorData.metadata,
        createdAt: sensorData.createdAt,
        // Related data
        device: {
          id: iotDevices.id,
          deviceName: iotDevices.deviceName,
          deviceType: iotDevices.deviceType,
          status: iotDevices.status,
        },
        animal: {
          id: animals.id,
          tag: animals.tag,
          name: animals.name,
          breed: animals.breed,
        },
      })
      .from(sensorData)
      .leftJoin(iotDevices, eq(sensorData.deviceId, iotDevices.id))
      .leftJoin(animals, eq(sensorData.animalId, animals.id))
      .where(and(eq(iotDevices.tenantId, tenantContext.tenantId), ...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(sensorData.timestamp));
    // Calculate analytics for sensor data
    const dataWithAnalytics = sensorDataList.map((data: any) => {
      // Determine if value is within normal range based on data type
      let isNormal = true;
      let alertLevel = 'normal';
      switch (data.dataType) {
        case 'temperature':
          // Normal body temperature for cows: 38.5-39.5°C
          if (data.value < 38.5 || data.value > 39.5) {
            isNormal = false;
            alertLevel = data.value < 36 || data.value > 42 ? 'critical' : 'warning';
          }
          break;
        case 'activity':
          // Normal activity: 1000-5000 steps per day
          if (data.value < 500 || data.value > 10000) {
            isNormal = false;
            alertLevel = data.value < 200 || data.value > 15000 ? 'critical' : 'warning';
          }
          break;
        case 'milk_yield':
          // Normal milk yield: 10-40 liters per milking
          if (data.value < 5 || data.value > 50) {
            isNormal = false;
            alertLevel = data.value < 2 || data.value > 60 ? 'critical' : 'warning';
          }
          break;
        case 'weight':
          // Weight depends on animal type and age
          if (data.value < 50 || data.value > 1000) {
            isNormal = false;
            alertLevel = data.value < 30 || data.value > 1200 ? 'critical' : 'warning';
          }
          break;
      }
      return {
        ...data,
        isNormal,
        alertLevel,
        age: Math.floor(
          (new Date().getTime() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60)
        ), // hours ago
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        sensorData: dataWithAnalytics,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalReadings: sensorDataList.length,
          normalReadings: dataWithAnalytics.filter(d => d.isNormal).length,
          warningReadings: dataWithAnalytics.filter(d => d.alertLevel === 'warning').length,
          criticalReadings: dataWithAnalytics.filter(d => d.alertLevel === 'critical').length,
          processedReadings: sensorDataList.filter(d => d.processed).length,
          alertsTriggered: sensorDataList.filter(d => d.alertTriggered).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/iot-management/sensor-data - Create new sensor data
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createSensorDataSchema.parse(body);
    const db = getDrizzle();
    const sensorDataId = `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Verify device exists
    const device = await db
      .select()
      .from(iotDevices)
      .where(eq(iotDevices.deviceId, validatedData.deviceId))
      .limit(1);
    if (!device.length) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }
    // Verify animal exists if provided
    if (validatedData.animalId) {
      const animal = await db
        .select()
        .from(animals)
        .where(eq(animals.id, validatedData.animalId))
        .limit(1);
      if (!animal.length) {
        return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
      }
    }
    // Determine if alert should be triggered
    let alertTriggered = false;
    switch (validatedData.dataType) {
      case 'temperature':
        if (validatedData.value < 36 || validatedData.value > 42) {
          alertTriggered = true;
        }
        break;
      case 'activity':
        if (validatedData.value < 200 || validatedData.value > 15000) {
          alertTriggered = true;
        }
        break;
      case 'milk_yield':
        if (validatedData.value < 2 || validatedData.value > 60) {
          alertTriggered = true;
        }
        break;
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const newSensorData = await db
      .insert(sensorData)
      .values({
        id: sensorDataId,
        ...validatedData,
        timestamp: new Date(validatedData.timestamp),
        alertTriggered,
        createdAt: new Date(),
      })
      .returning();
    // Update device last sync
    await db
      .update(iotDevices)
      .set({
        lastSync: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(iotDevices.deviceId, validatedData.deviceId));
    return NextResponse.json({
      success: true,
      data: newSensorData[0],
      message: 'Sensor data recorded successfully',
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