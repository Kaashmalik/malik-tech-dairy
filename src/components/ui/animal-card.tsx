'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Activity, 
  Calendar,
  TrendingUp,
  Droplets,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';

interface AnimalCardProps {
  animal: {
    id: string;
    tag: string;
    name: string;
    breed: string;
    status: string;
    lastMilkYield?: number;
    lastHealthCheck?: string;
    nextVaccination?: string;
  };
  className?: string;
}

export function AnimalCard({ animal, className }: AnimalCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'sick':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'sold':
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <Card 
      className={cn(
        // Glassmorphism effect
        'backdrop-blur-xl bg-white/5 border border-white/10',
        'shadow-xl shadow-black/10',
        'hover:bg-white/10 hover:border-white/20 transition-all duration-300',
        'hover:shadow-2xl hover:shadow-black/20',
        'relative overflow-hidden',
        className
      )}
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-50" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <span className="text-xl">{animal.name || 'Unnamed'}</span>
              <Badge variant="outline" className={cn('text-xs', getStatusColor(animal.status))}>
                {animal.status}
              </Badge>
            </CardTitle>
            <p className="text-sm text-white/60">Tag: {animal.tag}</p>
            <p className="text-xs text-white/40">Breed: {animal.breed}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative pt-0">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {animal.lastMilkYield && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Droplets className="h-4 w-4 text-blue-400" />
              <div>
                <p className="text-xs text-white/60">Last Yield</p>
                <p className="text-sm font-semibold text-white/90">{animal.lastMilkYield}L</p>
              </div>
            </div>
          )}
          
          {animal.lastHealthCheck && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Heart className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-white/60">Health</p>
                <p className="text-sm font-semibold text-white/90">Good</p>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="space-y-2">
          {animal.nextVaccination && (
            <div className="flex items-center gap-2 text-xs">
              <AlertCircle className="h-3 w-3 text-yellow-400" />
              <span className="text-white/60">
                Next vaccination: {animal.nextVaccination}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button 
            size="sm" 
            className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            variant="outline"
            className="border-white/20 text-white/80 hover:bg-white/10"
          >
            <Activity className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>

      {/* Subtle animated border */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </Card>
  );
}

// Mobile-first responsive grid container
export function AnimalGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  );
}

// Dashboard stats card with glassmorphism
export function StatsCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend 
}: {
  title: string;
  value: string | number;
  change?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-white/60';
    }
  };

  return (
    <Card className="backdrop-blur-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-white/60">{title}</p>
            <p className="text-2xl font-bold text-white/90">{value}</p>
            {change && (
              <p className={cn('text-xs flex items-center gap-1', getTrendColor())}>
                {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                {change}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-white/80" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
