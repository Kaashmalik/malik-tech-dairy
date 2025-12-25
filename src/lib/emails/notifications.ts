/**
 * Email Notification System
 * Comprehensive email templates and notification management
 */

import { sendEmailTemplate } from './sender';
import type { EmailTemplate } from './templates';
import { getWelcomeEmailTemplate, getOnboardingEmailTemplate } from './templates';

// Notification types
export type NotificationType = 
  | 'welcome'
  | 'onboarding'
  | 'invitation'
  | 'milk_alert'
  | 'health_reminder'
  | 'breeding_alert'
  | 'expense_alert'
  | 'subscription_renewal'
  | 'quota_warning'
  | 'password_reset'
  | 'email_verification'
  | 'data_export'
  | 'data_import'
  | 'system_maintenance'
  | 'feature_update';

// Template data interfaces
export interface WelcomeData {
  userName: string;
  tenantName: string;
  userEmail: string;
}

export interface InvitationData {
  userName: string;
  inviterName: string;
  tenantName: string;
  role: string;
  inviteLink: string;
}

export interface MilkAlertData {
  userName: string;
  animalId: string;
  animalTag: string;
  date: string;
  expectedYield: number;
  actualYield: number;
  variance: number;
}

export interface HealthReminderData {
  userName: string;
  animalId: string;
  animalTag: string;
  reminderType: 'vaccination' | 'checkup' | 'treatment';
  dueDate: string;
  notes?: string;
}

export interface BreedingAlertData {
  userName: string;
  animalId: string;
  animalTag: string;
  event: 'heat_detected' | 'pregnancy_confirmed' | 'due_soon' | 'birth';
  eventDate: string;
  notes?: string;
}

export interface ExpenseAlertData {
  userName: string;
  category: string;
  amount: number;
  budget: number;
  percentage: number;
  period: string;
}

export interface SubscriptionData {
  userName: string;
  planName: string;
  renewalDate: string;
  amount: number;
  autoRenew: boolean;
}

export interface QuotaWarningData {
  userName: string;
  resource: string;
  current: number;
  limit: number;
  percentage: number;
}

export interface PasswordResetData {
  userName: string;
  resetLink: string;
  expiryHours: number;
}

export interface EmailVerificationData {
  userName: string;
  verificationLink: string;
  expiryHours: number;
}

export interface DataExportData {
  userName: string;
  dataType: string;
  format: string;
  downloadLink: string;
  expiryDate: string;
}

export interface DataImportData {
  userName: string;
  fileName: string;
  totalRecords: number;
  successCount: number;
  errorCount: number;
  errors?: string[];
}

export interface SystemMaintenanceData {
  userName: string;
  scheduledDate: string;
  duration: string;
  affectedFeatures: string[];
}

export interface FeatureUpdateData {
  userName: string;
  featureName: string;
  description: string;
  learnMoreLink: string;
}

