// API Route: Pregnancy Checks CRUD
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { createApiResponse, createApiError } from '@/lib/supabase/types';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

// =============================================================================
// GET: List pregnancy checks
// =============================================================================
export async function GET(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const { searchParams } = new URL(req.url);
            const breedingRecordId = searchParams.get('breedingRecordId');
            const animalId = searchParams.get('animalId');
            const result = searchParams.get('result');

            let query = supabase
                .from('pregnancy_checks')
                .select('*')
                .eq('tenant_id', context.tenantId)
                .order('check_date', { ascending: false })
                .limit(100);

            if (breedingRecordId) {
                query = query.eq('breeding_record_id', breedingRecordId);
            }
            if (animalId) {
                query = query.eq('animal_id', animalId);
            }
            if (result) {
                query = query.eq('result', result);
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: checks, error } = await query as { data: any[] | null; error: any };

            if (error) {
                console.error('Error fetching pregnancy checks:', error);
                return NextResponse.json(createApiError('Failed to fetch pregnancy checks', 'FETCH_ERROR'), { status: 500 });
            }

            // Transform to camelCase
            const transformedChecks = (checks || []).map((check) => ({
                id: check.id,
                tenantId: check.tenant_id,
                breedingRecordId: check.breeding_record_id,
                animalId: check.animal_id,
                checkDate: check.check_date,
                checkMethod: check.check_method,
                result: check.result,
                vetName: check.vet_name,
                notes: check.notes,
                cost: check.cost,
                createdAt: check.created_at,
                updatedAt: check.updated_at,
            }));

            return NextResponse.json(createApiResponse(transformedChecks));
        } catch (error) {
            console.error('Error in pregnancy checks GET:', error);
            return NextResponse.json(
                { success: false, error: 'Internal server error' },
                { status: 500 }
            );
        }
    })(request);
}

// =============================================================================
// POST: Create pregnancy check
// =============================================================================
export async function POST(request: NextRequest) {
    return withTenantContext(async (req, context) => {
        try {
            const supabase = getSupabaseClient();
            const body = await req.json();

            const {
                breedingRecordId,
                animalId,
                checkDate,
                checkMethod,
                result,
                vetName,
                notes,
                cost,
            } = body;

            // Validation
            if (!breedingRecordId || !animalId || !checkDate || !checkMethod || !result) {
                return NextResponse.json(
                    { success: false, error: 'Missing required fields: breedingRecordId, animalId, checkDate, checkMethod, result' },
                    { status: 400 }
                );
            }

            // Validate checkMethod
            const validMethods = ['ultrasound', 'blood_test', 'rectal_palpation', 'behavioral'];
            if (!validMethods.includes(checkMethod)) {
                return NextResponse.json(
                    { success: false, error: `Invalid checkMethod. Must be one of: ${validMethods.join(', ')}` },
                    { status: 400 }
                );
            }

            // Validate result
            const validResults = ['positive', 'negative', 'inconclusive'];
            if (!validResults.includes(result)) {
                return NextResponse.json(
                    { success: false, error: `Invalid result. Must be one of: ${validResults.join(', ')}` },
                    { status: 400 }
                );
            }

            // Verify breeding record exists
            const { data: breedingRecord, error: breedingError } = await supabase
                .from('breeding_records')
                .select('id, status')
                .eq('id', breedingRecordId)
                .eq('tenant_id', context.tenantId)
                .single();

            if (breedingError || !breedingRecord) {
                return NextResponse.json(
                    { success: false, error: 'Breeding record not found' },
                    { status: 404 }
                );
            }

            const now = new Date().toISOString();
            const checkId = uuidv4();

            const checkData = {
                id: checkId,
                tenant_id: context.tenantId,
                breeding_record_id: breedingRecordId,
                animal_id: animalId,
                check_date: new Date(checkDate).toISOString(),
                check_method: checkMethod,
                result: result,
                vet_name: vetName || null,
                notes: notes || null,
                cost: cost ? parseFloat(cost) : null,
                created_at: now,
                updated_at: now,
            };

            // Insert pregnancy check
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: newCheck, error } = await (supabase.from('pregnancy_checks') as any)
                .insert(checkData)
                .select()
                .single();

            if (error) {
                console.error('Database error creating pregnancy check:', error);
                return NextResponse.json(
                    { success: false, error: 'Failed to create pregnancy check', details: error.message },
                    { status: 500 }
                );
            }

            // Auto-update breeding record based on result (trigger handles this, but we do it here too for immediate response)
            let updatedStatus = breedingRecord.status;
            if (result === 'positive') {
                updatedStatus = 'pregnant';
                await supabase
                    .from('breeding_records')
                    .update({
                        pregnancy_confirmed: true,
                        pregnancy_confirmed_date: checkData.check_date,
                        pregnancy_check_method: checkMethod,
                        status: 'pregnant',
                        updated_at: now,
                    })
                    .eq('id', breedingRecordId);
            } else if (result === 'negative') {
                updatedStatus = 'not_pregnant';
                await supabase
                    .from('breeding_records')
                    .update({
                        status: 'not_pregnant',
                        updated_at: now,
                    })
                    .eq('id', breedingRecordId);
            }

            // Transform response
            const response = {
                id: newCheck?.id,
                tenantId: newCheck?.tenant_id,
                breedingRecordId: newCheck?.breeding_record_id,
                animalId: newCheck?.animal_id,
                checkDate: newCheck?.check_date,
                checkMethod: newCheck?.check_method,
                result: newCheck?.result,
                vetName: newCheck?.vet_name,
                notes: newCheck?.notes,
                cost: newCheck?.cost,
                createdAt: newCheck?.created_at,
            };

            return NextResponse.json({
                success: true,
                check: response,
                breedingRecordStatus: updatedStatus,
                message: result === 'positive'
                    ? 'Pregnancy confirmed! Breeding record updated.'
                    : result === 'negative'
                        ? 'Pregnancy test negative. Breeding record updated.'
                        : 'Pregnancy check recorded. Result inconclusive.',
            });
        } catch (error) {
            console.error('Error creating pregnancy check:', error);
            return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
        }
    })(request);
}
