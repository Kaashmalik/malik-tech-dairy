import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = getSupabaseClient();
        const { orgId } = await auth();

        let lat = 31.5497; // Lahore default
        let lon = 74.3436;
        let locationName = 'Lahore, Pakistan';

        if (orgId) {
            // Try to get tenant's farm location from DB
            const { data: tenant } = await supabase
                .from('tenants')
                .select('farm_location')
                .eq('id', orgId)
                .single();

            if (tenant?.farm_location) {
                const loc = tenant.farm_location as any;
                if (loc.latitude && loc.longitude) {
                    lat = loc.latitude;
                    lon = loc.longitude;
                    locationName = `${loc.city || 'Farm'}, ${loc.country || 'Pakistan'}`;
                }
            }
        }

        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`Open-Meteo API error: ${response.statusText}`);
        }

        const data = await response.json();

        return NextResponse.json({
            ...data,
            location: locationName
        });
    } catch (error) {
        console.error('Weather API Proxy error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch weather data' },
            { status: 500 }
        );
    }
}
