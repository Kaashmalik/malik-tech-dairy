import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { 
  eq, 
  and, 
  or, 
  ilike, 
  gte, 
  lte, 
  desc, 
  asc, 
  sql,
  inArray,
  between
} from 'drizzle-orm';
import { db } from '@/lib/supabase';
import { 
  animals, 
  genetic_profiles,
  health_records,
  breeding_records,
  milk_logs,
  computer_vision_records
} from '@/db/schema';
import { getTenantContext } from '@/lib/tenant/context';
import { z } from 'zod';

// Enhanced query schema for advanced filtering
const enhancedAnimalQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  search: z.string().optional(),
  species: z.string().optional().transform(val => val ? val.split(',') : []),
  breed: z.string().optional().transform(val => val ? val.split(',') : []),
  gender: z.string().optional().transform(val => val ? val.split(',') : []),
  ageMin: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  ageMax: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  healthStatus: z.string().optional().transform(val => val ? val.split(',') : []),
  productionLevel: z.enum(['high', 'medium', 'low']).optional(),
  breedingStatus: z.string().optional().transform(val => val ? val.split(',') : []),
  sortBy: z.enum(['name', 'tag', 'birthDate', 'breed', 'healthScore', 'milkYield']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  addedAfter: z.string().optional().transform(val => val ? new Date(val) : undefined),
  addedBefore: z.string().optional().transform(val => val ? new Date(val) : undefined),
  lastVaccinatedAfter: z.string().optional().transform(val => val ? new Date(val) : undefined),
  lastVaccinatedBefore: z.string().optional().transform(val => val ? new Date(val) : undefined),
  hasGeneticProfile: z.string().optional().transform(val => val === 'true'),
  minHealthScore: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  maxHealthScore: z.string().optional().transform(val => val ? parseInt(val) : undefined),
  minMilkYield: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxMilkYield: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  location: z.string().optional(),
  rfidTag: z.string().optional(),
});

