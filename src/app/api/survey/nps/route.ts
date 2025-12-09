// API Route: NPS Survey Submission
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { adminDb } from '@/lib/firebase/admin';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const npsSchema = z.object({
  score: z.number().int().min(0).max(10),
  feedback: z.string().max(500).optional(),
});

// POST: Submit NPS survey
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = npsSchema.parse(body);

    // Store NPS response
    if (adminDb && orgId) {
      await adminDb
        .collection('tenants')
        .doc(orgId)
        .collection('nps_surveys')
        .add({
          userId,
          tenantId: orgId,
          score: validated.score,
          feedback: validated.feedback || undefined,
          category:
            validated.score >= 9 ? 'promoter' : validated.score >= 7 ? 'passive' : 'detractor',
          createdAt: new Date(),
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting NPS survey:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
