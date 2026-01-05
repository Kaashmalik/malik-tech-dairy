'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@clerk/nextjs';
import { MapPin, Save, RefreshCw, Globe, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface FarmLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  address: string;
  timezone: string;
}

interface TenantSettings {
  id: string;
  farm_location: FarmLocation;
  weather_enabled: boolean;
  weather_unit: 'metric' | 'imperial';
}

const DEFAULT_LOCATION: FarmLocation = {
  latitude: 30.0735,
  longitude: 71.1935,
  city: 'Muzzafargarh',
  country: 'PK',
  address: '',
  timezone: 'Asia/Karachi',
};

export default function LocationSettings() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const [location, setLocation] = useState<FarmLocation>(DEFAULT_LOCATION);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const supabase = createClient();

  // Fetch current tenant settings with proper tenant filtering
  const {
    data: settings,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['tenant-settings', organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error('No organization found');
      }

      const { data, error } = await supabase
        .from('tenants')
        .select('id, farm_location, weather_enabled, weather_unit')
        .eq('id', organization.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching tenant settings:', error);
        throw error;
      }

      return data as TenantSettings;
    },
    enabled: !!organization?.id && orgLoaded,
    staleTime: 60000, // Cache for 1 minute
    retry: 2,
  });

  // Update settings mutation with proper tenant filtering
  const updateSettingsMutation = useMutation<TenantSettings | null, Error, Partial<TenantSettings>>(
    {
      mutationFn: async newSettings => {
        if (!organization?.id) {
          throw new Error('No organization found');
        }

        // Get organization slug from organization metadata if available, otherwise use farm name
        const slug =
          (organization as any)?.slug ||
          (settings?.id ? '' : organization.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));

        // Use upsert to handle both new and existing tenants
        const { data, error } = await supabase
          .from('tenants')
          .upsert({
            id: organization.id,
            slug: slug,
            farm_name: organization.name,
            farm_location: newSettings.farm_location,
            weather_enabled: newSettings.weather_enabled,
            weather_unit: newSettings.weather_unit,
            updated_at: new Date().toISOString(),
          })
          .select('id, farm_location, weather_enabled, weather_unit')
          .single();

        if (error) {
          console.error('Error updating tenant settings:', error);
          throw error;
        }

        return data as TenantSettings | null;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tenant-settings', organization?.id] });
        toast({
          title: 'Settings Updated',
          description: 'Your farm location has been updated successfully.',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update settings. Please try again.',
          variant: 'destructive',
        });
      },
    }
  );

  // Load settings on mount
  useEffect(() => {
    if (settings?.farm_location) {
      setLocation(settings.farm_location);
      setWeatherEnabled(settings.weather_enabled ?? true);
    }
  }, [settings]);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: 'Error',
        description: 'Geolocation is not supported by your browser.',
        variant: 'destructive',
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async position => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
          );
          const data = await response.json();

          const newLocation: FarmLocation = {
            latitude,
            longitude,
            city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
            country: data.address?.country_code?.toUpperCase() || 'PK',
            address: data.display_name || '',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Karachi',
          };

          setLocation(newLocation);
          toast({
            title: 'Location Detected',
            description: `Location set to ${newLocation.city}, ${newLocation.country}`,
          });
        } catch (error) {
          // Still update coordinates even if reverse geocoding fails
          setLocation(prev => ({
            ...prev,
            latitude,
            longitude,
          }));
          toast({
            title: 'Partial Success',
            description: 'Location coordinates detected. City name could not be fetched.',
          });
        }

        setIsGettingLocation(false);
      },
      error => {
        let errorMessage = 'Failed to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location access denied. Please enable location in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Save settings
  const handleSave = () => {
    if (!organization?.id) {
      toast({
        title: 'Error',
        description: 'No organization found. Please refresh the page.',
        variant: 'destructive',
      });
      return;
    }

    updateSettingsMutation.mutate({
      farm_location: location,
      weather_enabled: weatherEnabled,
      weather_unit: 'metric',
    });
  };

  // Show loading skeleton
  if (!orgLoaded || (isLoading && organization?.id)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Farm Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
            <Skeleton className='h-10 w-full' />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Farm Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              Failed to load settings. This might be because the tenant is not yet configured.
              Please try refreshing the page.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['tenant-settings'] })}
            variant='outline'
            className='mt-4'
          >
            <RefreshCw className='mr-2 h-4 w-4' />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show message if no organization
  if (!organization?.id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <MapPin className='h-5 w-5' />
            Farm Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              No organization found. Please select or create a farm first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='h-5 w-5' />
          Farm Location Settings
        </CardTitle>
        <p className='text-muted-foreground text-sm'>
          Set your farm location to get accurate weather data and farming recommendations.
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Current Location Display */}
        <div className='flex items-center justify-between rounded-lg bg-gray-50 p-4 dark:bg-gray-800'>
          <div>
            <p className='font-medium'>Current Location</p>
            <p className='text-muted-foreground text-sm'>
              {location.city}, {location.country}
            </p>
            <p className='text-muted-foreground text-xs'>
              {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
            </p>
          </div>
          <Badge variant={weatherEnabled ? 'default' : 'secondary'}>
            {weatherEnabled ? 'Weather Enabled' : 'Weather Disabled'}
          </Badge>
        </div>

        {/* Location Form */}
        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <Label htmlFor='latitude'>Latitude</Label>
            <Input
              id='latitude'
              type='number'
              step='0.0001'
              value={location.latitude}
              onChange={e =>
                setLocation({ ...location, latitude: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='longitude'>Longitude</Label>
            <Input
              id='longitude'
              type='number'
              step='0.0001'
              value={location.longitude}
              onChange={e =>
                setLocation({ ...location, longitude: parseFloat(e.target.value) || 0 })
              }
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='city'>City</Label>
            <Input
              id='city'
              value={location.city}
              onChange={e => setLocation({ ...location, city: e.target.value })}
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='country'>Country Code</Label>
            <Input
              id='country'
              maxLength={2}
              value={location.country}
              onChange={e => setLocation({ ...location, country: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='address'>Full Address (Optional)</Label>
          <Textarea
            id='address'
            value={location.address}
            onChange={e => setLocation({ ...location, address: e.target.value })}
            rows={2}
          />
        </div>

        {/* Weather Toggle */}
        <div className='flex items-center justify-between'>
          <div className='space-y-0.5'>
            <Label>Enable Weather Service</Label>
            <p className='text-muted-foreground text-sm'>
              Get weather updates and farming recommendations
            </p>
          </div>
          <Switch checked={weatherEnabled} onCheckedChange={setWeatherEnabled} />
        </div>

        {/* Action Buttons */}
        <div className='flex gap-2 pt-4'>
          <Button
            onClick={getCurrentLocation}
            variant='outline'
            disabled={isGettingLocation}
            className='flex items-center gap-2'
          >
            <RefreshCw className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
            {isGettingLocation ? 'Detecting...' : 'Use My Location'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className='flex items-center gap-2'
          >
            <Save className='h-4 w-4' />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <Globe className='h-4 w-4' />
          <AlertDescription>
            Weather data is fetched from Open-Meteo. The system uses your exact coordinates to
            provide accurate weather information and farming recommendations for your specific
            location.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
