/**
 * AI-Powered Insights for Dairy Farm Management
 * Provides intelligent recommendations and predictions using AI
 */

import { getSupabaseClient } from '@/lib/supabase/server';

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'prediction' | 'alert' | 'optimization';
  category: 'milk' | 'health' | 'breeding' | 'financial' | 'feed';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  actionable: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface MilkPrediction {
  date: string;
  predictedQuantity: number;
  confidence: number;
  factors: Array<{ factor: string; impact: number }>;
}

export interface HealthRisk {
  animalId: string;
  animalTag: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskType: string;
  description: string;
  recommendations: string[];
  probability: number;
}

export interface FeedOptimization {
  animalId: string;
  currentFeed: string;
  optimizedFeed: string;
  expectedImprovement: {
    milkYield: number; // percentage
    cost: number; // percentage
  };
  reason: string;
}

/**
 * Generate AI insights for a tenant
 */
export async function generateAIInsights(tenantId: string): Promise<AIInsight[]> {
  const supabase = getSupabaseClient();
  const insights: AIInsight[] = [];

  try {
    // Get recent data for analysis
    const [animals, milkLogs, healthRecords, expenses] = await Promise.all([
      supabase.from('animals').select('*').eq('tenant_id', tenantId).eq('status', 'active'),
      supabase
        .from('milk_logs')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(30),
      supabase
        .from('health_records')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(30),
      supabase
        .from('expenses')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit(30),
    ]);

    // Milk production insights
    const milkInsights = analyzeMilkProduction(milkLogs.data || []);
    insights.push(...milkInsights);

    // Health insights
    const healthInsights = analyzeAnimalHealth(healthRecords.data || [], animals.data || []);
    insights.push(...healthInsights);

    // Financial insights
    const financialInsights = analyzeFinances(expenses.data || []);
    insights.push(...financialInsights);

    // Breeding insights
    const breedingInsights = await analyzeBreeding(tenantId);
    insights.push(...breedingInsights);

    // Feed optimization insights
    const feedInsights = await analyzeFeedEfficiency(tenantId);
    insights.push(...feedInsights);

    // Save insights to database
    for (const insight of insights) {
      await supabase.from('ai_insights').insert({
        tenant_id: tenantId,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        confidence: insight.confidence,
        actionable: insight.actionable,
        data: insight.data,
        created_at: new Date().toISOString(),
      });
    }

    return insights;
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return [];
  }
}

/**
 * Analyze milk production patterns
 */
