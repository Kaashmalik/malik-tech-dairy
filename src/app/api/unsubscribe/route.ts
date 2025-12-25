/**
 * API Route: Unsubscribe from Emails
 * POST - Unsubscribe user via token
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmailSubscriptionService } from '@/lib/emails/subscriptions';
import { z } from 'zod';

const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const dynamic = 'force-dynamic';

// POST: Unsubscribe via token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = unsubscribeSchema.parse(body);

    const result = await EmailSubscriptionService.unsubscribeByToken(
      validatedData.token
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from all emails',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Handle unsubscribe via query parameter (for email links)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?error=missing_token`
      );
    }

    const result = await EmailSubscriptionService.unsubscribeByToken(token);

    if (!result.success) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?error=${encodeURIComponent(result.error || 'unknown_error')}`
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?success=true`
    );
  } catch (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?error=server_error`
    );
  }
}