// API Route: Get, Update, Delete Animal by ID (Supabase-based)
import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { getSupabaseClient } from '@/lib/supabase';
import { Animal, AnimalUpdate, ApiResponse, ApiError, createApiError, createApiResponse } from '@/lib/supabase/types';
export const dynamic = 'force-dynamic';
// GET: Get animal by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: animal, error } = await (supabase.from('animals') as any)
        .select('*')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single() as { data: Animal | null; error: any };
      if (error || !animal) {
        return NextResponse.json(createApiError('Animal not found', 'NOT_FOUND'), { status: 404 });
      }
      // Transform to camelCase for frontend
      const transformedAnimal = {
        id: animal?.id,
        tenantId: animal?.tenant_id,
        tag: animal?.tag,
        name: animal?.name,
        species: animal?.species,
        breed: animal?.breed,
        dateOfBirth: animal?.date_of_birth,
        gender: animal?.gender,
        photoUrl: animal?.photo_url,
        status: animal?.status,
        purchaseDate: animal?.purchase_date,
        purchasePrice: animal?.purchase_price,
        weight: animal?.weight,
        color: animal?.color,
        motherId: animal?.mother_id,
        fatherId: animal?.father_id,
        notes: animal?.notes,
        customFields: animal?.custom_fields,
        createdAt: animal?.created_at,
        updatedAt: animal?.updated_at,
      };
      return NextResponse.json({ success: true, animal: transformedAnimal });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
// PUT: Update animal
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      const body = await req.json();
      // Check if animal exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from('animals') as any)
        .select('id, tag')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
      }
      // Check if tag is being updated and if it conflicts
      if (body.tag && body.tag !== existing?.tag) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: conflictingTag } = await (supabase.from('animals') as any)
          .select('id')
          .eq('tenant_id', context.tenantId)
          .eq('tag', body.tag)
          .neq('id', id)
          .limit(1)
          .single();
        if (conflictingTag) {
          return NextResponse.json(
            { success: false, error: 'Animal with this tag already exists' },
            { status: 409 }
          );
        }
      }
      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        updated_at: now,
      };
      // Map camelCase to snake_case
      if (body.tag !== undefined) updateData.tag = body.tag;
      if (body.name !== undefined) updateData.name = body.name;
      if (body.species !== undefined) updateData.species = body.species;
      if (body.breed !== undefined) updateData.breed = body.breed;
      if (body.dateOfBirth !== undefined) updateData.date_of_birth = body.dateOfBirth;
      if (body.gender !== undefined) updateData.gender = body.gender;
      if (body.photoUrl !== undefined) updateData.photo_url = body.photoUrl;
      if (body.status !== undefined) updateData.status = body.status;
      if (body.purchaseDate !== undefined) updateData.purchase_date = body.purchaseDate;
      if (body.purchasePrice !== undefined) updateData.purchase_price = body.purchasePrice;
      if (body.weight !== undefined) updateData.weight = body.weight;
      if (body.color !== undefined) updateData.color = body.color;
      if (body.notes !== undefined) updateData.notes = body.notes;
      if (body.customFields !== undefined) updateData.custom_fields = body.customFields;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedAnimal, error } = await (supabase.from('animals') as any)
        .update(updateData)
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .select()
        .single();
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to update animal', details: error.message },
          { status: 500 }
        );
      }
      // Transform to camelCase
      const transformedAnimal = {
        id: updatedAnimal?.id,
        tenantId: updatedAnimal?.tenant_id,
        tag: updatedAnimal?.tag,
        name: updatedAnimal?.name,
        species: updatedAnimal?.species,
        breed: updatedAnimal?.breed,
        dateOfBirth: updatedAnimal?.date_of_birth,
        gender: updatedAnimal?.gender,
        photoUrl: updatedAnimal?.photo_url,
        status: updatedAnimal?.status,
        createdAt: updatedAnimal?.created_at,
        updatedAt: updatedAnimal?.updated_at,
      };
      return NextResponse.json({ success: true, animal: transformedAnimal });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
// DELETE: Delete animal (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const supabase = getSupabaseClient();
      // Check if animal exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from('animals') as any)
        .select('id')
        .eq('id', id)
        .eq('tenant_id', context.tenantId)
        .single();
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
      }
      // Soft delete: Update status instead of deleting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('animals') as any)
        .update({
          status: 'deceased',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', context.tenantId);
      if (error) {
        return NextResponse.json(
          { success: false, error: 'Failed to delete animal' },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}