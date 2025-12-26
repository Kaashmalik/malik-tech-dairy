// API Route: Pregnant Animals Dashboard
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { createApiResponse, createApiError } from '@/lib/supabase/types';
import {
    calculateDaysRemaining,
    calculatePregnancyProgress,
    getRecommendedCheckWindow,
    formatDaysRemaining
} from '@/lib/breeding-constants';
import type { AnimalSpecies } from '@/types/database';

export const dynamic = 'force-dynamic';

// =============================================================================
// GET: Get pregnant animals dashboard data
// =============================================================================
export async function GET(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const { searchParams } = new URL(req.url);
            const species = searchParams.get('species');
            const upcomingDays = parseInt(searchParams.get('upcomingDays') || '30');

            // Get all active pregnancy records (confirmed pregnant or recently inseminated)
            let breedingQuery = supabase
                .from('breeding_records')
                .select(`
          *,
          animal:animals!animal_id (
            id,
            tag,
            name,
            species,
            breed,
            photo_url,
            status
          )
        `)
                .eq('tenant_id', context.tenantId)
                .in('status', ['pregnant', 'confirmed', 'inseminated', 'check_pending', 'overdue'])
                .order('expected_due_date', { ascending: true });

            if (species) {
                breedingQuery = breedingQuery.eq('species', species);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: pregnantRecords, error: breedingError } = await breedingQuery as { data: any[] | null; error: any };

            if (breedingError) {
                console.error('Error fetching pregnant animals:', breedingError);
                return NextResponse.json(createApiError('Failed to fetch pregnant animals', 'FETCH_ERROR'), { status: 500 });
            }

            const now = new Date();
            const upcomingCutoff = new Date(now.getTime() + upcomingDays * 24 * 60 * 60 * 1000);

            // Process records
            const pregnantAnimals = (pregnantRecords || []).map((record) => {
                const breedingDate = new Date(record.breeding_date);
                const expectedDueDate = record.expected_due_date ? new Date(record.expected_due_date) : null;
                const animalSpecies = record.species as AnimalSpecies;

                const daysRemaining = expectedDueDate ? calculateDaysRemaining(expectedDueDate) : null;
                const progressPercent = calculatePregnancyProgress(breedingDate, animalSpecies);
                const nextCheckWindow = !record.pregnancy_confirmed
                    ? getRecommendedCheckWindow(breedingDate, animalSpecies)
                    : null;

                // Determine if check is due now
                const needsCheck = nextCheckWindow &&
                    now >= nextCheckWindow.startDate &&
                    now <= nextCheckWindow.endDate &&
                    !record.pregnancy_confirmed;

                return {
                    id: record.id,
                    animal: record.animal ? {
                        id: record.animal.id,
                        tag: record.animal.tag,
                        name: record.animal.name,
                        species: record.animal.species,
                        breed: record.animal.breed,
                        photoUrl: record.animal.photo_url,
                        status: record.animal.status,
                    } : null,
                    breedingRecord: {
                        id: record.id,
                        breedingDate: record.breeding_date,
                        breedingMethod: record.breeding_method,
                        expectedDueDate: record.expected_due_date,
                        gestationDays: record.gestation_days,
                        pregnancyConfirmed: record.pregnancy_confirmed,
                        pregnancyConfirmedDate: record.pregnancy_confirmed_date,
                        status: record.status,
                        sireId: record.sire_id,
                        semenSource: record.semen_source,
                    },
                    daysRemaining,
                    daysRemainingFormatted: daysRemaining !== null ? formatDaysRemaining(daysRemaining) : 'Unknown',
                    progressPercent: Math.round(progressPercent),
                    isOverdue: daysRemaining !== null && daysRemaining < 0,
                    needsCheck,
                    nextCheckDue: nextCheckWindow?.startDate || null,
                    recommendedCheckMethod: nextCheckWindow?.method || null,
                };
            });

            // Categorize animals
            const overdue = pregnantAnimals.filter(a => a.isOverdue);
            const dueThisWeek = pregnantAnimals.filter(a =>
                !a.isOverdue && a.daysRemaining !== null && a.daysRemaining <= 7
            );
            const dueThisMonth = pregnantAnimals.filter(a =>
                !a.isOverdue && a.daysRemaining !== null && a.daysRemaining > 7 && a.daysRemaining <= 30
            );
            const needsCheck = pregnantAnimals.filter(a => a.needsCheck);

            // Count by species
            const countBySpecies: Record<string, number> = {};
            pregnantAnimals.forEach(a => {
                const sp = a.animal?.species || 'unknown';
                countBySpecies[sp] = (countBySpecies[sp] || 0) + 1;
            });

            // Upcoming births (within upcomingDays)
            const upcomingBirths = pregnantAnimals
                .filter(a =>
                    a.daysRemaining !== null &&
                    a.daysRemaining >= 0 &&
                    a.daysRemaining <= upcomingDays &&
                    a.breedingRecord.pregnancyConfirmed
                )
                .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0));

            // Summary stats
            const summary = {
                totalPregnant: pregnantAnimals.length,
                confirmedPregnant: pregnantAnimals.filter(a => a.breedingRecord.pregnancyConfirmed).length,
                awaitingConfirmation: pregnantAnimals.filter(a => !a.breedingRecord.pregnancyConfirmed).length,
                overdueCount: overdue.length,
                dueThisWeekCount: dueThisWeek.length,
                dueThisMonthCount: dueThisMonth.length,
                needsCheckCount: needsCheck.length,
                countBySpecies,
            };

            return NextResponse.json(createApiResponse({
                summary,
                pregnantAnimals,
                overdue,
                dueThisWeek,
                dueThisMonth,
                needsCheck,
                upcomingBirths,
            }));
        } catch (error) {
            console.error('Error in pregnant animals GET:', error);
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        }
    })(request);
}
