import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getSupabaseClient } from '@/lib/supabase';
import { withTenantContext } from '@/lib/api/middleware';
import { WeatherDataRow, TenantRow } from '@/types/weather';

interface WeatherData {
  tenant_id: string;
  city_name: string;
  country: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  visibility?: number;
  uv_index?: number;
  wind_speed: number;
  wind_direction: number;
  wind_gust?: number;
  weather_main: string;
  weather_description: string;
  weather_icon: string;
  cloudiness: number;
  rain_1h?: number;
  rain_3h?: number;
  snow_1h?: number;
  snow_3h?: number;
  sunrise?: string;
  sunset?: string;
  data_timestamp: string;
}

// GET /api/weather - Fetch weather data for tenant
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();
      
      // Get tenant location
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('farm_location, weather_enabled')
        .eq('id', context.tenantId)
        .single() as { data: TenantRow | null; error: any };
      
      if (tenantError || !tenant) {
        return NextResponse.json(
          { success: false, error: 'Tenant not found' },
          { status: 404 }
        );
      }
      
      // Check if weather is enabled for this tenant
      if (!tenant.weather_enabled) {
        return NextResponse.json(
          { success: true, data: [], message: 'Weather disabled for this tenant' },
          { status: 200 }
        );
      }
      
      // Get weather data
      const { data, error } = await supabase
        .from('weather_data')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('data_timestamp', { ascending: false })
        .limit(10) as { data: WeatherDataRow[] | null; error: any };
      
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
      // If no weather data, try to fetch it
      if (!data || data.length === 0) {
        const { data: freshData } = await supabase
          .from('weather_data')
          .select('*')
          .eq('tenant_id', context.tenantId)
          .order('data_timestamp', { ascending: false })
          .limit(1) as { data: WeatherDataRow[] | null; error: any };
        
        return NextResponse.json({
          success: true,
          data: freshData || [],
          location: tenant.farm_location,
        });
      }
      
      return NextResponse.json({
        success: true,
        data: data || [],
        location: tenant.farm_location,
      });
    } catch (error) {
      logger.error('Weather GET error', error, { tenantId: context.tenantId });
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// POST /api/weather - Create or update weather data
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const weatherData = await request.json();
      
      // Validate required fields
      const requiredFields = ['city_name', 'temperature', 'humidity', 'pressure', 'weather_main', 'data_timestamp'];
      for (const field of requiredFields) {
        if (!weatherData[field as keyof WeatherData]) {
          return NextResponse.json(
            { success: false, error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
      
      const supabase = getSupabaseClient();
      
      const { data: existing } = await supabase
        .from('weather_data')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('data_timestamp', weatherData.data_timestamp)
        .single() as { data: WeatherDataRow | null; error: any };
      
      let result;
      let updateError: any = null;
      let insertError: any = null;
      const weatherRecord = {
        tenant_id: context.tenantId,
        updated_at: new Date().toISOString(),
        ...weatherData,
      };
      
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('weather_data')
          .update(weatherRecord)
          .eq('id', existing.id)
          .select()
          .single() as { data: WeatherDataRow | null; error: any };
        
        updateError = error;
        result = data;
      } else {
        // Create new record
        const { data, error } = await supabase
          .from('weather_data')
          .insert({
            ...weatherRecord,
            id: `weather_${context.tenantId}_${Date.now()}`,
            created_at: new Date().toISOString(),
          })
          .select()
          .single() as { data: WeatherDataRow | null; error: any };
        
        insertError = error;
        result = data;
      }
      
      if (updateError || insertError) {
        const error = updateError || insertError;
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data: result,
        message: existing ? 'Weather data updated' : 'Weather data created',
      });
    } catch (error) {
      logger.error('Weather POST error', error, { tenantId: context.tenantId });
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// PUT /api/weather - Update weather data
export async function PUT(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { id, ...updateData } = await request.json();
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Weather data ID is required' },
          { status: 400 }
        );
      }
      
      const supabase = getSupabaseClient();
      
      const { data, error } = await supabase
        .from('weather_data')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single() as { data: WeatherDataRow | null; error: any };
      
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        data,
        message: 'Weather data updated successfully',
      });
    } catch (error) {
      logger.error('Weather PUT error', error, { tenantId: context.tenantId });
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}

// DELETE /api/weather - Delete weather data
export async function DELETE(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      
      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Weather data ID is required' },
          { status: 400 }
        );
      }
      
      const supabase = getSupabaseClient();
      
      const { error } = await supabase
        .from('weather_data')
        .delete()
        .eq('id', id)
        .eq('tenant_id', context.tenantId);
      
      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: 'Weather data deleted successfully',
      });
    } catch (error) {
      logger.error('Weather DELETE error', error, { tenantId: context.tenantId });
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      );
    }
  })(request);
}
