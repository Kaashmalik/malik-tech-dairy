/**
 * API Route: Email Preferences Management
 * GET - Get user's email preferences
 * PUT - Update user's email preferences
 * POST - Initialize default subscriptions for new user
 */

import { NextRequest } from 'next/server';
import { withTenantContext } from '@/lib/api/middleware';
import { EmailSubscriptionService } from '@/lib/emails/subscriptions';
import { successResponse, errorResponse, ValidationError } from '@/lib/api';
import { z } from 'zod';

const updatePreferencesSchema = z.object({
  subscriptions: z.record(z.enum([
    'marketing',
    'product_updates',
    'tips_and_tricks',
    'milk_production_alerts',
    'health_reminders',
    'breeding_alerts',
    'expense_alerts',
    'subscription_renewals',
    'system_notifications',
    'security_alerts',
  ]), z.boolean()).optional(),
  enabled: z.boolean().optional(),
});

export const dynamic = 'force-dynamic';

// GET: Get user's email preferences
export async function GET(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const preferences = await EmailSubscriptionService.getUserPreferences(
        context.userId,
        context.tenantId
      );

      if (!preferences) {
        throw new ValidationError('Failed to fetch email preferences');
      }

      return successResponse(preferences);
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}

// PUT: Update user's email preferences
export async function PUT(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const body = await req.json();
      const validatedData = updatePreferencesSchema.parse(body);

      // Update specific subscriptions
      if (validatedData.subscriptions) {
        const result = await EmailSubscriptionService.updatePreferences(
          context.userId,
          context.tenantId,
          validatedData.subscriptions
        );

        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Update global preference
      if (validatedData.enabled !== undefined) {
        const result = await EmailSubscriptionService.setGlobalEmailPreference(
          context.userId,
          context.tenantId,
          validatedData.enabled
        );

        if (!result.success) {
          throw new Error(result.error);
        }
      }

      // Return updated preferences
      const preferences = await EmailSubscriptionService.getUserPreferences(
        context.userId,
        context.tenantId
      );

      return successResponse({
        message: 'Email preferences updated successfully',
        preferences,
      });
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}

// POST: Initialize default subscriptions for new user
export async function POST(request: NextRequest) {
  return withTenantContext(async (req, context) => {
    try {
      const result = await EmailSubscriptionService.initializeSubscriptions(
        context.userId,
        context.tenantId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to initialize subscriptions');
      }

      return successResponse({
        message: 'Email subscriptions initialized successfully',
      });
    } catch (error) {
      return errorResponse(error);
    }
  })(request);
}
