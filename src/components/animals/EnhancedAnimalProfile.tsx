'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Beef,
  Heart,
  Activity,
  TrendingUp,
  DollarSign,
  MapPin,
  Camera,
  Calendar,
  Weight,
  Droplets,
  Thermometer,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Download,
  Share,
  QrCode,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimalHealthChart } from './AnimalHealthChart';
import { MilkProductionChart } from './MilkProductionChart';
import { GeneticProfileCard } from './GeneticProfileCard';
import { FinancialMetricsCard } from './FinancialMetricsCard';
import { BreedingTimeline } from './BreedingTimeline';
import { VisionAnalysisCard } from './VisionAnalysisCard';
interface EnhancedAnimalProfileProps {
  animalId: string;
  className?: string;
}
interface AnimalData {
  id: string;
  name: string;
  tag: string;
  species: string;
  breed: string;
  gender: string;
  birthDate: string;
  healthStatus: string;
  healthScore: number;
  reproductiveStatus: string;
  location: string;
  rfidTag?: string;
  qrCode: string;
  image?: string;
  weight?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
  geneticProfile?: {
    breedScore: number;
    milkYieldPotential: number;
    geneticValueIndex: number;
  };
  averageMilkYield: number;
  lastVaccinationDate?: string;
  lastHealthCheck?: string;
  latestVisionAnalysis?: {
    bodyConditionScore: number;
    confidenceScore: number;
    analysisDate: string;
  };
}
export function EnhancedAnimalProfile({ animalId, className }: EnhancedAnimalProfileProps) {
  const [animal, setAnimal] = useState<AnimalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => {
    fetchAnimalData();
  }, [animalId]);
  const fetchAnimalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/animals/enhanced?id=${animalId}`);
      const result = await response.json();
      if (result.success) {
        setAnimal(result.data);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'sick':
        return 'bg-red-100 text-red-800';
      case 'under treatment':
        return 'bg-yellow-100 text-yellow-800';
      case 'quarantine':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const ageInDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
    if (ageInDays < 365) {
      return `${Math.floor(ageInDays / 30)} months`;
    }
    return `${Math.floor(ageInDays / 365)} years`;
  };
  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className='p-6'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 w-1/3 rounded bg-gray-200'></div>
            <div className='h-4 w-1/2 rounded bg-gray-200'></div>
            <div className='h-20 rounded bg-gray-200'></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!animal) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className='p-6'>
          <div className='text-center text-gray-500'>
            <Beef className='mx-auto mb-4 h-12 w-12 opacity-50' />
            <p>Animal not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header Section */}
      <Card>
        <CardHeader className='pb-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              {animal.image ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-full">
                  <Image
                    src={animal.image}
                    alt={animal.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              ) : (
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-gray-200'>
                  <Beef className='h-8 w-8 text-gray-400' />
                </div>
              )}
              <div>
                <CardTitle className='text-2xl'>{animal.name}</CardTitle>
                <p className='text-gray-600'>Tag: {animal.tag}</p>
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Button variant='outline' size='sm'>
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </Button>
              <Button variant='outline' size='sm'>
                <QrCode className='mr-2 h-4 w-4' />
                QR
              </Button>
              <Button variant='outline' size='sm'>
                <Share className='mr-2 h-4 w-4' />
                Share
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {/* Basic Info Cards */}
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Beef className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium'>Species</span>
              </div>
              <p className='text-lg font-semibold capitalize'>{animal.species}</p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Droplets className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium'>Breed</span>
              </div>
              <p className='text-lg font-semibold'>{animal.breed}</p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <Calendar className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium'>Age</span>
              </div>
              <p className='text-lg font-semibold'>{calculateAge(animal.birthDate)}</p>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center space-x-2'>
                <MapPin className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium'>Location</span>
              </div>
              <p className='text-lg font-semibold'>{animal.location || 'Not assigned'}</p>
            </div>
          </div>
          {/* Status Badges */}
          <div className='mt-4 flex flex-wrap gap-2'>
            <Badge className={getHealthStatusColor(animal.healthStatus)}>
              {animal.healthStatus}
            </Badge>
            <Badge variant='outline'>{animal.gender}</Badge>
            <Badge variant='outline'>{animal.reproductiveStatus}</Badge>
            {animal.rfidTag && <Badge variant='outline'>RFID: {animal.rfidTag}</Badge>}
          </div>
          {/* Health Score Progress */}
          <div className='mt-4'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium'>Health Score</span>
              <span className={cn('text-sm font-bold', getHealthScoreColor(animal.healthScore))}>
                {animal.healthScore}/100
              </span>
            </div>
            <Progress value={animal.healthScore} className='h-2' />
          </div>
        </CardContent>
      </Card>
      {/* Detailed Information Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='health'>Health</TabsTrigger>
          <TabsTrigger value='production'>Production</TabsTrigger>
          <TabsTrigger value='breeding'>Breeding</TabsTrigger>
          <TabsTrigger value='genetics'>Genetics</TabsTrigger>
          <TabsTrigger value='financial'>Financial</TabsTrigger>
        </TabsList>
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Weight</span>
                  <span className='font-semibold'>{animal.weight || 'N/A'} kg</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Height</span>
                  <span className='font-semibold'>{animal.height || 'N/A'} cm</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Average Milk Yield</span>
                  <span className='font-semibold'>{animal.averageMilkYield.toFixed(1)} L/day</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Last Health Check</span>
                  <span className='font-semibold'>
                    {animal.lastHealthCheck
                      ? new Date(animal.lastHealthCheck).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>Last Vaccination</span>
                  <span className='font-semibold'>
                    {animal.lastVaccinationDate
                      ? new Date(animal.lastVaccinationDate).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>
            {/* Latest Vision Analysis */}
            {animal.latestVisionAnalysis && (
              <VisionAnalysisCard analysis={animal.latestVisionAnalysis} />
            )}
          </div>
          {/* Health Trend Chart */}
          <AnimalHealthChart animalId={animalId} />
        </TabsContent>
        <TabsContent value='health' className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <Heart className='mr-2 h-5 w-5' />
                  Health Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  Detailed health history and records will be displayed here.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <Activity className='mr-2 h-5 w-5' />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  Vital signs monitoring and trends will be displayed here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='production' className='space-y-4'>
          <MilkProductionChart animalId={animalId} />
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <TrendingUp className='mr-2 h-5 w-5' />
                  Production Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Daily Average</span>
                    <span className='font-semibold'>{animal.averageMilkYield.toFixed(1)} L</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Weekly Trend</span>
                    <span className='font-semibold text-green-600'>+5.2%</span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-sm text-gray-600'>Quality Score</span>
                    <span className='font-semibold'>85/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <Weight className='mr-2 h-5 w-5' />
                  Weight Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>
                  Weight tracking and analysis will be displayed here.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center text-lg'>
                  <Droplets className='mr-2 h-5 w-5' />
                  Feed Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-600'>Feed efficiency metrics will be displayed here.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value='breeding' className='space-y-4'>
          <BreedingTimeline animalId={animalId} />
        </TabsContent>
        <TabsContent value='genetics' className='space-y-4'>
          {animal.geneticProfile ? (
            <GeneticProfileCard geneticProfile={animal.geneticProfile} />
          ) : (
            <Card>
              <CardContent className='p-6 text-center'>
                <AlertTriangle className='mx-auto mb-4 h-12 w-12 text-yellow-500' />
                <h3 className='mb-2 text-lg font-semibold'>No Genetic Profile</h3>
                <p className='mb-4 text-gray-600'>
                  Genetic testing hasn't been performed for this animal yet.
                </p>
                <Button>
                  <Camera className='mr-2 h-4 w-4' />
                  Schedule Genetic Test
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        <TabsContent value='financial' className='space-y-4'>
          <FinancialMetricsCard animalId={animalId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}