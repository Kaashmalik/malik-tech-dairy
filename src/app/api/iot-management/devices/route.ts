import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { iotDevices, animals, iotDevicesRelations } from '@/db/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { getTenantContext } from '@/lib/tenant/context';
// Validation schemas
const deviceQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  deviceType: z
    .enum([
      'milk_meter',
      'activity_monitor',
      'temperature_sensor',
      'automatic_feeder',
      'water_meter',
      'gps_tracker',
    ])
    .optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'error', 'offline']).optional(),
  animalId: z.string().optional(),
  manufacturer: z.string().optional(),
  lowBattery: z.coerce.boolean().optional(),
  search: z.string().optional(),
  isActive: z.coerce.boolean().default(true),
});
const createDeviceSchema = z.object({
  deviceType: z.enum([
    'milk_meter',
    'activity_monitor',
    'temperature_sensor',
    'automatic_feeder',
    'water_meter',
    'gps_tracker',
  ]),
  deviceName: z.string().min(2).max(255),
  deviceId: z.string().min(2).max(255),
  animalId: z.string().optional(),
  manufacturer: z.string().max(255).optional(),
  model: z.string().max(100).optional(),
  firmwareVersion: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  installationDate: z.string().datetime(),
  warrantyExpiry: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});
const updateDeviceSchema = z.object({
  deviceName: z.string().min(2).max(255).optional(),
  animalId: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'error', 'offline']).optional(),
  firmwareVersion: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  metadata: z.record(z.any()).optional(),
});
// GET /api/iot-management/devices - List IoT devices
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const { searchParams } = new URL(request.url);
    const query = deviceQuerySchema.parse(Object.fromEntries(searchParams));
    const db = getDrizzle();
    const offset = (query.page - 1) * query.limit;
    // Build where conditions - ALWAYS include tenant filtering for tenant-specific tables
    const whereConditions = [
      eq(iotDevices.tenantId, tenantContext.tenantId),
      eq(iotDevices.isActive, query.isActive),
    ];
    if (query.deviceType) {
      whereConditions.push(eq(iotDevices.deviceType, query.deviceType));
    }
    if (query.status) {
      whereConditions.push(eq(iotDevices.status, query.status));
    }
    if (query.animalId) {
      whereConditions.push(eq(iotDevices.animalId, query.animalId));
    }
    if (query.manufacturer) {
      whereConditions.push(ilike(iotDevices.manufacturer, `%${query.manufacturer}%`));
    }
    if (query.search) {
      whereConditions.push(ilike(iotDevices.deviceName, `%${query.search}%`));
    }
    if (query.lowBattery === true) {
      whereConditions.push(sql`${iotDevices.batteryLevel} < 20`);
    }
    // Get total count
    const totalCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(iotDevices)
      .where(and(...whereConditions));
    const total = totalCountResult[0]?.count || 0;
    // Get devices with relations
    const devicesList = await db
      .select({
        // Device fields
        id: iotDevices.id,
        tenantId: iotDevices.tenantId,
        deviceType: iotDevices.deviceType,
        deviceName: iotDevices.deviceName,
        deviceId: iotDevices.deviceId,
        animalId: iotDevices.animalId,
        manufacturer: iotDevices.manufacturer,
        model: iotDevices.model,
        firmwareVersion: iotDevices.firmwareVersion,
        status: iotDevices.status,
        lastSync: iotDevices.lastSync,
        batteryLevel: iotDevices.batteryLevel,
        signalStrength: iotDevices.signalStrength,
        location: iotDevices.location,
        installationDate: iotDevices.installationDate,
        warrantyExpiry: iotDevices.warrantyExpiry,
        metadata: iotDevices.metadata,
        isActive: iotDevices.isActive,
        createdAt: iotDevices.createdAt,
        updatedAt: iotDevices.updatedAt,
        // Related animal data
        animal: {
          id: animals.id,
          tagNumber: animals.tagNumber,
          name: animals.name,
          breed: animals.breed,
        },
      })
      .from(iotDevices)
      .leftJoin(animals, eq(iotDevices.animalId, animals.id))
      .where(and(...whereConditions))
      .limit(query.limit)
      .offset(offset)
      .orderBy(desc(iotDevices.lastSync), iotDevices.deviceName);
    // Calculate device health metrics
    const devicesWithHealth = devicesList.map(device => {
      const now = new Date();
      const lastSync = device.lastSync ? new Date(device.lastSync) : null;
      const hoursSinceLastSync = lastSync
        ? Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60))
        : null;
      let healthStatus = 'healthy';
      if (device.status === 'error' || device.status === 'offline') {
        healthStatus = 'critical';
      } else if (device.batteryLevel && device.batteryLevel < 20) {
        healthStatus = 'warning';
      } else if (hoursSinceLastSync && hoursSinceLastSync > 24) {
        healthStatus = 'warning';
      } else if (device.status === 'maintenance') {
        healthStatus = 'maintenance';
      }
      return {
        ...device,
        healthStatus,
        hoursSinceLastSync,
        isOnline: hoursSinceLastSync !== null && hoursSinceLastSync <= 1,
        needsAttention: healthStatus === 'warning' || healthStatus === 'critical',
      };
    });
    return NextResponse.json({
      success: true,
      data: {
        devices: devicesWithHealth,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        summary: {
          totalDevices: devicesList.length,
          activeDevices: devicesList.filter(d => d.status === 'active').length,
          offlineDevices: devicesList.filter(d => d.status === 'offline').length,
          errorDevices: devicesList.filter(d => d.status === 'error').length,
          lowBatteryDevices: devicesList.filter(d => d.batteryLevel && d.batteryLevel < 20).length,
          needsAttentionDevices: devicesWithHealth.filter(d => d.needsAttention).length,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
// POST /api/iot-management/devices - Create new IoT device
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const validatedData = createDeviceSchema.parse(body);
    const db = getDrizzle();
    const deviceId = `iot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // Check if device ID already exists
    const existingDevice = await db
      .select()
      .from(iotDevices)
      .where(eq(iotDevices.deviceId, validatedData.deviceId))
      .limit(1);
    if (existingDevice.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Device ID already exists' },
        { status: 409 }
      );
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
    // Get tenant context for proper isolation
    const tenantContext = await getTenantContext();
    const newDevice = await db
      .insert(iotDevices)
      .values({
        id: deviceId,
        tenantId: tenantContext.tenantId,
        status: 'active',
        ...validatedData,
        installationDate: new Date(validatedData.installationDate),
        warrantyExpiry: validatedData.warrantyExpiry
          ? new Date(validatedData.warrantyExpiry)
          : null,
        createdBy: tenantContext.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return NextResponse.json({
      success: true,
      data: newDevice[0],
      message: 'IoT device registered successfully',
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
// PUT /api/iot-management/devices?id=xxx - Update IoT device
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Device ID required' }, { status: 400 });
    }
    const body = await request.json();
    const validatedData = updateDeviceSchema.parse(body);
    const db = getDrizzle();
    // Check if device exists and validate tenant ownership
    const existingDevice = await db.select().from(iotDevices).where(eq(iotDevices.id, id)).limit(1);
    if (!existingDevice.length) {
      return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
    }
    // Get tenant context for ownership validation
    const tenantContext = await getTenantContext();
    // Validate tenant ownership to prevent cross-tenant updates
    if (existingDevice[0].tenantId !== tenantContext.tenantId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
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
    const updatedDevice = await db
      .update(iotDevices)
      .values({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(iotDevices.id, id))
      .returning();
    return NextResponse.json({
      success: true,
      data: updatedDevice[0],
      message: 'IoT device updated successfully',
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