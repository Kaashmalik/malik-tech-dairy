import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { faqData, siteConfig } from '@/lib/seo/config';
import { FAQPageSchema, BreadcrumbSchema } from '@/components/seo/JsonLd';
import { HelpCircle, ChevronDown, Sparkles, ArrowRight, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions (FAQ) | MTK Dairy Software Pakistan',
  description:
    'Find answers to common questions about MTK Dairy farm software. Milk yield tracking, breeding cycles, Urdu language support, offline PWA, pricing in PKR, and data security.',
  alternates: {
    canonical: `${siteConfig.url}/faq`,
  },
  openGraph: {
    title: 'MTK Dairy FAQ - Common Questions Answered',
    description:
      'Everything you need to know about setting up and managing your dairy herd with MTK Dairy.',
    url: `${siteConfig.url}/faq`,
  },
};

const extendedFaqs = [
  ...faqData,
  {
    question: 'How does offline PWA recording work in remote sheds?',
    answer:
      'MTK Dairy is built as a Progressive Web App (PWA). When you visit the app once, it saves locally to your mobile device. You can log morning and evening milk entries, vaccinations, and notes inside your animal sheds without active internet. When your phone reconnects to 4G or Wi-Fi, all records sync automatically to the cloud.',
  },
  {
    question: 'Which local payment methods do you accept in Pakistan?',
    answer:
      'We accept JazzCash, EasyPaisa, Nayapay, Sadapay, and Direct Pakistani Bank Transfers (IBFT) for all subscription plans. Invoices and receipts are provided in Pakistani Rupees (PKR).',
  },
  {
    question: 'Can I track both cows and buffaloes in the same herd?',
    answer:
      'Yes! MTK Dairy provides dedicated breed categories for Nili-Ravi, Kundi, Sahiwal, Cholistani, Red Sindhi, Holstein Friesian, and crossbred cattle. Milk fat content, lactation length, and breeding timelines adapt accordingly.',
  },
  {
    question: 'Can my farm veterinarian or manager have their own login?',
    answer:
      'Yes! MTK Dairy supports role-based access control (RBAC). Depending on your plan, you can invite farm managers, veterinary doctors, and milk recorders with tailored permissions so they only see what they need.',
  },
];

export default function FAQPage() {
  const breadcrumbItems = [
    { name: 'Home', url: siteConfig.url },
    { name: 'FAQ', url: `${siteConfig.url}/faq` },
  ];

  return (
    <>
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQPageSchema />

      <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100'>
        {/* Header */}
        <section className='container mx-auto px-4 py-16 text-center lg:py-24'>
          <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
            <Sparkles className='h-3.5 w-3.5' /> Knowledge Base & Help
          </div>
          <h1 className='mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl'>
            Frequently Asked{' '}
            <span className='bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent'>
              Questions
            </span>
          </h1>
          <p className='mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400'>
            Everything you need to know about the MTK Dairy platform, billing, livestock records,
            and mobile usage.
          </p>
          <p className='font-urdu mt-3 text-base text-slate-500'>
            ڈیری فارم مینجمنٹ سافٹ ویئر کے متعلق عام سوالات اور ان کے جوابات
          </p>
        </section>

        {/* FAQ Accordion List */}
        <section className='container mx-auto max-w-4xl px-4 pb-20'>
          <div className='space-y-4'>
            {extendedFaqs.map((faq, index) => (
              <details
                key={index}
                className='group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900'
              >
                <summary className='flex cursor-pointer list-none items-center justify-between font-semibold text-slate-900 dark:text-white'>
                  <span className='text-base sm:text-lg'>{faq.question}</span>
                  <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 group-open:rotate-180 dark:bg-slate-800 dark:text-slate-400'>
                    <ChevronDown className='h-4 w-4' />
                  </div>
                </summary>
                <div className='mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600 dark:border-slate-800 dark:text-slate-300'>
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Still Have Questions CTA */}
        <section className='container mx-auto px-4 pb-24'>
          <div className='rounded-3xl border border-emerald-200 bg-emerald-50/60 p-8 text-center sm:p-12 dark:border-emerald-900 dark:bg-emerald-950/20'>
            <h2 className='text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white'>
              Still have questions or need assistance?
            </h2>
            <p className='mx-auto mt-3 max-w-xl text-slate-600 dark:text-slate-400'>
              Our team of livestock technology specialists is available on WhatsApp to guide you
              through setup.
            </p>
            <div className='mt-8 flex flex-wrap justify-center gap-4'>
              <a
                href='https://wa.me/923020718182?text=Hello%20MTK%20Dairy%20team,%20I%20have%20a%20question'
                target='_blank'
                rel='noopener noreferrer'
                className='flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-emerald-700'
              >
                <MessageSquare className='h-4 w-4' />
                <span>Chat on WhatsApp</span>
              </a>
              <Link
                href='/contact'
                className='rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              >
                Contact Page
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
