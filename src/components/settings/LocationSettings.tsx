'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Save, RefreshCw, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  farm_location: FarmLocation;
  weather_enabled: boolean;
  weather_unit: 'metric' | 'imperial';
}

export default function LocationSettings() {
  const [location, setLocation] = useState<FarmLocation>({
    latitude: 30.0735,
    longitude: 71.1935,
    city: 'Muzzafargarh',
    country: 'PK',
    address: '',
    timezone: 'Asia/Karachi'
  });
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const supabase = createClient();

  // Fetch current tenant settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('farm_location, weather_enabled, weather_unit')
        .single();
      
      if (error) throw error;
      return data as TenantSettings;
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<TenantSettings>) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(newSettings)
        .select('farm_location, weather_enabled, weather_unit')
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast({
        title: 'Settings Updated',
        description: 'Your farm location has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Load settings on mount
  useEffect(() => {
    if (settings) {
      setLocation(settings.farm_location);
      setWeatherEnabled(settings.weather_enabled);
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
      async (position) => {
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
            timezone: 'Asia/Karachi'
          };
          
          setLocation(newLocation);
          toast({
            title: 'Location Detected',
            description: `Location set to ${newLocation.city}, ${newLocation.country}`,
          });
        } catch (error) {
          toast({
            title: 'Warning',
            description: 'Location detected but city name could not be fetched.',
            variant: 'destructive',
          });
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        toast({
          title: 'Error',
          description: 'Failed to get your location. Please enable location access.',
          variant: 'destructive',
        });
        setIsGettingLocation(false);
      }
    );
  };

  // Save settings
  const handleSave = () => {
    updateSettingsMutation.mutate({
      farm_location: location,
      weather_enabled: weatherEnabled,
      weather_unit: 'metric',
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Farm Location Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 w-32 animate-pulse bg-gray-200 rounded"></div>
            <div className="h-10 w-full animate-pulse bg-gray-200 rounded"></div>
            <div className="h-10 w-full animate-pulse bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Farm Location Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Set your farm location to get accurate weather data and farming recommendations.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Location Display */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium">Current Location</p>
            <p className="text-sm text-muted-foreground">
              {location.city}, {location.country}
            </p>
            <p className="text-xs text-muted-foreground">
              {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
            </p>
          </div>
          <Badge variant={weatherEnabled ? 'default' : 'secondary'}>
            {weatherEnabled ? 'Weather Enabled' : 'Weather Disabled'}
          </Badge>
        </div>

        {/* Location Form */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              value={location.latitude}
              onChange={(e) => setLocation({ ...location, latitude: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              value={location.longitude}
              onChange={(e) => setLocation({ ...location, longitude: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={location.city}
              onChange={(e) => setLocation({ ...location, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country Code</Label>
            <Input
              id="country"
              maxLength={2}
              value={location.country}
              onChange={(e) => setLocation({ ...location, country: e.target.value.toUpperCase() })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Full Address (Optional)</Label>
          <Textarea
            id="address"
            value={location.address}
            onChange={(e) => setLocation({ ...location, address: e.target.value })}
            rows={2}
          />
        </div>

        {/* Weather Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Weather Service</Label>
            <p className="text-sm text-muted-foreground">
              Get weather updates and farming recommendations
            </p>
          </div>
          <Switch
            checked={weatherEnabled}
            onCheckedChange={setWeatherEnabled}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={getCurrentLocation}
            variant="outline"
            disabled={isGettingLocation}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} />
            {isGettingLocation ? 'Detecting...' : 'Use My Location'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>

        {/* Info Alert */}
        <Alert>
          <Globe className="h-4 w-4" />
          <AlertDescription>
            Weather data is fetched from OpenWeatherMap. The system uses your exact coordinates
            to provide accurate weather information and farming recommendations for your specific location.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
