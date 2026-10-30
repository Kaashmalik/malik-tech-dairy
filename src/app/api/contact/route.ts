// Public contact form: store the inquiry and notify the team by email.
// Rate limited in middleware (strict bucket); honeypot field filters simple bots.
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { db } from '@/lib/supabase/tenant-db';
import { sendEmail } from '@/lib/emails/sender';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(120),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,24}$/, 'Please enter a valid phone number'),
  email: z.string().trim().email().max(255).optional().or(z.literal('')),
  farmName: z.string().trim().max(255).optional(),
  animalCount: z.string().trim().max(30).optional(),
  message: z.string().trim().min(10, 'Please write a short message').max(5000),
  website: z.string().max(0).optional(), // honeypot: real users leave it empty
});

const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!
  );

export async function POST(request: NextRequest) {
  let input: z.infer<typeof contactSchema>;
  try {
    input = contactSchema.parse(await request.json());
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.errors[0]?.message || 'Invalid input' : 'Invalid input';
    // Honeypot hits get a normal-looking success so bots learn nothing
    if (error instanceof z.ZodError && error.errors.some(e => e.path[0] === 'website')) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  const id = randomUUID();
  const { error } = await db()
    .from('contact_messages')
    .insert({
      id,
      name: input.name,
      phone: input.phone,
      email: input.email || null,
      farm_name: input.farmName || null,
      animal_count: input.animalCount || null,
      message: input.message,
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || null,
      user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
    });
  if (error) {
    logger.error('Contact message insert failed', error);
  }

  const to = process.env.CONTACT_INBOX_EMAIL || process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  const emailed = to
    ? await sendEmail({
        to,
        subject: `New inquiry from ${input.name}${input.farmName ? ` (${input.farmName})` : ''}`,
        html: `<p><b>Name:</b> ${escapeHtml(input.name)}<br/>
<b>Phone:</b> ${escapeHtml(input.phone)}<br/>
<b>Email:</b> ${escapeHtml(input.email || '-')}<br/>
<b>Farm:</b> ${escapeHtml(input.farmName || '-')} (${escapeHtml(input.animalCount || '?')} animals)</p>
<p>${escapeHtml(input.message).replace(/\n/g, '<br/>')}</p>`,
      })
    : { success: false };

  // Only report failure if the message was neither stored nor emailed
  if (error && !emailed.success) {
    return NextResponse.json(
      { success: false, error: 'Could not send your message. Please call or WhatsApp us.' },
      { status: 503 }
    );
  }
  return NextResponse.json({ success: true });
}
