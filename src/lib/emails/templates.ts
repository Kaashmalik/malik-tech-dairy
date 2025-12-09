// Email Templates for Welcome and Onboarding Sequences
// Uses Resend API for sending emails

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Welcome Email Template
 */
export function getWelcomeEmailTemplate(userName: string, tenantName: string): EmailTemplate {
  const subject = 'Welcome to MTK Dairy! 🐄';
  const html = `
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
          <h1>Welcome to MTK Dairy!</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Welcome to <strong>${tenantName}</strong>! We're excited to help you manage your dairy farm more efficiently.</p>
          <p>Here's what you can do next:</p>
          <ul>
            <li>Complete your farm setup in the onboarding wizard</li>
            <li>Add your first animals to the system</li>
            <li>Start logging milk production</li>
            <li>Explore analytics and reports</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding" class="button">Get Started</a>
          <p>If you have any questions, our support team is here to help!</p>
          <p>Best regards,<br>The MTK Dairy Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
    Welcome to MTK Dairy!
    
    Hi ${userName},
    
    Welcome to ${tenantName}! We're excited to help you manage your dairy farm more efficiently.
    
    Here's what you can do next:
    - Complete your farm setup in the onboarding wizard
    - Add your first animals to the system
    - Start logging milk production
    - Explore analytics and reports
    
    Get started: ${process.env.NEXT_PUBLIC_APP_URL}/onboarding
    
    If you have any questions, our support team is here to help!
    
    Best regards,
    The MTK Dairy Team
  `;

  return { subject, html, text };
}

/**
 * Onboarding Email Template (Day 1)
 */
export function getOnboardingEmailTemplate(userName: string, step: number): EmailTemplate {
  const subject = `Let's Set Up Your Farm - Step ${step}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Let's Set Up Your Farm</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>Great to see you're getting started! Here's a quick guide for Step ${step}:</p>
          ${
            step === 1
              ? `
            <h3>Step 1: Farm Information</h3>
            <p>Tell us about your farm - name, location, and basic details.</p>
          `
              : step === 2
                ? `
            <h3>Step 2: Animal Types</h3>
            <p>Select which types of animals you manage (cows, buffaloes, poultry, etc.).</p>
          `
                : step === 3
                  ? `
            <h3>Step 3: Staff Setup</h3>
            <p>Invite team members and assign roles.</p>
          `
                  : `
            <h3>Step 4: Choose Your Plan</h3>
            <p>Select a subscription plan that fits your needs.</p>
          `
          }
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/onboarding" class="button">Continue Setup</a>
          <p>Need help? Reply to this email or contact support.</p>
          <p>Best regards,<br>The MTK Dairy Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
    Let's Set Up Your Farm - Step ${step}
    
    Hi ${userName},
    
    Great to see you're getting started! Continue your setup here:
    ${process.env.NEXT_PUBLIC_APP_URL}/onboarding
    
    Need help? Reply to this email or contact support.
    
    Best regards,
    The MTK Dairy Team
  `;

  return { subject, html, text };
}

/**
 * NPS Survey Email Template (Day 7)
 */
export function getNPSEmailTemplate(userName: string): EmailTemplate {
  const subject = 'How are we doing? Your feedback matters';
  const html = `
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
          <h1>How are we doing?</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>You've been using MTK Dairy for a week now. We'd love to hear your feedback!</p>
          <p>How likely are you to recommend us to a friend or colleague?</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?nps=true" class="button">Share Your Feedback</a>
          <p>Your feedback helps us improve and serve you better.</p>
          <p>Thank you!<br>The MTK Dairy Team</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} MTK Dairy. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const text = `
    How are we doing? Your feedback matters
    
    Hi ${userName},
    
    You've been using MTK Dairy for a week now. We'd love to hear your feedback!
    
    How likely are you to recommend us to a friend or colleague?
    
    Share your feedback: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard?nps=true
    
    Your feedback helps us improve and serve you better.
    
    Thank you!
    The MTK Dairy Team
  `;

  return { subject, html, text };
}
