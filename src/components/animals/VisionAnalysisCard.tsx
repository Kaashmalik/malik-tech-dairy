'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Camera,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  RefreshCw,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisionAnalysisCardProps {
  analysis: {
    bodyConditionScore: number;
    confidenceScore: number;
    analysisDate: string;
  };
  className?: string;
}

export function VisionAnalysisCard({ analysis, className }: VisionAnalysisCardProps) {
  const getBCSCategory = (score: number) => {
    if (score >= 4.5) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 3.5) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 2.5) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.9) return 'High Confidence';
    if (score >= 0.7) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const bcsCategory = getBCSCategory(analysis.bodyConditionScore);
  const confidencePercentage = Math.round(analysis.confidenceScore * 100);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center text-lg'>
            <Camera className='mr-2 h-5 w-5' />
            Computer Vision Analysis
          </CardTitle>
          <Badge className={bcsCategory.bg + ' ' + bcsCategory.color}>{bcsCategory.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-6'>
          {/* Body Condition Score */}
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>Body Condition Score</span>
              <span className='text-sm font-bold text-gray-900'>
                {analysis.bodyConditionScore.toFixed(1)}/5.0
              </span>
            </div>
            <Progress value={(analysis.bodyConditionScore / 5) * 100} className='h-3' />
            <p className='mt-1 text-xs text-gray-500'>{bcsCategory.label} body condition</p>
          </div>

          {/* Confidence Score */}
          <div>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-700'>AI Confidence</span>
              <span
                className={cn('text-sm font-bold', getConfidenceColor(analysis.confidenceScore))}
              >
                {confidencePercentage}%
              </span>
            </div>
            <Progress value={confidencePercentage} className='h-3' />
            <p className='mt-1 text-xs text-gray-500'>
              {getConfidenceLabel(analysis.confidenceScore)}
            </p>
          </div>

          {/* Analysis Details */}
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='rounded-lg bg-gray-50 p-3'>
              <div className='mb-2 flex items-center space-x-2'>
                <Eye className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>Analysis Type</span>
              </div>
              <p className='text-sm text-gray-600'>Body Condition Scoring</p>
            </div>

            <div className='rounded-lg bg-gray-50 p-3'>
              <div className='mb-2 flex items-center space-x-2'>
                <Clock className='h-4 w-4 text-gray-500' />
                <span className='text-sm font-medium text-gray-700'>Analysis Date</span>
              </div>
              <p className='text-sm text-gray-600'>{formatDate(analysis.analysisDate)}</p>
            </div>
          </div>

          {/* Health Insights */}
          <div>
            <h4 className='mb-3 text-sm font-medium text-gray-700'>Health Insights</h4>
            <div className='space-y-2'>
              {analysis.bodyConditionScore >= 4.0 && (
                <div className='flex items-start space-x-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                  <p className='text-sm text-gray-600'>
                    Excellent body condition. Animal is well-fed and healthy.
                  </p>
                </div>
              )}
              {analysis.bodyConditionScore >= 3.0 && analysis.bodyConditionScore < 4.0 && (
                <div className='flex items-start space-x-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-blue-600' />
                  <p className='text-sm text-gray-600'>
                    Good body condition. Nutrition is adequate for production.
                  </p>
                </div>
              )}
              {analysis.bodyConditionScore < 3.0 && (
                <div className='flex items-start space-x-2'>
                  <AlertTriangle className='mt-0.5 h-4 w-4 text-yellow-600' />
                  <p className='text-sm text-gray-600'>
                    Body condition needs improvement. Consider nutritional adjustments.
                  </p>
                </div>
              )}
              {analysis.confidenceScore >= 0.8 && (
                <div className='flex items-start space-x-2'>
                  <CheckCircle className='mt-0.5 h-4 w-4 text-green-600' />
                  <p className='text-sm text-gray-600'>
                    High confidence AI analysis. Results are reliable.
                  </p>
                </div>
              )}
              {analysis.confidenceScore < 0.7 && (
                <div className='flex items-start space-x-2'>
                  <AlertTriangle className='mt-0.5 h-4 w-4 text-yellow-600' />
                  <p className='text-sm text-gray-600'>
                    Low confidence analysis. Consider retaking images for better accuracy.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className='rounded-lg bg-blue-50 p-4'>
            <h4 className='mb-2 text-sm font-medium text-blue-900'>Recommendations</h4>
            <div className='space-y-1'>
              {analysis.bodyConditionScore < 3.5 && (
                <p className='text-sm text-blue-700'>• Increase feed quality or quantity</p>
              )}
              {analysis.bodyConditionScore > 4.5 && (
                <p className='text-sm text-blue-700'>• Monitor for over-conditioning risks</p>
              )}
              {analysis.confidenceScore < 0.8 && (
                <p className='text-sm text-blue-700'>• Schedule follow-up vision analysis</p>
              )}
              <p className='text-sm text-blue-700'>• Continue regular body condition monitoring</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm'>
              <RefreshCw className='mr-2 h-4 w-4' />
              New Analysis
            </Button>
            <Button variant='outline' size='sm'>
              <Activity className='mr-2 h-4 w-4' />
              View History
            </Button>
            <Button variant='outline' size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Download Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
