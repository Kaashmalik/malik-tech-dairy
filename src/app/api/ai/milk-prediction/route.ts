import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getMilkPrediction, getBatchMilkPredictions } from '@/lib/ai/prediction';
import { z } from 'zod';

const predictionSchema = z.object({
  animalId: z.string().min(1, 'Animal ID is required'),
  daysOfData: z.number().min(7).max(90).optional().default(30),
  includeFactors: z.boolean().optional().default(true),
});

const batchPredictionSchema = z.object({
  animalIds: z
    .array(z.string())
    .min(1, 'At least one animal ID is required')
    .max(10, 'Maximum 10 animals per batch'),
  daysOfData: z.number().min(7).max(90).optional().default(30),
  includeFactors: z.boolean().optional().default(true),
});

export const dynamic = 'force-dynamic';

// Single animal prediction
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await request.json();

      // Check if this is a batch request
      if (body.animalIds && Array.isArray(body.animalIds)) {
        const { animalIds, daysOfData, includeFactors } = batchPredictionSchema.parse(body);

        // Verify all animals belong to this tenant
        const supabase = require('@/lib/supabase').getSupabaseClient();
        const { data: animals, error } = (await supabase
          .from('animals')
          .select('id')
          .eq('tenant_id', context.tenantId)
          .in('id', animalIds)) as { data: any[]; error: any };

        if (error || !animals || animals.length !== animalIds.length) {
          return NextResponse.json(
            { success: false, error: "Some animals not found or don't belong to your farm" },
            { status: 404 }
          );
        }

        const predictions = await getBatchMilkPredictions(animalIds);

        return NextResponse.json({
          success: true,
          data: {
            predictions: Object.fromEntries(predictions),
            generatedAt: new Date().toISOString(),
          },
        });
      } else {
        // Single animal prediction
        const { animalId, daysOfData, includeFactors } = predictionSchema.parse(body);

        // Verify animal belongs to this tenant
        const supabase = require('@/lib/supabase').getSupabaseClient();
        const { data: animal, error } = (await supabase
          .from('animals')
          .select('id')
          .eq('tenant_id', context.tenantId)
          .eq('id', animalId)
          .single()) as { data: any; error: any };

        if (error || !animal) {
          return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
        }

        const prediction = await getMilkPrediction({
          animalId,
          daysOfData,
          includeFactors,
        });

        return NextResponse.json({
          success: true,
          data: {
            prediction,
            animalId,
            generatedAt: new Date().toISOString(),
          },
        });
      }
    } catch (error) {
      console.error('Error in milk prediction API:', error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Invalid input', details: error.errors },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Failed to generate prediction' },
        { status: 500 }
      );
    }
  })(request);
}

// Get prediction history for an animal
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const animalId = searchParams.get('animalId');

      if (!animalId) {
        return NextResponse.json(
          { success: false, error: 'Animal ID is required' },
          { status: 400 }
        );
      }

      // Verify animal belongs to this tenant
      const supabase = require('@/lib/supabase').getSupabaseClient();
      const { data: animal, error } = (await supabase
        .from('animals')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('id', animalId)
        .single()) as { data: any; error: any };

      if (error || !animal) {
        return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
      }

      // Fetch prediction history (if stored)
      const { data: history, error: historyError } = (await supabase
        .from('ai_predictions')
        .select('*')
        .eq('animal_id', animalId)
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false })
        .limit(30)) as { data: any[]; error: any };

      if (historyError) {
        console.error('Error fetching prediction history:', historyError);
        // Return empty history if table doesn't exist or other error
        return NextResponse.json({
          success: true,
          data: {
            history: [],
            message: 'No prediction history available',
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          history: history || [],
          count: history?.length || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch prediction history' },
        { status: 500 }
      );
    }
  })(request);
}