// Email template generators
export const emailTemplates = {
  // Welcome email (already implemented)
  welcome: (data: WelcomeData): EmailTemplate => 
    getWelcomeEmailTemplate(data.userName, data.tenantName),

  // Onboarding emails
  onboarding: (data: { userName: string; step: number }): EmailTemplate =>
    getOnboardingEmailTemplate(data.userName, data.step),

  // Invitation email
  invitation: (data: InvitationData): EmailTemplate => ({
    subject: `You're invited to join ${data.tenantName}! 🐄`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1F7A3D; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #1F7A3D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invitation to Join ${data.tenantName}</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>${data.inviterName} has invited you to join <strong>${data.tenantName}</strong> as a <strong>${data.role}</strong>.</p>
            <p>Click the button below to accept the invitation and get started:</p>
            <a href="${data.inviteLink}" class="button">Accept Invitation</a>
            <p>This invitation will expire in 7 days.</p>
            <p>If you have any questions, please contact your farm administrator.</p>
            <p>Best regards,<br>The MTK Dairy Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Invitation to Join ${data.tenantName}
      
      Hi ${data.userName},
      
      ${data.inviterName} has invited you to join ${data.tenantName} as a ${data.role}.
      
      Accept your invitation: ${data.inviteLink}
      
      This invitation will expire in 7 days.
      
      If you have any questions, please contact your farm administrator.
      
      Best regards,
      The MTK Dairy Team
    `,
  }),

  // Milk production alert
  milkAlert: (data: MilkAlertData): EmailTemplate => ({
    subject: `🥛 Milk Production Alert - ${data.animalTag}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Milk Production Alert</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <div class="alert">
              <strong>Unusual milk production detected for ${data.animalTag}</strong>
            </div>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Expected Yield:</strong> ${data.expectedYield} liters</p>
            <p><strong>Actual Yield:</strong> ${data.actualYield} liters</p>
            <p><strong>Variance:</strong> ${data.variance}%</p>
            <p>Please check on this animal and record any observations.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/animals/${data.animalId}" class="button">View Animal Details</a>
            <p>Best regards,<br>The MTK Dairy Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Milk Production Alert - ${data.animalTag}
      
      Hi ${data.userName},
      
      Unusual milk production detected for ${data.animalTag}
      
      Date: ${data.date}
      Expected Yield: ${data.expectedYield} liters
      Actual Yield: ${data.actualYield} liters
      Variance: ${data.variance}%
      
      Please check on this animal and record any observations.
      
      View animal details: ${process.env.NEXT_PUBLIC_APP_URL}/animals/${data.animalId}
      
      Best regards,
      The MTK Dairy Team
    `,
  }),

  // Health reminder
  healthReminder: (data: HealthReminderData): EmailTemplate => ({
    subject: `🏥 Health Reminder - ${data.reminderType} for ${data.animalTag}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .reminder { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Health Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <div class="reminder">
              <strong>${data.reminderType.charAt(0).toUpperCase() + data.reminderType.slice(1)} scheduled for ${data.animalTag}</strong>
            </div>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
            <p>Please ensure this health activity is completed on time.</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/animals/${data.animalId}/health" class="button">Record Health Activity</a>
            <p>Best regards,<br>The MTK Dairy Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Health Reminder - ${data.reminderType} for ${data.animalTag}
      
      Hi ${data.userName},
      
      ${data.reminderType.charAt(0).toUpperCase() + data.reminderType.slice(1)} scheduled for ${data.animalTag}
      
      Due Date: ${data.dueDate}
      ${data.notes ? `Notes: ${data.notes}` : ''}
      
      Please ensure this health activity is completed on time.
      
      Record health activity: ${process.env.NEXT_PUBLIC_APP_URL}/animals/${data.animalId}/health
      
      Best regards,
      The MTK Dairy Team
    `,
  }),

  // Password reset
  passwordReset: (data: PasswordResetData): EmailTemplate => ({
    subject: 'Reset Your MTK Dairy Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6B7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #6B7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${data.resetLink}" class="button">Reset Password</a>
            <p>This link will expire in ${data.expiryHours} hours for security reasons.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>The MTK Dairy Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset Your MTK Dairy Password
      
      Hi ${data.userName},
      
      We received a request to reset your password. Create a new password using the link below:
      
      ${data.resetLink}
      
      This link will expire in ${data.expiryHours} hours for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      The MTK Dairy Team
    `,
  }),

  // Email verification
  emailVerification: (data: EmailVerificationData): EmailTemplate => ({
    subject: 'Verify Your MTK Dairy Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Please verify your email address to complete your MTK Dairy account setup:</p>
            <a href="${data.verificationLink}" class="button">Verify Email</a>
            <p>This link will expire in ${data.expiryHours} hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            <p>Best regards,<br>The MTK Dairy Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify Your MTK Dairy Email
      
      Hi ${data.userName},
      
      Please verify your email address to complete your MTK Dairy account setup:
      
      ${data.verificationLink}
      
      This link will expire in ${data.expiryHours} hours.
      
      If you didn't create an account, please ignore this email.
      
      Best regards,
      The MTK Dairy Team
    `,
  }),
};

// Notification service
export class EmailNotificationService {
  static async sendNotification<T extends NotificationType>(
    type: T,
    to: string,
    data: T extends 'welcome' ? WelcomeData :
        T extends 'invitation' ? InvitationData :
        T extends 'milk_alert' ? MilkAlertData :
        T extends 'health_reminder' ? HealthReminderData :
        T extends 'password_reset' ? PasswordResetData :
        T extends 'email_verification' ? EmailVerificationData :
        any
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const templateFn = emailTemplates[type as keyof typeof emailTemplates];
      if (typeof templateFn === 'function') {
        const template = templateFn(data as any);
        return await sendEmailTemplate(to, template);
      }
      throw new Error(`Unknown email template type: ${type}`);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Batch send notifications
  static async sendBatchNotifications<T extends NotificationType>(
    type: T,
    recipients: Array<{ email: string; data: any }>
  ): Promise<Array<{ email: string; success: boolean; error?: string }>> {
    const results = await Promise.allSettled(
      recipients.map(async ({ email, data }) => {
        const result = await this.sendNotification(type, email, data);
        return { email, ...result };
      })
    );

    return results.map(result => 
      result.status === 'fulfilled' ? result.value : { 
        email: result.reason.email || 'unknown', 
        success: false, 
        error: result.reason.message 
      }
    );
  }

  // Schedule notification (requires cron job or similar)
  static scheduleNotification(
    type: NotificationType,
    to: string,
    data: any,
    scheduledAt: Date
  ): { success: boolean; scheduledId?: string; error?: string } {
    // This would integrate with your job queue system
    // For now, return a placeholder
    const scheduledId = `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Scheduled ${type} notification to ${to} at ${scheduledAt.toISOString()}`);
    return { success: true, scheduledId };
  }
}

// Export convenience functions
export const sendWelcomeEmail = (data: WelcomeData) => 
  EmailNotificationService.sendNotification('welcome', data.userEmail, data);

export const sendInvitationEmail = (to: string, data: InvitationData) => 
  EmailNotificationService.sendNotification('invitation', to, data);

export const sendMilkAlertEmail = (to: string, data: MilkAlertData) => 
  EmailNotificationService.sendNotification('milk_alert', to, data);

export const sendHealthReminderEmail = (to: string, data: HealthReminderData) => 
  EmailNotificationService.sendNotification('health_reminder', to, data);

export const sendPasswordResetEmail = (to: string, data: PasswordResetData) => 
  EmailNotificationService.sendNotification('password_reset', to, data);

export const sendEmailVerificationEmail = (to: string, data: EmailVerificationData) => 
  EmailNotificationService.sendNotification('email_verification', to, data);