// GET /api/animals/enhanced - Advanced animal listing with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const tenantContext = await getTenantContext(userId);
    if (!tenantContext) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      );
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
      ageMin,
      ageMax,
      healthStatus,
      productionLevel,
      breedingStatus,
      sortBy,
      sortOrder,
      addedAfter,
      addedBefore,
      lastVaccinatedAfter,
      lastVaccinatedBefore,
      hasGeneticProfile,
      minHealthScore,
      maxHealthScore,
      minMilkYield,
      maxMilkYield,
      location,
      rfidTag
    } = query;

    // Build where conditions
    const whereConditions = [
      eq(animals.tenantId, tenantContext.tenantId),
      sql`${animals.deletedAt} IS NULL`
    ];

    // Search functionality
    if (search) {
      whereConditions.push(
        or(
          ilike(animals.name, `%${search}%`),
          ilike(animals.tag, `%${search}%`),
          ilike(animals.breed, `%${search}%`),
          ilike(animals.rfidTag, `%${search}%`)
        )
      );
    }

    // Species filter
    if (species && species.length > 0) {
      whereConditions.push(inArray(animals.species, species as any[]));
    }

    // Breed filter
    if (breed && breed.length > 0) {
      whereConditions.push(inArray(animals.breed, breed));
    }

    // Gender filter
    if (gender && gender.length > 0) {
      whereConditions.push(inArray(animals.gender, gender as any[]));
    }

    // Age range filter
    if (ageMin !== undefined || ageMax !== undefined) {
      const ageCondition = sql`
        EXTRACT(YEAR FROM AGE(${animals.birthDate})) ${ageMin !== undefined ? sql`>= ${ageMin}` : sql``} ${ageMax !== undefined ? sql`AND <= ${ageMax}` : sql``}
      `;
      whereConditions.push(ageCondition);
    }

    // Health status filter
    if (healthStatus && healthStatus.length > 0) {
      whereConditions.push(inArray(animals.healthStatus, healthStatus as any[]));
    }

    // Production level filter (based on recent milk production)
    if (productionLevel) {
      const productionThreshold = productionLevel === 'high' ? 20 : productionLevel === 'medium' ? 10 : 5;
      whereConditions.push(
        sql`EXISTS (
          SELECT 1 FROM ${milkLogs} 
          WHERE ${milkLogs.animalId} = ${animals.id} 
          AND ${milkLogs.date} >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY ${milkLogs.animalId}
          HAVING AVG(${milkLogs.yield}) ${productionLevel === 'high' ? sql`>= ${productionThreshold}` : productionLevel === 'low' ? sql`<= ${productionThreshold}` : sql`BETWEEN ${productionThreshold - 5} AND ${productionThreshold + 5}`}
        )`
      );
    }

    // Breeding status filter
    if (breedingStatus && breedingStatus.length > 0) {
      whereConditions.push(inArray(animals.reproductiveStatus, breedingStatus as any[]));
    }

    // Date range filters
    if (addedAfter) {
      whereConditions.push(gte(animals.createdAt, addedAfter));
    }
    if (addedBefore) {
      whereConditions.push(lte(animals.createdAt, addedBefore));
    }

    // Location filter
    if (location) {
      whereConditions.push(ilike(animals.location, `%${location}%`));
    }

    // RFID tag filter
    if (rfidTag) {
      whereConditions.push(ilike(animals.rfidTag, `%${rfidTag}%`));
    }

    // Genetic profile filter
    if (hasGeneticProfile !== undefined) {
      if (hasGeneticProfile) {
        whereConditions.push(
          sql`EXISTS (
            SELECT 1 FROM ${geneticProfiles} 
            WHERE ${geneticProfiles.animalId} = ${animals.id}
          )`
        );
      } else {
        whereConditions.push(
          sql`NOT EXISTS (
            SELECT 1 FROM ${geneticProfiles} 
            WHERE ${geneticProfiles.animalId} = ${animals.id}
          )`
        );
      }
    }

    // Combine all conditions
    const finalWhereCondition = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'tag':
        orderBy = sortOrder === 'desc' ? desc(animals.tag) : asc(animals.tag);
        break;
      case 'birthDate':
        orderBy = sortOrder === 'desc' ? desc(animals.birthDate) : asc(animals.birthDate);
        break;
      case 'breed':
        orderBy = sortOrder === 'desc' ? desc(animals.breed) : asc(animals.breed);
        break;
      case 'healthScore':
        orderBy = sortOrder === 'desc' ? desc(animals.healthScore) : asc(animals.healthScore);
        break;
      case 'milkYield':
        orderBy = sortOrder === 'desc' 
          ? desc(sql`(SELECT AVG(${milkLogs.yield}) FROM ${milkLogs} WHERE ${milkLogs.animalId} = ${animals.id} AND ${milkLogs.date} >= CURRENT_DATE - INTERVAL '30 days')`)
          : asc(sql`(SELECT AVG(${milkLogs.yield}) FROM ${milkLogs} WHERE ${milkLogs.animalId} = ${animals.id} AND ${milkLogs.date} >= CURRENT_DATE - INTERVAL '30 days')`);
        break;
      default:
        orderBy = sortOrder === 'desc' ? desc(animals.name) : asc(animals.name);
    }

    // Execute main query
    const [animalsData, totalCount] = await Promise.all([
      db
        .select({
          id: animals.id,
          name: animals.name,
          tag: animals.tag,
          species: animals.species,
          breed: animals.breed,
          gender: animals.gender,
          birthDate: animals.birthDate,
          healthStatus: animals.healthStatus,
          healthScore: animals.healthScore,
          reproductiveStatus: animals.reproductiveStatus,
          location: animals.location,
          rfidTag: animals.rfidTag,
          qrCode: animals.qrCode,
          image: animals.image,
          weight: animals.weight,
          height: animals.height,
          createdAt: animals.createdAt,
          updatedAt: animals.updatedAt,
          // Enhanced fields from related tables
          geneticProfile: sql<{
            breedScore: number;
            milkYieldPotential: number;
            geneticValueIndex: number;
          }>`(
            `JSON_BUILD_OBJECT(
              'breedScore', ${geneticProfiles.breedScore},
              'milkYieldPotential', ${geneticProfiles.milkYieldPotential},
              'geneticValueIndex', ${geneticProfiles.geneticValueIndex}
            )`
          ),
          averageMilkYield: sql<number>`(
            SELECT COALESCE(AVG(${milkLogs.yield}), 0) 
            FROM ${milkLogs} 
            WHERE ${milkLogs.animalId} = ${animals.id} 
            AND ${milkLogs.date} >= CURRENT_DATE - INTERVAL '30 days'
          )`.as('averageMilkYield'),
          lastVaccinationDate: sql<Date>`(
            SELECT MAX(${healthRecords.date})
            FROM ${healthRecords}
            WHERE ${healthRecords.animalId} = ${animals.id}
            AND ${healthRecords.type} = 'vaccination'
          )`.as('lastVaccinationDate'),
          lastHealthCheck: sql<Date>`(
            SELECT MAX(${healthRecords.date})
            FROM ${healthRecords}
            WHERE ${healthRecords.animalId} = ${animals.id}
            AND ${healthRecords.type} = 'checkup'
          )`.as('lastHealthCheck'),
          latestVisionAnalysis: sql<{
            bodyConditionScore: number;
            confidenceScore: number;
            analysisDate: Date;
          }>`(
            `JSON_BUILD_OBJECT(
              'bodyConditionScore', ${computer_vision_records.bodyConditionScore},
              'confidenceScore', ${computer_vision_records.confidenceScore},
              'analysisDate', ${computer_vision_records.createdAt}
            )`
          ),
        })
        .from(animals)
        .leftJoin(genetic_profiles, eq(animals.id, genetic_profiles.animal_id))
        .where(finalWhereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset((page - 1) * limit),

      db
        .select({ count: sql<number>`count(*)` })
        .from(animals)
        .where(finalWhereCondition)
        .then(result => result[0]?.count || 0)
    ]);

    // Apply additional filters that need computed values
    let filteredAnimals = animalsData;

    if (minHealthScore !== undefined) {
      filteredAnimals = filteredAnimals.filter(animal => 
        animal.healthScore >= minHealthScore!
      );
    }

    if (maxHealthScore !== undefined) {
      filteredAnimals = filteredAnimals.filter(animal => 
        animal.healthScore <= maxHealthScore!
      );
    }

    if (minMilkYield !== undefined) {
      filteredAnimals = filteredAnimals.filter(animal => 
        Number(animal.averageMilkYield) >= minMilkYield!
      );
    }

    if (maxMilkYield !== undefined) {
      filteredAnimals = filteredAnimals.filter(animal => 
        Number(animal.averageMilkYield) <= maxMilkYield!
      );
    }

    // Apply last vaccination date filters
    if (lastVaccinatedAfter || lastVaccinatedBefore) {
      filteredAnimals = filteredAnimals.filter(animal => {
        if (!animal.lastVaccinationDate) return false;
        
        if (lastVaccinatedAfter && animal.lastVaccinationDate < lastVaccinatedAfter) {
          return false;
        }
        
        if (lastVaccinatedBefore && animal.lastVaccinationDate > lastVaccinatedBefore) {
          return false;
        }
        
        return true;
      });
    }

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        animals: filteredAnimals,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPreviousPage
        },
        filters: {
          applied: {
            search,
            species,
            breed,
            gender,
            ageRange: ageMin !== undefined || ageMax !== undefined ? { min: ageMin, max: ageMax } : undefined,
            healthStatus,
            productionLevel,
            breedingStatus,
            sortBy,
            sortOrder,
            dateRanges: {
              addedBetween: addedAfter && addedBefore ? [addedAfter, addedBefore] : undefined,
              lastVaccinatedBetween: lastVaccinatedAfter && lastVaccinatedBefore ? [lastVaccinatedAfter, lastVaccinatedBefore] : undefined
            },
            hasGeneticProfile,
            performance: {
              minHealthScore,
              maxHealthScore,
              minMilkYield,
              maxMilkYield
            },
            location,
            rfidTag
          },
          available: {
            species: await getDistinctValues('species', tenantContext.tenantId),
            breeds: await getDistinctValues('breed', tenantContext.tenantId),
            healthStatuses: await getDistinctValues('health_status', tenantContext.tenantId),
            breedingStatuses: await getDistinctValues('reproductive_status', tenantContext.tenantId),
            locations: await getDistinctValues('location', tenantContext.tenantId)
          }
        }
      },
      message: `Found ${filteredAnimals.length} animals`
    });

  } catch (error) {
    console.error('Enhanced animals GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch animals', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to get distinct values for filters
async function getDistinctValues(column: string, tenantId: string): Promise<string[]> {
  try {
    const result = await db
      .select({ value: sql<string>`DISTINCT ${sql.raw(column)}` })
      .from(animals)
      .where(and(
        eq(animals.tenantId, tenantId),
        sql`${sql.raw(column)} IS NOT NULL`,
        sql`${sql.raw(column)} != ''`
      ))
      .orderBy(asc(sql.raw(column)));
    
    return result.map(row => row.value).filter(Boolean);
  } catch (error) {
    console.error(`Error getting distinct values for ${column}:`, error);
    return [];
  }
}
