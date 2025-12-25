import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import professionalWeatherService from '@/lib/weather/professional-weather-service';

// This endpoint syncs weather data for tenants based on their farm locations
// Can be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Verify this is an authorized request (you might want to add a secret key)
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.WEATHER_SYNC_SECRET;
    
    if (!secretKey || authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient();
    
    // Get all active tenants with weather enabled
    const { data: tenants, error: tenantError } = await supabase
      .from('tenants')
      .select('id, farm_name, farm_location, weather_enabled')
      .is('deleted_at', null)
      .eq('weather_enabled', true);
    
    if (tenantError) {
      throw new Error(`Failed to fetch tenants: ${tenantError.message}`);
    }

    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No tenants with weather enabled found',
        results: [],
      });
    }

    const results = [];
    
    // Fetch weather for each tenant based on their location
    for (const tenant of tenants) {
      try {
        // Get weather for tenant's farm location
        const weather = await professionalWeatherService.getTenantWeather(
          tenant.id, 
          tenant.farm_location
        );
        
        // Transform and save weather data
        const weatherData = professionalWeatherService.transformWeatherData(
          weather, 
          tenant.id, 
          tenant.farm_location
        );
        
        // Check if data already exists for this timestamp
        const { data: existing } = await supabase
          .from('weather_data')
          .select('id')
          .eq('tenant_id', tenant.id)
          .eq('data_timestamp', weatherData.data_timestamp)
          .single();
        
        if (existing) {
          // Update existing
          await supabase
            .from('weather_data')
            .update({
              ...weatherData,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);
        } else {
          // Insert new
          await supabase
            .from('weather_data')
            .insert({
              id: `weather_${tenant.id}_${Date.now()}`,
              ...weatherData,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
        
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.farm_name,
          location: tenant.farm_location.city,
          temperature: weather.main.temp,
          condition: weather.weather[0].description,
          success: true,
        });
      } catch (error) {
        console.error(`Failed to sync weather for tenant ${tenant.id}:`, error);
        results.push({
          tenantId: tenant.id,
          tenantName: tenant.farm_name,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weather sync completed for ${results.length} tenants`,
      results,
    });
  } catch (error) {
    console.error('Weather sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET /api/weather/sync - Manual trigger for sync
export async function GET(request: NextRequest) {
  try {
    // For manual triggering, you might want to add authentication
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    
    // Verify tenant exists and has weather enabled
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, farm_name, farm_location, weather_enabled')
      .eq('id', tenantId)
      .single();
    
    if (tenantError || !tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
    }
    
    if (!tenant.weather_enabled) {
      return NextResponse.json(
        { success: false, error: 'Weather is disabled for this tenant' },
        { status: 400 }
      );
    }

    // Get weather for tenant's farm location
    const weather = await professionalWeatherService.getTenantWeather(
      tenantId, 
      tenant.farm_location
    );
    
    // Save weather data
    const weatherData = professionalWeatherService.transformWeatherData(
      weather, 
      tenantId, 
      tenant.farm_location
    );
    
    const { data, error } = await supabase
      .from('weather_data')
      .insert({
        id: `weather_${tenantId}_${Date.now()}`,
        ...weatherData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: `Weather data updated for ${tenant.farm_location.city}`,
      data: data,
      location: tenant.farm_location,
    });
  } catch (error) {
    console.error('Manual weather sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
