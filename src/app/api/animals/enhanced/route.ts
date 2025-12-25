import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSupabaseClient } from '@/lib/supabase';
import { getTenantContext } from '@/lib/tenant/context';
import { z } from 'zod';
// Enhanced query schema for advanced filtering
const enhancedAnimalQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 20)),
  search: z.string().optional(),
  species: z
    .string()
    .optional()
    .transform(val => (val ? val.split(',') : [])),
  breed: z
    .string()
    .optional()
    .transform(val => (val ? val.split(',') : [])),
  gender: z
    .string()
    .optional()
    .transform(val => (val ? val.split(',') : [])),
  status: z
    .string()
    .optional()
    .transform(val => (val ? val.split(',') : [])),
  sortBy: z.enum(['name', 'tag', 'date_of_birth', 'breed', 'created_at']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  addedAfter: z.string().optional(),
  addedBefore: z.string().optional(),
});
// Define animal type for response
interface AnimalRecord {
  id: string;
  tenant_id: string;
  tag: string;
  name: string | null;
  species: string;
  breed: string | null;
  date_of_birth: string | null;
  gender: string;
  photo_url: string | null;
  status: string;
  weight: number | null;
  color: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
// GET /api/animals/enhanced - Advanced animal listing with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const tenantContext = await getTenantContext(userId);
    if (!tenantContext) {
      return NextResponse.json({ success: false, error: 'Tenant not found' }, { status: 404 });
    }
    const { searchParams } = new URL(request.url);
    const query = enhancedAnimalQuerySchema.parse(Object.fromEntries(searchParams));
    const {
      page,
      limit,
      search,
      species,
      breed,
      gender,
      status,
      sortBy,
      sortOrder,
      addedAfter,
      addedBefore,
    } = query;
    // Build Supabase query
    const supabase = getSupabaseClient();
    let supabaseQuery = supabase
      .from('animals')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantContext.tenantId);
    // Search functionality - using ilike for case-insensitive search
    if (search) {
      supabaseQuery = supabaseQuery.ilike('tag', `%${search}%`);
    }
    // Species filter
    if (species && species.length > 0) {
      supabaseQuery = supabaseQuery.in('species', species);
    }
    // Breed filter
    if (breed && breed.length > 0) {
      supabaseQuery = supabaseQuery.in('breed', breed);
    }
    // Gender filter
    if (gender && gender.length > 0) {
      supabaseQuery = supabaseQuery.in('gender', gender);
    }
    // Status filter
    if (status && status.length > 0) {
      supabaseQuery = supabaseQuery.in('status', status);
    }
    // Date range filters
    if (addedAfter) {
      supabaseQuery = supabaseQuery.gte('created_at', addedAfter);
    }
    if (addedBefore) {
      supabaseQuery = supabaseQuery.lte('created_at', addedBefore);
    }
    // Sorting
    const ascending = sortOrder === 'asc';
    supabaseQuery = supabaseQuery.order(sortBy, { ascending });
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    supabaseQuery = supabaseQuery.range(from, to);
    // Execute query
    const { data: animalsData, count, error } = await supabaseQuery;
    if (error) {
      return NextResponse.json(
        { success: false, error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;
    // Get available filter values
    const availableFilters = await getAvailableFilters(tenantContext.tenantId);
    return NextResponse.json({
      success: true,
      data: {
        animals: animalsData as AnimalRecord[],
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPreviousPage,
        },
        filters: {
          applied: {
            search,
            species,
            breed,
            gender,
            status,
            sortBy,
            sortOrder,
            dateRanges: {
              addedAfter,
              addedBefore,
            },
          },
          available: availableFilters,
        },
      },
      message: `Found ${animalsData?.length || 0} animals`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch animals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
// Helper function to get available filter values
async function getAvailableFilters(tenantId: string) {
  try {
    const supabase = getSupabaseClient();
    const [speciesResult, breedsResult, statusResult] = await Promise.all([
      supabase
        .from('animals')
        .select('species')
        .eq('tenant_id', tenantId)
        .not('species', 'is', null),
      supabase.from('animals').select('breed').eq('tenant_id', tenantId).not('breed', 'is', null),
      supabase.from('animals').select('status').eq('tenant_id', tenantId).not('status', 'is', null),
    ]);
    // Extract unique values
    const species = [
      ...new Set((speciesResult.data || []).map((r: { species: string }) => r.species)),
    ].filter(Boolean);
    const breeds = [
      ...new Set((breedsResult.data || []).map((r: { breed: string }) => r.breed)),
    ].filter(Boolean);
    const statuses = [
      ...new Set((statusResult.data || []).map((r: { status: string }) => r.status)),
    ].filter(Boolean);
    return {
      species,
      breeds,
      statuses,
      genders: ['male', 'female'],
    };
  } catch (error) {
    return {
      species: [],
      breeds: [],
      statuses: [],
      genders: ['male', 'female'],
    };
  }
}