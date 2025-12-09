// Email Sender using Resend API
import { Resend } from 'resend';
import type { EmailTemplate } from './templates';

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY not configured. Email sending will be disabled.');
}

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendEmailOptions {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using Resend
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resend) {
    console.warn('Resend not configured. Email not sent:', options.to);
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const result = await resend.emails.send({
      from:
        options.from || process.env.RESEND_FROM_EMAIL || 'MTK Dairy <noreply@maliktechdairy.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return { success: false, error: result.error.message };
    }

    return { success: true, messageId: result.data?.id };
  } catch (error: any) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send email template
 */
export async function sendEmailTemplate(
  to: string,
  template: EmailTemplate,
  from?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  return sendEmail({
    to,
    from,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
