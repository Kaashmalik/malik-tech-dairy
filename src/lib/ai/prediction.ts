import { generateText } from 'ai';
import { groq, GROQ_MODEL } from './groq';
import { getSupabaseClient } from '@/lib/supabase';
export interface MilkPredictionInput {
  animalId: string;
  daysOfData?: number; // Default to 30 days
  includeFactors?: boolean; // Include health, breeding, weather factors
}
export interface MilkPredictionOutput {
  predictedYield: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: {
    health: string;
    nutrition: string;
    environmental: string;
  };
  recommendations: string[];
  insights: string[];
}
export async function getMilkPrediction(input: MilkPredictionInput): Promise<MilkPredictionOutput> {
  // Check if Groq API key is configured
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return {
      predictedYield: 0,
      confidence: 0,
      trend: 'stable',
      factors: {
        health: 'AI service not configured',
        nutrition: 'AI service not configured',
        environmental: 'AI service not configured',
      },
      recommendations: [
        'Please configure Groq API key to enable AI predictions',
        'Check the setup guide at /docs/AI_PREDICTION_SETUP.md',
      ],
      insights: [
        'AI predictions require Groq API key configuration',
        'Free tier available at https://console.groq.com',
      ],
    };
  }
  try {
    const supabase = getSupabaseClient();
    const { animalId, daysOfData = 30, includeFactors = true } = input;
    // Fetch animal's recent milk data
    const { data: milkLogs, error: milkError } = (await supabase
      .from('milk_logs')
      .select('*')
      .eq('animal_id', animalId)
      .order('date', { ascending: false })
      .limit(daysOfData)) as { data: any[]; error: any };
    if (milkError || !milkLogs || milkLogs.length === 0) {
      throw new Error('No milk data available for prediction');
    }
    // Fetch animal details
    const { data: animal, error: animalError } = (await supabase
      .from('animals')
      .select('*')
      .eq('id', animalId)
      .single()) as { data: any; error: any };
    if (animalError || !animal) {
      throw new Error('Animal not found');
    }
    // Prepare data for AI analysis
    const recentData = milkLogs.slice(0, 7).map(log => ({
      date: log.date,
      yield: log.morning_yield + log.evening_yield,
      morning: log.morning_yield,
      evening: log.evening_yield,
    }));
    const averageYield = recentData.reduce((sum, d) => sum + d.yield, 0) / recentData.length;
    const trend = calculateTrend(recentData);
    // Build prompt for AI
    const prompt = buildPredictionPrompt({
      animal,
      milkData: recentData,
      averageYield,
      trend,
      includeFactors,
    });
    // Generate AI prediction
    const { text } = await generateText({
      model: groq(GROQ_MODEL),
      prompt,
      temperature: 0.3,
    });
    // Parse AI response
    const prediction = parsePredictionResponse(text, averageYield, trend);
    return prediction;
  } catch (error) {
    // Return fallback prediction
    return {
      predictedYield: 0,
      confidence: 0,
      trend: 'stable',
      factors: {
        health: 'Unable to analyze',
        nutrition: 'Unable to analyze',
        environmental: 'Unable to analyze',
      },
      recommendations: ['Please check back later'],
      insights: ['AI prediction service temporarily unavailable'],
    };
  }
}
function calculateTrend(data: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 3) return 'stable';
  const recent = data.slice(0, 3).reduce((sum, d) => sum + d.yield, 0) / 3;
  const older = data.slice(3, 6).reduce((sum, d) => sum + d.yield, 0) / 3;
  // Handle case where older average is 0 to avoid division by zero
  if (older === 0) return 'stable';
  const diff = ((recent - older) / older) * 100;
  if (diff > 5) return 'increasing';
  if (diff < -5) return 'decreasing';
  return 'stable';
}
function buildPredictionPrompt(data: {
  animal: any;
  milkData: any[];
  averageYield: number;
  trend: string;
  includeFactors: boolean;
}): string {
  const { animal, milkData, averageYield, trend, includeFactors } = data;
  return `As a dairy farm AI assistant, analyze the following milk production data and provide predictions.
Animal Details:
- Tag: ${animal.tag}
- Species: ${animal.species}
- Breed: ${animal.breed}
- Age: ${animal.age || 'Unknown'}
- Lactation Stage: ${animal.lactation_stage || 'Unknown'}
Recent Milk Production (Last 7 days):
${milkData.map(d => `- ${d.date}: ${d.yield}L (Morning: ${d.morning}L, Evening: ${d.evening}L)`).join('\n')}
Current Average: ${averageYield.toFixed(1)}L per day
Trend: ${trend}
Please provide a JSON response with:
1. predictedYield: Expected yield for tomorrow in liters (number)
2. confidence: Confidence level 0-100 (number)
3. trend: "increasing", "decreasing", or "stable"
4. factors: Object with health, nutrition, environmental insights
5. recommendations: Array of 2-3 actionable recommendations
6. insights: Array of 2-3 key insights
Consider factors like:
- Recent production patterns
- Typical yield for this breed/species
- Lactation stage effects
- Seasonal variations
Respond with valid JSON only, no explanations.`;
}
function parsePredictionResponse(
  text: string,
  averageYield: number,
  currentTrend: 'increasing' | 'decreasing' | 'stable'
): MilkPredictionOutput {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(text);
    return {
      predictedYield: Number(parsed.predictedYield) || averageYield,
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
      trend: parsed.trend || currentTrend,
      factors: {
        health: parsed.factors?.health || 'Normal health status',
        nutrition: parsed.factors?.nutrition || 'Standard nutrition',
        environmental: parsed.factors?.environmental || 'Normal conditions',
      },
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : ['Monitor production closely'],
      insights: Array.isArray(parsed.insights)
        ? parsed.insights
        : ['Production is within expected range'],
    };
  } catch (error) {
    // Fallback response
    return {
      predictedYield: averageYield,
      confidence: 50,
      trend: currentTrend,
      factors: {
        health: 'Unable to analyze',
        nutrition: 'Unable to analyze',
        environmental: 'Unable to analyze',
      },
      recommendations: ['Monitor production closely'],
      insights: ['AI analysis temporarily unavailable'],
    };
  }
}
// Batch prediction for multiple animals
export async function getBatchMilkPredictions(
  animalIds: string[]
): Promise<Map<string, MilkPredictionOutput>> {
  const results = new Map<string, MilkPredictionOutput>();
  // Process in parallel with a small delay to avoid rate limits
  const promises = animalIds.map(async (id, index) => {
    // Add small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100 * index));
    try {
      const prediction = await getMilkPrediction({ animalId: id });
      results.set(id, prediction);
    } catch (error) {
      // Set empty result for failed predictions
      results.set(id, {
        predictedYield: 0,
        confidence: 0,
        trend: 'stable',
        factors: { health: '', nutrition: '', environmental: '' },
        recommendations: [],
        insights: [],
      });
    }
  });
  await Promise.all(promises);
  return results;
}