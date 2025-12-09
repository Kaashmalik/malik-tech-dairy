'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calculator,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Download,
  BarChart3,
  Target,
  Activity,
  DollarSign,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NutritionOptimizerProps {
  className?: string;
}

interface NutritionPlan {
  id: string;
  name: string;
  animalGroup: string;
  targetProduction: string;
  protein: number;
  energy: number;
  fiber: number;
  costPerDay: number;
  efficiency: number;
  status: 'active' | 'draft' | 'archived';
}

interface Ingredient {
  name: string;
  protein: number;
  energy: number;
  cost: number;
  availability: number;
}

export function NutritionOptimizer({ className }: NutritionOptimizerProps) {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('plans');

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const fetchNutritionData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockPlans: NutritionPlan[] = [
        {
          id: '1',
          name: 'High Production Dairy Mix',
          animalGroup: 'Lactating Cows',
          targetProduction: '30+ L/day',
          protein: 16,
          energy: 2800,
          fiber: 18,
          costPerDay: 450,
          efficiency: 92,
          status: 'active',
        },
        {
          id: '2',
          name: 'Dry Cow Maintenance',
          animalGroup: 'Dry Cows',
          targetProduction: 'Maintenance',
          protein: 12,
          energy: 2200,
          fiber: 25,
          costPerDay: 280,
          efficiency: 88,
          status: 'active',
        },
        {
          id: '3',
          name: 'Heifer Growth Formula',
          animalGroup: 'Heifers',
          targetProduction: 'Growth Phase',
          protein: 14,
          energy: 2400,
          fiber: 22,
          costPerDay: 320,
          efficiency: 85,
          status: 'draft',
        },
      ];

      const mockIngredients: Ingredient[] = [
        { name: 'Alfalfa Hay', protein: 18, energy: 2400, cost: 45, availability: 2500 },
        { name: 'Dairy Concentrate', protein: 22, energy: 3200, cost: 120, availability: 450 },
        { name: 'Soybean Meal', protein: 44, energy: 2800, cost: 85, availability: 1200 },
        { name: 'Corn Silage', protein: 8, energy: 1800, cost: 25, availability: 3000 },
      ];

      setPlans(mockPlans);
      setIngredients(mockIngredients);
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600';
    if (efficiency >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className='flex items-center'>
            <Calculator className='mr-2 h-5 w-5' />
            Nutrition Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='h-64 rounded bg-gray-200'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-gray-900'>Nutrition Optimizer</h2>
          <p className='text-gray-600'>AI-powered feed formulation and cost optimization</p>
        </div>
        <div className='flex items-center space-x-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export Plans
          </Button>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Create Plan
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Active Plans</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {plans.filter(p => p.status === 'active').length}
                </p>
              </div>
              <Target className='h-8 w-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Avg Daily Cost</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {formatCurrency(
                    Math.round(plans.reduce((sum, p) => sum + p.costPerDay, 0) / plans.length)
                  )}
                </p>
              </div>
              <DollarSign className='h-8 w-8 text-green-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Efficiency Score</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {Math.round(plans.reduce((sum, p) => sum + p.efficiency, 0) / plans.length)}%
                </p>
              </div>
              <TrendingUp className='h-8 w-8 text-purple-600' />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Available Ingredients</p>
                <p className='text-2xl font-bold text-gray-900'>{ingredients.length}</p>
              </div>
              <BarChart3 className='h-8 w-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='plans'>Nutrition Plans</TabsTrigger>
          <TabsTrigger value='ingredients'>Ingredients</TabsTrigger>
          <TabsTrigger value='optimizer'>AI Optimizer</TabsTrigger>
        </TabsList>

        <TabsContent value='plans' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Active Nutrition Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {plans.map(plan => (
                  <div key={plan.id} className='rounded-lg border p-4'>
                    <div className='mb-3 flex items-center justify-between'>
                      <div>
                        <h4 className='font-medium text-gray-900'>{plan.name}</h4>
                        <p className='text-sm text-gray-600'>
                          {plan.animalGroup} • {plan.targetProduction}
                        </p>
                      </div>
                      <Badge className={getStatusColor(plan.status)}>{plan.status}</Badge>
                    </div>

                    <div className='mb-3 grid grid-cols-2 gap-4 md:grid-cols-4'>
                      <div>
                        <p className='text-xs text-gray-500'>Protein</p>
                        <p className='text-sm font-medium'>{plan.protein}%</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Energy</p>
                        <p className='text-sm font-medium'>{plan.energy} kcal/kg</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Fiber</p>
                        <p className='text-sm font-medium'>{plan.fiber}%</p>
                      </div>
                      <div>
                        <p className='text-xs text-gray-500'>Daily Cost</p>
                        <p className='text-sm font-medium'>{formatCurrency(plan.costPerDay)}</p>
                      </div>
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-gray-500'>Efficiency:</span>
                        <span
                          className={cn('text-sm font-bold', getEfficiencyColor(plan.efficiency))}
                        >
                          {plan.efficiency}%
                        </span>
                        <Progress value={plan.efficiency} className='h-2 w-20' />
                      </div>
                      <div className='flex items-center space-x-2'>
                        <Button variant='outline' size='sm'>
                          Edit
                        </Button>
                        <Button variant='outline' size='sm'>
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='ingredients' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Available Ingredients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className='rounded-lg border p-4'>
                    <h4 className='mb-2 font-medium text-gray-900'>{ingredient.name}</h4>
                    <div className='grid grid-cols-2 gap-2 text-sm'>
                      <div>
                        <span className='text-gray-500'>Protein:</span>
                        <span className='ml-2 font-medium'>{ingredient.protein}%</span>
                      </div>
                      <div>
                        <span className='text-gray-500'>Energy:</span>
                        <span className='ml-2 font-medium'>{ingredient.energy} kcal</span>
                      </div>
                      <div>
                        <span className='text-gray-500'>Cost:</span>
                        <span className='ml-2 font-medium'>
                          {formatCurrency(ingredient.cost)}/kg
                        </span>
                      </div>
                      <div>
                        <span className='text-gray-500'>Available:</span>
                        <span className='ml-2 font-medium'>{ingredient.availability} kg</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='optimizer' className='space-y-4'>
          <Card>
            <CardContent className='p-6'>
              <div className='text-center'>
                <Calculator className='mx-auto mb-4 h-12 w-12 text-blue-600' />
                <h3 className='mb-2 text-lg font-semibold'>AI Nutrition Optimizer</h3>
                <p className='mb-4 text-gray-600'>
                  Advanced optimization algorithm will create nutritionally balanced feed
                  formulations while minimizing costs based on available ingredients and animal
                  requirements.
                </p>
                <Button className='mb-4'>
                  <Activity className='mr-2 h-4 w-4' />
                  Run Optimization
                </Button>
                <div className='rounded bg-gray-50 p-4 text-left'>
                  <h4 className='mb-2 font-medium'>Optimization Parameters:</h4>
                  <div className='space-y-2 text-sm'>
                    <div className='flex justify-between'>
                      <span>Target Production:</span>
                      <span>30+ L/day</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Cost Constraint:</span>
                      <span>Max PKR 500/day</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Protein Range:</span>
                      <span>15-18%</span>
                    </div>
                    <div className='flex justify-between'>
                      <span>Energy Range:</span>
                      <span>2600-3000 kcal/kg</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
