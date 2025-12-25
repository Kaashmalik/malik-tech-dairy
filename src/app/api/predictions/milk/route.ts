// API Route: Get Milk Production Predictions - Migrated to Supabase
import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { createClient } from '@/lib/supabase';
import { successResponse, errorResponse } from '@/lib/api/response';
import { transformFromDb } from '@/lib/utils/transform';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = createClient();
      
      // Get the most recent milk prediction for this tenant
      const { data, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .eq('type', 'milk_7d')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') {
        return errorResponse(error);
      }
      if (!data) {
        return successResponse({
          predictions: [],
          confidenceBand: [],
          lastUpdated: null,
          modelVersion: null,
          message: 'No predictions available yet. Predictions are generated daily.',
        });
      }
      // Transform to camelCase
      const prediction = transformFromDb(data);
      return successResponse({
        predictions: prediction.predictions || [],
        confidenceBand: prediction.confidenceBand || [],
        lastUpdated: prediction.createdAt,
        modelVersion: prediction.modelVersion,
        accuracyScore: prediction.accuracyScore,
        parameters: prediction.parameters,
      });
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}
// POST: Generate or update milk predictions
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const { predictions, confidenceBand, modelVersion = '1.0', accuracyScore, parameters } = body;
      if (!predictions || !Array.isArray(predictions)) {
        return errorResponse({
          success: false,
          error: 'Predictions array is required',
          code: 'VALIDATION_ERROR',
        }, { status: 400 });
      }
      const supabase = createClient();
      
      // Deactivate old predictions
      await supabase
        .from('predictions')
        .update({ is_active: false })
        .eq('tenant_id', context.tenantId)
        .eq('type', 'milk_7d');
      // Create new prediction record
      const { data, error } = await supabase
        .from('predictions')
        .insert({
          id: crypto.randomUUID(),
          tenant_id: context.tenantId,
          type: 'milk_7d',
          title: '7-Day Milk Production Forecast',
          description: 'AI-powered prediction of milk production for the next 7 days',
          predictions,
          confidence_band: confidenceBand,
          model_version: modelVersion,
          accuracy_score: accuracyScore,
          parameters,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      if (error) {
        return errorResponse(error);
      }
      // Transform to camelCase
      const prediction = transformFromDb(data);
      return successResponse(prediction, {
        message: 'Milk predictions generated successfully',
        status: 201,
      });
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}