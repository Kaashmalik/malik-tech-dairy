// API Route: List & Create Animals (Supabase-based)
import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { getTenantLimitsFromSupabase, getAnimalCount } from '@/lib/supabase/limits';
import { SUBSCRIPTION_PLANS } from '@/lib/constants';
import { createAnimalSchema } from '@/lib/validations/animals';
import { v4 as uuidv4 } from 'uuid';
import {
  successResponse,
  createdResponse,
  errorResponse,
  ValidationError,
  ConflictError,
  LimitExceededError,
  InternalServerError,
} from '@/lib/api';
import { transformAnimals, transformAnimal, type AnimalFromDb } from '@/lib/utils/transform';
import { PostgrestError } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// GET: List all animals for tenant
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();

      const { data: animals, error } = (await supabase
        .from('animals')
        .select('*')
        .eq('tenant_id', context.tenantId)
        .order('created_at', { ascending: false })) as { data: AnimalFromDb[] | null; error: PostgrestError | null };

      if (error) {
        throw new InternalServerError('Failed to fetch animals', error.message);
      }

      const transformedAnimals = transformAnimals(animals || []);

      return successResponse({ animals: transformedAnimals });
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}

// POST: Create new animal
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const supabase = getSupabaseClient();

      // Check limits using Supabase
      const [limits, currentCount] = await Promise.all([
        getTenantLimitsFromSupabase(context.tenantId),
        getAnimalCount(context.tenantId),
      ]);

      const maxAnimals = limits?.maxAnimals ?? 5;
      const isUnlimited = maxAnimals === -1;

      if (!isUnlimited && currentCount >= maxAnimals) {
        // Find the plan name for better error message
        let planName = 'Free';
        for (const [key, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
          if (plan.maxAnimals === maxAnimals) {
            planName = plan.name;
            break;
          }
        }

        throw new LimitExceededError(
          `You have reached the maximum of ${maxAnimals} animals on your ${planName} plan. Please upgrade to add more animals.`,
          { current: currentCount, limit: maxAnimals, resource: 'animals', upgradeUrl: '/pricing' }
        );
      }

      const body = await req.json();

      // Validate with Zod
      const parseResult = createAnimalSchema.safeParse(body);
      if (!parseResult.success) {
        throw ValidationError.fromZodError(parseResult.error);
      }

      const {
        tag,
        name,
        species,
        breed,
        dateOfBirth,
        gender,
        photoUrl,
        purchaseDate,
        purchasePrice,
        status,
      } = parseResult.data;

      // Check if tag already exists
      const { data: existing, error: checkError } = (await supabase
        .from('animals')
        .select('id')
        .eq('tenant_id', context.tenantId)
        .eq('tag', tag)
        .single()) as { data: { id: string } | null; error: PostgrestError | null };

      if (existing) {
        throw new ConflictError('Animal with this tag already exists');
      }

      const now = new Date().toISOString();
      const animalId = uuidv4();

      const animalData = {
        id: animalId,
        tenant_id: context.tenantId,
        tag,
        name: name || '',
        species,
        breed: breed || '',
        date_of_birth: dateOfBirth || null,
        gender,
        photo_url: photoUrl || null,
        status: status || 'active',
        purchase_date: purchaseDate || null,
        purchase_price: purchasePrice || null,
        created_at: now,
        updated_at: now,
      };

      const { data: newAnimal, error: insertError } = (await supabase
        .from('animals')
        .insert(animalData)
        .select()
        .single()) as { data: AnimalFromDb; error: PostgrestError | null };

      if (insertError) {
        throw new InternalServerError('Failed to create animal', insertError.message);
      }

      return createdResponse(
        { animal: transformAnimal(newAnimal) },
        'Animal created successfully'
      );
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}
