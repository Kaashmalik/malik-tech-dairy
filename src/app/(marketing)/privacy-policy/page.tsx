import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/lib/seo/config';
import { BreadcrumbSchema } from '@/components/seo/JsonLd';
import { Shield, Lock, FileText, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: { absolute: 'Privacy Policy | MTK Dairy Farm Software' },
  description:
    'Learn how MTK Dairy collects, uses, and safeguards your livestock, financial, and personal farm data with bank-grade encryption.',
  alternates: {
    canonical: `${siteConfig.url}/privacy-policy`,
  },
};

export default function PrivacyPolicyPage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteConfig.url },
    { name: 'Privacy Policy', url: `${siteConfig.url}/privacy-policy` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className='min-h-screen bg-slate-50 py-16 text-slate-800 dark:bg-slate-950 dark:text-slate-200'>
        <div className='container mx-auto max-w-4xl px-4'>
          <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900'>
            <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
              <Shield className='h-3.5 w-3.5' /> Legal & Data Protection
            </div>

            <h1 className='mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white'>
              Privacy Policy
            </h1>
            <p className='mt-2 text-sm text-slate-500'>
              Last updated: 30 October 2026 • MTK Dairy / MalikTech
            </p>

            <div className='mt-8 space-y-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300'>
              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  1. Overview & Commitment
                </h2>
                <p className='mt-2'>
                  At MTK Dairy (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated
                  by MalikTech, we respect your privacy and are committed to protecting the
                  proprietary data of your dairy farm and livestock operations. This Privacy Policy
                  outlines our practices regarding data collection, encryption, and usage when
                  accessing dairy.mtkcodex.site and our Progressive Web Applications (PWA).
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  2. Information We Collect
                </h2>
                <ul className='mt-2 list-disc space-y-2 pl-5'>
                  <li>
                    <strong>Farm Profile Data:</strong> Farm name, regional location, contact phone
                    number, email address, and owner identity.
                  </li>
                  <li>
                    <strong>Livestock Records:</strong> Tag identifiers, species (cows, buffaloes),
                    pedigree, birth dates, weights, milk yield logs, vaccination and medical
                    records, artificial insemination cycles, and lactation curves.
                  </li>
                  <li>
                    <strong>Financial & Transaction Data:</strong> Expense entries, milk sale
                    records, feed purchases, and subscription transaction references. We do not
                    store raw credit card numbers; payments are processed securely via verified
                    gateways.
                  </li>
                  <li>
                    <strong>Technical Logs:</strong> Device type, browser environment, IP address,
                    and offline caching sync logs to ensure data integrity during offline shedding
                    sessions.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  3. Multi-Tenant Data Isolation
                </h2>
                <p className='mt-2'>
                  Every request to your farm&apos;s data is checked on our servers against your
                  signed-in account and farm membership, and the database is configured to refuse
                  direct access from browsers. Other farms on the platform cannot see your records,
                  and we do not aggregate or share individual farm data. Your herd data belongs to
                  you.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  4. How We Use Your Data
                </h2>
                <ul className='mt-2 list-disc space-y-2 pl-5'>
                  <li>
                    To provide automated milk yield analytics, breeding alerts, and herd health
                    timelines.
                  </li>
                  <li>
                    To synchronize offline records securely back to your farm account once internet
                    connectivity is restored.
                  </li>
                  <li>
                    To deliver customer support, security notifications, and critical platform
                    updates via email or WhatsApp.
                  </li>
                  <li>
                    We never sell, rent, or monetize your farm records with third-party advertisers.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  5. Cookies and Similar Technologies
                </h2>
                <p className='mt-2'>
                  We use essential cookies to keep you signed in and to secure your session (via our
                  authentication provider). We use privacy-conscious product analytics and error
                  monitoring to understand how features are used and to fix problems. On our public
                  guides and free tools we may also show advertising, which uses cookies as
                  described below. You can block or delete cookies in your browser settings;
                  essential cookies are required to use the farm dashboard.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>6. Advertising</h2>
                <p className='mt-2'>
                  Advertising appears only on public content pages (such as our dairy farming guides
                  and calculators) — never inside your farm dashboard, and never using your farm
                  records. We use Google AdSense. Third-party vendors, including Google, use cookies
                  to serve ads based on your prior visits to this and other websites. Google&apos;s
                  use of advertising cookies enables it and its partners to serve ads to you based
                  on those visits.
                </p>
                <ul className='mt-2 list-disc space-y-2 pl-5'>
                  <li>
                    You can opt out of personalised advertising in
                    <a
                      href='https://adssettings.google.com'
                      className='text-emerald-700 underline'
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      Google Ads Settings
                    </a>
                    , or opt out of some third-party vendors&apos; use of cookies at
                    <a
                      href='https://www.aboutads.info/choices'
                      className='text-emerald-700 underline'
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      aboutads.info
                    </a>
                    .
                  </li>
                  <li>
                    Learn how Google uses information from sites that use its services at
                    <a
                      href='https://policies.google.com/technologies/partner-sites'
                      className='text-emerald-700 underline'
                      rel='noopener noreferrer'
                      target='_blank'
                    >
                      policies.google.com/technologies/partner-sites
                    </a>
                    .
                  </li>
                  <li>
                    Visitors from the European Economic Area, the United Kingdom and Switzerland are
                    asked for consent through a Google-certified consent management platform before
                    personalised ads are shown.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  7. Service Providers
                </h2>
                <p className='mt-2'>
                  We use trusted processors to run the service, under their own security and privacy
                  commitments: account sign-in and team invitations (Clerk), database hosting
                  (Supabase), application hosting (Vercel), image storage (Cloudinary),
                  transactional email (Resend), error monitoring (Sentry), product analytics
                  (PostHog), payment gateways for paid plans, and Google AdSense for advertising on
                  public pages. They process data only to provide their service to us.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  8. Data Retention, Export and Deletion
                </h2>
                <p className='mt-2'>
                  You own your records. Farm owners can download a complete export of all farm data
                  at any time from <strong>Settings → Data &amp; Privacy</strong>, in addition to
                  CSV and PDF reports. Owners can also delete the farm there: access ends
                  immediately for all members, and the data is kept for up to 30 days so a mistake
                  can be reversed on request, after which it is permanently deleted. Inquiries sent
                  through our contact form are kept only as long as needed to respond.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>9. Children</h2>
                <p className='mt-2'>
                  Our service is intended for farm owners and staff and is not directed at children
                  under 13. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  10. Changes to This Policy
                </h2>
                <p className='mt-2'>
                  We may update this policy as the service changes. The &ldquo;Last updated&rdquo;
                  date above shows the latest revision; significant changes will be notified to
                  account holders by email or in the app.
                </p>
              </section>

              <section>
                <h2 className='text-lg font-bold text-slate-900 dark:text-white'>
                  11. Contact Information
                </h2>
                <p className='mt-2'>
                  If you have inquiries regarding this policy or wish to exercise data rights,
                  please contact our Data Protection Officer at:
                </p>
                <div className='mt-3 rounded-xl bg-slate-100 p-4 text-xs dark:bg-slate-800'>
                  <div>
                    <strong>Email:</strong> support@dairy.mtkcodex.site / mtkdairy@gmail.com
                  </div>
                  <div className='mt-1'>
                    <strong>WhatsApp / Phone:</strong> +92 303 8111297
                  </div>
                  <div className='mt-1'>
                    <strong>Headquarters:</strong> Garhi Shahu, Allama Iqbal Road, Lahore, Punjab,
                    Pakistan
                  </div>
                </div>
              </section>
            </div>

            <div className='mt-10 border-t border-slate-200 pt-6 dark:border-slate-800'>
              <Link
                href='/'
                className='text-sm font-semibold text-emerald-600 hover:underline dark:text-emerald-400'
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
