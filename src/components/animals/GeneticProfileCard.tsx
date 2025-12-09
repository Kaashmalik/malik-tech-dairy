'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  DNA,
  TrendingUp,
  Award,
  AlertCircle,
  CheckCircle,
  Download,
  Share,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface GeneticProfileCardProps {
  geneticProfile: {
    breedScore: number;
    milkYieldPotential: number;
    geneticValueIndex: number;
  };
  className?: string;
}

export function GeneticProfileCard({ geneticProfile, className }: GeneticProfileCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 85) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getProgressColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Below Average';
  };

  const getGeneticValueLabel = (index: number) => {
    if (index >= 90) return 'Premium Breeding Stock';
    if (index >= 80) return 'High Value';
    if (index >= 70) return 'Good Breeding Potential';
    if (index >= 60) return 'Moderate Value';
    return 'Limited Breeding Value';
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Main Genetic Score Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='flex items-center text-lg'>
              <DNA className='mr-2 h-5 w-5' />
              Genetic Profile
            </CardTitle>
            <Badge className={getScoreBadgeColor(geneticProfile.geneticValueIndex)}>
              {getScoreLabel(geneticProfile.geneticValueIndex)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {/* Overall Genetic Value */}
            <div>
              <div className='mb-2 flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Overall Genetic Value</span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    getScoreColor(geneticProfile.geneticValueIndex)
                  )}
                >
                  {geneticProfile.geneticValueIndex}/100
                </span>
              </div>
              <Progress
                value={geneticProfile.geneticValueIndex}
                className='h-3'
                // @ts-ignore - Progress component accepts style prop
                style={
                  {
                    '--progress-background': getProgressColor(geneticProfile.geneticValueIndex),
                  } as React.CSSProperties
                }
              />
              <p className='mt-1 text-xs text-gray-500'>
                {getGeneticValueLabel(geneticProfile.geneticValueIndex)}
              </p>
            </div>

            {/* Individual Genetic Metrics */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Breed Score */}
              <div className='rounded-lg bg-gray-50 p-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <Award className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium text-gray-700'>Breed Score</span>
                  </div>
                  <span
                    className={cn('text-sm font-bold', getScoreColor(geneticProfile.breedScore))}
                  >
                    {geneticProfile.breedScore}/100
                  </span>
                </div>
                <Progress value={geneticProfile.breedScore} className='mb-2 h-2' />
                <p className='text-xs text-gray-500'>
                  {getScoreLabel(geneticProfile.breedScore)} breed characteristics
                </p>
              </div>

              {/* Milk Yield Potential */}
              <div className='rounded-lg bg-gray-50 p-4'>
                <div className='mb-2 flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <TrendingUp className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium text-gray-700'>Milk Yield Potential</span>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      getScoreColor(geneticProfile.milkYieldPotential)
                    )}
                  >
                    {geneticProfile.milkYieldPotential}/100
                  </span>
                </div>
                <Progress value={geneticProfile.milkYieldPotential} className='mb-2 h-2' />
                <p className='text-xs text-gray-500'>
                  {getScoreLabel(geneticProfile.milkYieldPotential)} production potential
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex items-center space-x-2'>
              <Button variant='outline' size='sm'>
                <Download className='mr-2 h-4 w-4' />
                Download Report
              </Button>
              <Button variant='outline' size='sm'>
                <Share className='mr-2 h-4 w-4' />
                Share Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Genetic Insights */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center text-lg'>
            <Info className='mr-2 h-5 w-5' />
            Genetic Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Breeding Recommendations */}
            <div>
              <h4 className='mb-2 text-sm font-medium text-gray-700'>Breeding Recommendations</h4>
              <div className='space-y-2'>
                {geneticProfile.geneticValueIndex >= 80 && (
                  <div className='flex items-start space-x-2'>
                    <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                    <p className='text-sm text-gray-600'>
                      Excellent breeding candidate. Consider for premium breeding program.
                    </p>
                  </div>
                )}
                {geneticProfile.milkYieldPotential >= 85 && (
                  <div className='flex items-start space-x-2'>
                    <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                    <p className='text-sm text-gray-600'>
                      High milk production genetics. Ideal for dairy-focused breeding.
                    </p>
                  </div>
                )}
                {geneticProfile.breedScore >= 80 && (
                  <div className='flex items-start space-x-2'>
                    <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                    <p className='text-sm text-gray-600'>
                      Superior breed characteristics. Valuable for breed improvement.
                    </p>
                  </div>
                )}
                {geneticProfile.geneticValueIndex < 60 && (
                  <div className='flex items-start space-x-2'>
                    <AlertCircle className='mt-0.5 h-4 w-4 text-yellow-600' />
                    <p className='text-sm text-gray-600'>
                      Consider genetic improvement through selective breeding.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Genetic Markers */}
            <div>
              <h4 className='mb-2 text-sm font-medium text-gray-700'>Key Genetic Markers</h4>
              <div className='grid grid-cols-2 gap-2'>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-xs text-gray-600'>Butterfat Genetics</span>
                  <Badge variant='outline' className='text-xs'>
                    {geneticProfile.milkYieldPotential > 80 ? 'High' : 'Normal'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-xs text-gray-600'>Protein Genetics</span>
                  <Badge variant='outline' className='text-xs'>
                    {geneticProfile.milkYieldPotential > 75 ? 'Enhanced' : 'Standard'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-xs text-gray-600'>Disease Resistance</span>
                  <Badge variant='outline' className='text-xs'>
                    {geneticProfile.breedScore > 70 ? 'Strong' : 'Moderate'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between rounded bg-gray-50 p-2'>
                  <span className='text-xs text-gray-600'>Longevity</span>
                  <Badge variant='outline' className='text-xs'>
                    {geneticProfile.geneticValueIndex > 75 ? 'Extended' : 'Normal'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Performance Projections */}
            <div>
              <h4 className='mb-2 text-sm font-medium text-gray-700'>Performance Projections</h4>
              <div className='space-y-1'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Expected Peak Yield</span>
                  <span className='font-medium'>
                    {(geneticProfile.milkYieldPotential * 0.3).toFixed(1)} L/day
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Butterfat Potential</span>
                  <span className='font-medium'>
                    {(3.5 + geneticProfile.milkYieldPotential * 0.01).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Protein Potential</span>
                  <span className='font-medium'>
                    {(3.2 + geneticProfile.milkYieldPotential * 0.008).toFixed(1)}%
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>Breeding Value</span>
                  <span className='font-medium'>
                    {geneticProfile.geneticValueIndex > 80
                      ? 'Premium'
                      : geneticProfile.geneticValueIndex > 60
                        ? 'Standard'
                        : 'Basic'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
