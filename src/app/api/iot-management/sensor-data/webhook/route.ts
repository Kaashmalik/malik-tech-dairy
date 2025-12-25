import { NextRequest, NextResponse } from 'next/server';
import { getDrizzle } from '@/lib/supabase';
import { sensorData, iotDevices } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Webhook schema for external device data
const webhookSensorDataSchema = z.object({
    deviceId: z.string().min(1),
    data: z.array(
        z.object({
            dataType: z.string(),
            value: z.number(),
            unit: z.string().optional(),
            timestamp: z.string().datetime(),
            quality: z.enum(['good', 'fair', 'poor']).default('good'),
            metadata: z.record(z.any()).optional(),
        })
    ),
    deviceInfo: z
        .object({
            batteryLevel: z.number().optional(),
            signalStrength: z.number().optional(),
            firmwareVersion: z.string().optional(),
        })
        .optional(),
});

// POST /api/iot-management/sensor-data/webhook - Webhook for external device data
export async function POST(request: NextRequest) {
    try {
        // For webhooks, we might use API key authentication instead of Clerk
        const apiKey = request.headers.get('x-api-key');
        if (!apiKey) {
            return NextResponse.json({ success: false, error: 'API key required' }, { status: 401 });
        }

        // TODO: Validate API key
        // const isValidApiKey = await validateApiKey(apiKey);
        // if (!isValidApiKey) {
        //   return NextResponse.json(
        //     { success: false, error: 'Invalid API key' },
        //     { status: 401 }
        //   );
        // }

        const body = await request.json();
        const validatedData = webhookSensorDataSchema.parse(body);

        const db = getDrizzle();

        // Verify device exists
        const device = await db
            .select()
            .from(iotDevices)
            .where(eq(iotDevices.deviceId, validatedData.deviceId))
            .limit(1);

        if (!device.length) {
            return NextResponse.json({ success: false, error: 'Device not found' }, { status: 404 });
        }

        // Insert multiple sensor data points
        const insertedData = [];
        for (const dataPoint of validatedData.data) {
            const sensorDataId = `sensor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            // Determine if alert should be triggered
            let alertTriggered = false;
            switch (dataPoint.dataType) {
                case 'temperature':
                    if (dataPoint.value < 36 || dataPoint.value > 42) {
                        alertTriggered = true;
                    }
                    break;
                case 'activity':
                    if (dataPoint.value < 200 || dataPoint.value > 15000) {
                        alertTriggered = true;
                    }
                    break;
                case 'milk_yield':
                    if (dataPoint.value < 2 || dataPoint.value > 60) {
                        alertTriggered = true;
                    }
                    break;
            }

            const newSensorData = await db
                .insert(sensorData)
                .values({
                    id: sensorDataId,
                    deviceId: validatedData.deviceId,
                    animalId: device[0].animalId, // Use animal assigned to device
                    ...dataPoint,
                    timestamp: new Date(dataPoint.timestamp),
                    alertTriggered,
                    createdAt: new Date(),
                })
                .returning();

            insertedData.push(newSensorData[0]);
        }

        // Update device info if provided
        if (validatedData.deviceInfo) {
            await db
                .update(iotDevices)
                .set({
                    ...validatedData.deviceInfo,
                    lastSync: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(iotDevices.deviceId, validatedData.deviceId));
        }

        return NextResponse.json({
            success: true,
            data: {
                insertedCount: insertedData.length,
                sensorData: insertedData,
            },
            message: `Successfully recorded ${insertedData.length} sensor data points`,
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