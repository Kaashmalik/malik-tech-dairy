import { NextRequest, NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { z } from 'zod';
import { AnimalService } from '@/lib/services/animals/animal.service';

export const dynamic = 'force-dynamic';

const updateAnimalSchema = z.object({
  tag: z.string().min(1, 'Tag is required').max(50).optional(),
  name: z.string().max(100).optional(),
  species: z.enum(['cow', 'buffalo', 'cattle', 'goat', 'sheep', 'chicken', 'horse', 'poultry', 'other']).optional(),
  breed: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  photoUrl: z.string().optional(),
  status: z.enum(['active', 'sold', 'deceased', 'quarantine']).optional(),
  weight: z.number().min(0).max(2500).optional(),
  color: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  motherId: z.string().optional(),
  fatherId: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchasePrice: z.number().min(0).optional(),
});

// GET: Get animal by ID (with profile & summary stats)
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const profile = await AnimalService.getAnimalProfile(context, id);

      if (!profile) {
        return NextResponse.json({ success: false, error: 'Animal not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        animal: profile.animal, // backwards compatibility
        data: profile,
      });
    } catch (error) {
      console.error('Error fetching animal:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// PUT: Update animal
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const validatedData = updateAnimalSchema.parse(body);

      const updated = await AnimalService.updateAnimal(context, id, validatedData);

      return NextResponse.json({
        success: true,
        animal: updated,
        data: { animal: updated },
        message: 'Animal updated successfully',
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { success: false, error: 'Validation error', details: error.errors },
          { status: 400 }
        );
      }

      const message = error.message || '';
      if (message.startsWith('NOT_FOUND')) {
        return NextResponse.json({ success: false, error: message }, { status: 404 });
      }
      if (message.startsWith('DUPLICATE_TAG')) {
        return NextResponse.json({ success: false, error: message }, { status: 409 });
      }

      console.error('Error updating animal:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}

// DELETE: Soft-archive animal (preserves historical milk, health, and breeding data)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withTenantContext(async (req, context) => {
    try {
      if (context.userRole !== 'farm_owner' && context.userRole !== 'super_admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Only farm owners can delete or deactivate animals' },
          { status: 403 }
        );
      }

      const { id } = await params;
      const archived = await AnimalService.archiveAnimal(context, id, 'deceased');

      return NextResponse.json({
        success: true,
        message: 'Animal deactivated successfully',
        data: { animal: archived },
      });
    } catch (error: any) {
      const message = error.message || '';
      if (message.startsWith('NOT_FOUND')) {
        return NextResponse.json({ success: false, error: message }, { status: 404 });
      }

      console.error('Error deactivating animal:', error);
      return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
  })(request);
}
