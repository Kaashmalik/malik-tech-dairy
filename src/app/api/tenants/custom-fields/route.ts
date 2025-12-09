// API Route: Custom Fields Configuration
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const customFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'dropdown']),
  required: z.boolean().optional().default(false),
  options: z.array(z.string()).optional(), // For dropdown type
  defaultValue: z.union([z.string(), z.number()]).optional(),
});

const customFieldsSchema = z.array(customFieldSchema);

// GET: Get custom fields configuration
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const customFieldsRef = adminDb
        .collection('tenants')
        .doc(context.tenantId)
        .collection('config')
        .doc('customFields');

      const doc = await customFieldsRef.get();

      if (!doc.exists) {
        return NextResponse.json({ fields: [] });
      }

      const data = doc.data();
      return NextResponse.json({ fields: data?.fields || [] });
    } catch (error) {
      console.error('Error fetching custom fields:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// POST: Update custom fields configuration
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      if (!adminDb) {
        return NextResponse.json({ error: 'Database not available' }, { status: 500 });
      }

      const body = await req.json();

      // Validate
      let validated;
      try {
        validated = customFieldsSchema.parse(body.fields || []);
      } catch (error: any) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        );
      }

      // Add IDs to fields that don't have them
      const fieldsWithIds = validated.map((field, index) => ({
        ...field,
        id: field.id || `field_${Date.now()}_${index}`,
      }));

      const customFieldsRef = adminDb
        .collection('tenants')
        .doc(context.tenantId)
        .collection('config')
        .doc('customFields');

      await customFieldsRef.set(
        {
          fields: fieldsWithIds,
          updatedAt: new Date(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        fields: fieldsWithIds,
      });
    } catch (error) {
      console.error('Error updating custom fields:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
