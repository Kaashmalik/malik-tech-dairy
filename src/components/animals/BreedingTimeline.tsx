'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, 
  Calendar, 
  Clock, 
  Baby, 
  AlertCircle,
  CheckCircle,
  Plus,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreedingTimelineProps {
  animalId: string;
  className?: string;
}

interface BreedingEvent {
  id: string;
  date: string;
  type: 'heat' | 'insemination' | 'pregnancy_check' | 'birth' | 'weaning';
  status: 'completed' | 'pending' | 'scheduled';
  title: string;
  description: string;
  outcome?: string;
  nextAction?: string;
}

export function BreedingTimeline({ animalId, className }: BreedingTimelineProps) {
  const [events, setEvents] = useState<BreedingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBreedingEvents();
  }, [animalId]);

  const fetchBreedingEvents = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockEvents: BreedingEvent[] = [
        {
          id: '1',
          date: '2024-10-15',
          type: 'heat',
          status: 'completed',
          title: 'Heat Detected',
          description: 'Natural heat observed, standing heat for 12 hours',
          outcome: 'Successful',
          nextAction: 'Schedule insemination'
        },
        {
          id: '2',
          date: '2024-10-16',
          type: 'insemination',
          status: 'completed',
          title: 'Artificial Insemination',
          description: 'AI performed with premium bull semen',
          outcome: 'Successful',
          nextAction: 'Pregnancy check in 30 days'
        },
        {
          id: '3',
          date: '2024-11-15',
          type: 'pregnancy_check',
          status: 'completed',
          title: 'Pregnancy Confirmation',
          description: 'Ultrasound confirmed pregnancy',
          outcome: 'Positive - 60 days pregnant',
          nextAction: 'Monitor nutrition and health'
        },
        {
          id: '4',
          date: '2025-01-20',
          type: 'birth',
          status: 'scheduled',
          title: 'Expected Calving',
          description: 'Estimated due date based on breeding',
          nextAction: 'Prepare calving area'
        },
        {
          id: '5',
          date: '2025-03-20',
          type: 'weaning',
          status: 'pending',
          title: 'Calf Weaning',
          description: 'Planned weaning date for calf',
          nextAction: 'Monitor calf growth'
        },
      ];

      setEvents(mockEvents);
    } catch (error) {
      console.error('Error fetching breeding events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'heat': return <Heart className="h-4 w-4" />;
      case 'insemination': return <Activity className="h-4 w-4" />;
      case 'pregnancy_check': return <AlertCircle className="h-4 w-4" />;
      case 'birth': return <Baby className="h-4 w-4" />;
      case 'weaning': return <CheckCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string, status: string) => {
    if (status === 'pending') return 'bg-gray-100 text-gray-600';
    if (status === 'scheduled') return 'bg-blue-100 text-blue-600';
    
    switch (type) {
      case 'heat': return 'bg-pink-100 text-pink-600';
      case 'insemination': return 'bg-purple-100 text-purple-600';
      case 'pregnancy_check': return 'bg-green-100 text-green-600';
      case 'birth': return 'bg-yellow-100 text-yellow-600';
      case 'weaning': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'pending': return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getDaysUntil = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today';
    return `In ${diffDays} days`;
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Breeding Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Heart className="h-5 w-5 mr-2" />
            Breeding Timeline
          </CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-blue-900">Current Status</h4>
                <p className="text-sm text-blue-700">Pregnant - 60 days confirmed</p>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-600">Due: Jan 20, 2025</span>
              </div>
            </div>
          </div>

          {/* Timeline Events */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start space-x-4 pb-6">
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-sm',
                  getEventColor(event.type, event.status)
                )}>
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">
                      {event.title}
                    </h4>
                    {getStatusBadge(event.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(event.date)}
                      </span>
                      <span>{getDaysUntil(event.date)}</span>
                    </div>
                    
                    {event.outcome && (
                      <span className="text-xs font-medium text-green-600">
                        {event.outcome}
                      </span>
                    )}
                  </div>
                  
                  {event.nextAction && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <strong>Next Action:</strong> {event.nextAction}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Breeding Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">3</div>
              <div className="text-xs text-gray-600">Total Pregnancies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-xs text-gray-600">Conception Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">285</div>
              <div className="text-xs text-gray-600">Average Days in Milk</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Record Heat
            </Button>
            <Button variant="outline" size="sm">
              <Heart className="h-4 w-4 mr-2" />
              Schedule AI
            </Button>
            <Button variant="outline" size="sm">
              <AlertCircle className="h-4 w-4 mr-2" />
              Pregnancy Check
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