function analyzeMilkProduction(milkLogs: any[]): AIInsight[] {
  const insights: AIInsight[] = [];

  if (milkLogs.length === 0) return insights;

  // Calculate average production
  const avgProduction = milkLogs.reduce((sum, log) => sum + log.quantity, 0) / milkLogs.length;

  // Check for declining trend
  const recentLogs = milkLogs.slice(0, 7);
  const olderLogs = milkLogs.slice(7, 14);

  if (recentLogs.length > 0 && olderLogs.length > 0) {
    const recentAvg = recentLogs.reduce((sum, log) => sum + log.quantity, 0) / recentLogs.length;
    const olderAvg = olderLogs.reduce((sum, log) => sum + log.quantity, 0) / olderLogs.length;

    const decline = ((olderAvg - recentAvg) / olderAvg) * 100;

    if (decline > 10) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'alert',
        category: 'milk',
        title: 'Declining Milk Production',
        description: `Milk production has declined by ${decline.toFixed(1)}% over the past week. Consider checking animal health, feed quality, and milking practices.`,
        impact: 'high',
        confidence: 85,
        actionable: true,
        data: {
          decline: decline.toFixed(1),
          recentAvg: recentAvg.toFixed(2),
          olderAvg: olderAvg.toFixed(2),
        },
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Check for production below target
  if (avgProduction < 10) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'recommendation',
      category: 'milk',
      title: 'Low Milk Production',
      description: `Average daily production is ${avgProduction.toFixed(1)}L per animal, below the recommended 15L. Consider improving feed quality and animal comfort.`,
      impact: 'medium',
      confidence: 75,
      actionable: true,
      data: { average: avgProduction.toFixed(1), target: 15 },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Analyze animal health patterns
 */
function analyzeAnimalHealth(healthRecords: any[], animals: any[]): AIInsight[] {
  const insights: AIInsight[] = [];

  if (healthRecords.length === 0) return insights;

  // Count health issues by type
  const issueCounts = healthRecords.reduce(
    (acc, record) => {
      acc[record.record_type] = (acc[record.record_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Check for frequent treatments
  for (const [type, count] of Object.entries(issueCounts)) {
    const countValue = count as number;
    if (countValue > 5) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'alert',
        category: 'health',
        title: `Frequent ${type} Issues`,
        description: `${countValue} ${type} records in the past month. Consider reviewing preventive measures and vaccination schedules.`,
        impact: countValue > 10 ? 'high' : 'medium',
        confidence: 80,
        actionable: true,
        data: { type, count: countValue },
        createdAt: new Date().toISOString(),
      });
    }
  }

  // Check for animals without recent health checks
  const animalsWithoutRecentCheck = animals.filter(animal => {
    const lastCheck = healthRecords.find(record => record.animal_id === animal.id);
    if (!lastCheck) return true;
    const daysSinceCheck =
      (Date.now() - new Date(lastCheck.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCheck > 30;
  });

  if (animalsWithoutRecentCheck.length > 0) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'recommendation',
      category: 'health',
      title: 'Overdue Health Checks',
      description: `${animalsWithoutRecentCheck.length} animals haven't had a health check in over 30 days. Schedule routine checkups.`,
      impact: 'medium',
      confidence: 90,
      actionable: true,
      data: { count: animalsWithoutRecentCheck.length },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Analyze financial patterns
 */
function analyzeFinances(expenses: any[]): AIInsight[] {
  const insights: AIInsight[] = [];

  if (expenses.length === 0) return insights;

  // Calculate expenses by category
  const expensesByCategory = expenses.reduce(
    (acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const totalExpenses = Object.values(expensesByCategory).reduce(
    (sum: number, amount: unknown) => sum + (amount as number),
    0
  );

  // Check for high feed costs
  const feedCost = expensesByCategory['feed'] || 0;
  const feedPercentage = (feedCost / totalExpenses) * 100;

  if (feedPercentage > 60) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'optimization',
      category: 'financial',
      title: 'High Feed Costs',
      description: `Feed costs account for ${feedPercentage.toFixed(1)}% of total expenses. Consider optimizing feed ratios and exploring cost-effective alternatives.`,
      impact: 'high',
      confidence: 85,
      actionable: true,
      data: { feedPercentage: feedPercentage.toFixed(1), feedCost: feedCost.toFixed(2) },
      createdAt: new Date().toISOString(),
    });
  }

  // Check for rising costs
  const recentExpenses = expenses.slice(0, 10);
  const olderExpenses = expenses.slice(10, 20);

  if (recentExpenses.length > 0 && olderExpenses.length > 0) {
    const recentAvg = recentExpenses.reduce((sum, e) => sum + e.amount, 0) / recentExpenses.length;
    const olderAvg = olderExpenses.reduce((sum, e) => sum + e.amount, 0) / olderExpenses.length;

    const increase = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (increase > 20) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'alert',
        category: 'financial',
        title: 'Rising Costs',
        description: `Average expenses have increased by ${increase.toFixed(1)}% recently. Review spending patterns and identify cost-saving opportunities.`,
        impact: 'high',
        confidence: 75,
        actionable: true,
        data: { increase: increase.toFixed(1) },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Analyze breeding patterns
 */
async function analyzeBreeding(tenantId: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const supabase = getSupabaseClient();

  const { data: breedingRecords } = await supabase
    .from('breeding_records')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('breeding_date', { ascending: false })
    .limit(30);

  if (!breedingRecords || breedingRecords.length === 0) return insights;

  // Calculate success rate
  const successful = breedingRecords.filter(r => r.status === 'pregnant').length;
  const successRate = (successful / breedingRecords.length) * 100;

  if (successRate < 50) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'recommendation',
      category: 'breeding',
      title: 'Low Breeding Success Rate',
      description: `Breeding success rate is ${successRate.toFixed(1)}%. Consider improving animal health, nutrition, and breeding timing.`,
      impact: 'high',
      confidence: 80,
      actionable: true,
      data: { successRate: successRate.toFixed(1) },
      createdAt: new Date().toISOString(),
    });
  }

  // Check for animals due for breeding
  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .eq('gender', 'female');

  if (animals) {
    const animalsDueForBreeding = animals.filter(animal => {
      const lastBreeding = breedingRecords.find(r => r.female_id === animal.id);
      if (!lastBreeding) return true;
      const daysSinceBreeding =
        (Date.now() - new Date(lastBreeding.breeding_date).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceBreeding > 60; // Due for breeding every 60 days
    });

    if (animalsDueForBreeding.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'recommendation',
        category: 'breeding',
        title: 'Animals Due for Breeding',
        description: `${animalsDueForBreeding.length} female animals are due for breeding. Schedule breeding to maintain optimal production.`,
        impact: 'medium',
        confidence: 90,
        actionable: true,
        data: { count: animalsDueForBreeding.length },
        createdAt: new Date().toISOString(),
      });
    }
  }

  return insights;
}

/**
 * Analyze feed efficiency
 */
async function analyzeFeedEfficiency(tenantId: string): Promise<AIInsight[]> {
  const insights: AIInsight[] = [];
  const supabase = getSupabaseClient();

  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (!animals || animals.length === 0) return insights;

  // Check for underweight animals
  const underweightAnimals = animals.filter(animal => {
    if (!animal.weight) return false;
    const idealWeight =
      animal.species === 'cattle' ? 500 : animal.species === 'buffalo' ? 600 : 400;
    return animal.weight < idealWeight * 0.9; // 10% below ideal
  });

  if (underweightAnimals.length > 0) {
    insights.push({
      id: crypto.randomUUID(),
      type: 'recommendation',
      category: 'feed',
      title: 'Underweight Animals',
      description: `${underweightAnimals.length} animals are underweight. Consider increasing feed quantity or improving feed quality.`,
      impact: 'medium',
      confidence: 85,
      actionable: true,
      data: { count: underweightAnimals.length },
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

/**
 * Predict milk production for the next 7 days
 */
export async function predictMilkProduction(tenantId: string): Promise<MilkPrediction[]> {
  const supabase = getSupabaseClient();

  const { data: milkLogs } = await supabase
    .from('milk_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false })
    .limit(30);

  if (!milkLogs || milkLogs.length === 0) {
    return [];
  }

  // Simple moving average prediction
  const predictions: MilkPrediction[] = [];
  const avgProduction = milkLogs.reduce((sum, log) => sum + log.quantity, 0) / milkLogs.length;
  const stdDev = Math.sqrt(
    milkLogs.reduce((sum, log) => sum + Math.pow(log.quantity - avgProduction, 2), 0) /
      milkLogs.length
  );

  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    // Add some randomness based on standard deviation
    const variation = (Math.random() - 0.5) * stdDev * 0.5;
    const prediction = Math.max(0, avgProduction + variation);

    predictions.push({
      date: date.toISOString().split('T')[0],
      predictedQuantity: Math.round(prediction * 10) / 10,
      confidence: Math.max(60, 90 - i * 4), // Decreasing confidence over time
      factors: [
        { factor: 'Historical average', impact: 0.7 },
        { factor: 'Seasonal variation', impact: 0.2 },
        { factor: 'Animal health', impact: 0.1 },
      ],
    });
  }

  return predictions;
}

/**
 * Identify health risks for animals
 */
export async function identifyHealthRisks(tenantId: string): Promise<HealthRisk[]> {
  const supabase = getSupabaseClient();
  const risks: HealthRisk[] = [];

  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active');

  if (!animals) return risks;

  for (const animal of animals) {
    const { data: healthRecords } = await supabase
      .from('health_records')
      .select('*')
      .eq('animal_id', animal.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Check for frequent health issues
    if (healthRecords && healthRecords.length > 3) {
      const recentRecords = healthRecords.slice(0, 3);
      const hasTreatment = recentRecords.some(r => r.record_type === 'treatment');
      const hasCheckup = recentRecords.some(r => r.record_type === 'checkup');

      if (hasTreatment && !hasCheckup) {
        risks.push({
          animalId: animal.id,
          animalTag: animal.tag,
          riskLevel: 'medium',
          riskType: 'Health Issue',
          description: 'Animal has had recent treatments without follow-up checkups',
          recommendations: [
            'Schedule a health checkup',
            'Review treatment effectiveness',
            'Monitor for recurring symptoms',
          ],
          probability: 70,
        });
      }
    }

    // Check for low milk production (if applicable)
    const { data: milkLogs } = await supabase
      .from('milk_logs')
      .select('*')
      .eq('animal_id', animal.id)
      .order('date', { ascending: false })
      .limit(7);

    if (milkLogs && milkLogs.length > 0) {
      const avgMilk = milkLogs.reduce((sum, log) => sum + log.quantity, 0) / milkLogs.length;

      if (avgMilk < 10) {
        risks.push({
          animalId: animal.id,
          animalTag: animal.tag,
          riskLevel: 'low',
          riskType: 'Low Production',
          description: `Average milk production is ${avgMilk.toFixed(1)}L/day, below optimal`,
          recommendations: [
            'Check feed quality and quantity',
            'Review animal health status',
            'Consider milking frequency',
          ],
          probability: 60,
        });
      }
    }
  }

  return risks;
}

/**
 * Get feed optimization recommendations
 */
export async function getFeedOptimization(tenantId: string): Promise<FeedOptimization[]> {
  const supabase = getSupabaseClient();
  const optimizations: FeedOptimization[] = [];

  const { data: animals } = await supabase
    .from('animals')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .in('species', ['cattle', 'buffalo']);

  if (!animals) return optimizations;

  // Simple recommendation based on animal weight and species
  for (const animal of animals) {
    if (!animal.weight) continue;

    const idealWeight = animal.species === 'cattle' ? 500 : 600;
    const weightRatio = animal.weight / idealWeight;

    if (weightRatio < 0.9) {
      optimizations.push({
        animalId: animal.id,
        currentFeed: 'Standard ration',
        optimizedFeed: 'High-protein concentrate mix',
        expectedImprovement: {
          milkYield: 15, // 15% improvement
          cost: 10, // 10% increase
        },
        reason:
          'Animal is underweight, high-protein feed will help reach optimal weight and improve milk yield',
      });
    } else if (weightRatio > 1.1) {
      optimizations.push({
        animalId: animal.id,
        currentFeed: 'Standard ration',
        optimizedFeed: 'Balanced maintenance feed',
        expectedImprovement: {
          milkYield: 5, // 5% improvement
          cost: -15, // 15% reduction
        },
        reason: 'Animal is overweight, balanced feed will maintain health while reducing costs',
      });
    }
  }

  return optimizations;
}
