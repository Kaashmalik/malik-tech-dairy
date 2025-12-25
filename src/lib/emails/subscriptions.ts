/**
 * Email Subscription Management
 * Manage user email preferences and subscription settings
 */

import { getSupabaseClient } from '@/lib/supabase';

export type EmailSubscriptionType = 
  | 'marketing'
  | 'product_updates'
  | 'tips_and_tricks'
  | 'milk_production_alerts'
  | 'health_reminders'
  | 'breeding_alerts'
  | 'expense_alerts'
  | 'subscription_renewals'
  | 'system_notifications'
  | 'security_alerts';

export interface EmailSubscription {
  id: string;
  userId: string;
  tenantId: string;
  type: EmailSubscriptionType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserEmailPreferences {
  userId: string;
  tenantId: string;
  email: string;
  enabled: boolean;
  subscriptions: Partial<Record<EmailSubscriptionType, boolean>>;
  unsubscribeToken: string;
}

export class EmailSubscriptionService {
  private static supabase = getSupabaseClient();

  // Get user's email preferences
  static async getUserPreferences(userId: string, tenantId: string): Promise<UserEmailPreferences | null> {
    try {
      const { data: user, error: userError } = await this.supabase
        .from('platform_users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return null;
      }

      const { data: subscriptions, error: subError } = await this.supabase
        .from('email_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId) as { data: EmailSubscription[] | null; error: any };

      if (subError) {
        return null;
      }

      const preferences: UserEmailPreferences = {
        userId,
        tenantId,
        email: user.email,
        enabled: true,
        subscriptions: {},
        unsubscribeToken: this.generateUnsubscribeToken(userId, tenantId),
      };

      // Build subscriptions map
      subscriptions?.forEach((sub: EmailSubscription) => {
        preferences.subscriptions[sub.type] = sub.enabled;
      });

      // Set defaults for missing subscriptions
      const defaultSubscriptions: EmailSubscriptionType[] = [
        'milk_production_alerts',
        'health_reminders',
        'breeding_alerts',
        'subscription_renewals',
        'system_notifications',
        'security_alerts',
      ];

      defaultSubscriptions.forEach(type => {
        if (preferences.subscriptions[type] === undefined) {
          preferences.subscriptions[type] = true;
        }
      });

      // Opt-in subscriptions
      const optInSubscriptions: EmailSubscriptionType[] = [
        'marketing',
        'product_updates',
        'tips_and_tricks',
        'expense_alerts',
      ];

      optInSubscriptions.forEach(type => {
        if (preferences.subscriptions[type] === undefined) {
          preferences.subscriptions[type] = false;
        }
      });

      return preferences;
    } catch (error) {
      return null;
    }
  }

  // Update user's email preferences
  static async updatePreferences(
    userId: string,
    tenantId: string,
    preferences: Partial<Record<EmailSubscriptionType, boolean>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates = Object.entries(preferences).map(([type, enabled]) => ({
        user_id: userId,
        tenant_id: tenantId,
        type: type as EmailSubscriptionType,
        enabled,
        updated_at: new Date().toISOString(),
      }));

      // Upsert all subscriptions
      const { error } = await this.supabase
        .from('email_subscriptions')
        .upsert(updates, { onConflict: 'user_id,tenant_id,type' }) as { error: any };

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Enable/disable all emails for user
  static async setGlobalEmailPreference(
    userId: string,
    tenantId: string,
    enabled: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update all subscriptions to enabled/disabled
      const { error } = await this.supabase
        .from('email_subscriptions')
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId) as { error: any };

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check if user is subscribed to specific type
  static async isSubscribed(
    userId: string,
    tenantId: string,
    type: EmailSubscriptionType
  ): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('email_subscriptions')
        .select('enabled')
        .eq('user_id', userId)
        .eq('tenant_id', tenantId)
        .eq('type', type)
        .single() as { data: { enabled: boolean } | null; error: any };

      if (error) {
        // Return default for new users
        const defaults: Record<EmailSubscriptionType, boolean> = {
          marketing: false,
          product_updates: false,
          tips_and_tricks: false,
          milk_production_alerts: true,
          health_reminders: true,
          breeding_alerts: true,
          expense_alerts: false,
          subscription_renewals: true,
          system_notifications: true,
          security_alerts: true,
        };
        return defaults[type] || false;
      }

      return data?.enabled ?? false;
    } catch (error) {
      return false;
    }
  }

  // Get all subscribers for a specific type within a tenant
  static async getSubscribers(
    tenantId: string,
    type: EmailSubscriptionType
  ): Promise<Array<{ userId: string; email: string }>> {
    try {
      const { data, error } = await this.supabase
        .from('email_subscriptions')
        .select(`
          user_id,
          platform_users!inner(email)
        `)
        .eq('tenant_id', tenantId)
        .eq('type', type)
        .eq('enabled', true) as { data: any[]; error: any };

      if (error) {
        return [];
      }

      return data?.map(sub => ({
        userId: sub.user_id,
        email: (sub as any).platform_users.email,
      })) || [];
    } catch (error) {
      return [];
    }
  }

  // Unsubscribe via token
  static async unsubscribeByToken(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Decode token (simple implementation)
      const [userId, tenantId] = this.decodeUnsubscribeToken(token);
      
      if (!userId || !tenantId) {
        return { success: false, error: 'Invalid unsubscribe token' };
      }

      // Disable all subscriptions
      const { error } = await this.supabase
        .from('email_subscriptions')
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('tenant_id', tenantId) as { error: any };

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Generate unsubscribe token
  private static generateUnsubscribeToken(userId: string, tenantId: string): string {
    // Simple token generation - in production, use JWT or similar
    const payload = `${userId}:${tenantId}:${Date.now()}`;
    return Buffer.from(payload).toString('base64');
  }

  // Decode unsubscribe token
  private static decodeUnsubscribeToken(token: string): [string | null, string | null] {
    try {
      const payload = Buffer.from(token, 'base64').toString();
      const [userId, tenantId] = payload.split(':');
      return [userId || null, tenantId || null];
    } catch {
      return [null, null];
    }
  }

  // Create unsubscribe URL
  static createUnsubscribeUrl(userId: string, tenantId: string): string {
    const token = this.generateUnsubscribeToken(userId, tenantId);
    return `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?token=${token}`;
  }

  // Initialize default subscriptions for new user
  static async initializeSubscriptions(
    userId: string,
    tenantId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultSubscriptions: EmailSubscriptionType[] = [
        'milk_production_alerts',
        'health_reminders',
        'breeding_alerts',
        'subscription_renewals',
        'system_notifications',
        'security_alerts',
      ];

      const inserts = defaultSubscriptions.map(type => ({
        user_id: userId,
        tenant_id: tenantId,
        type,
        enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error } = await this.supabase
        .from('email_subscriptions')
        .insert(inserts) as { error: any };

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// API route helpers
export async function handleUnsubscribeRequest(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Missing unsubscribe token' }, { status: 400 });
  }

  const result = await EmailSubscriptionService.unsubscribeByToken(token);
  
  if (!result.success) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  // Return success page or redirect
  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/unsubscribed`);
}

// Email preference update handler
export async function handleUpdatePreferences(
  userId: string,
  tenantId: string,
  preferences: Partial<Record<EmailSubscriptionType, boolean>>
) {
  const result = await EmailSubscriptionService.updatePreferences(
    userId,
    tenantId,
    preferences
  );

  return Response.json(result);
}