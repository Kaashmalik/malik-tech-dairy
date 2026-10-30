'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/lib/seo/config';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  MessageSquare,
  Send,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    farmName: '',
    animalCount: '',
    message: '',
  });

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [website, setWebsite] = useState(''); // honeypot

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, website }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setError(json.error || 'Could not send your message. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100'>
      {/* Header */}
      <section className='container mx-auto px-4 py-16 text-center lg:py-24'>
        <div className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'>
          <Sparkles className='h-3.5 w-3.5' /> Get In Touch With Our Team
        </div>
        <h1 className='mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl'>
          We’re Here to Help Your{' '}
          <span className='bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent'>
            Farm Succeed
          </span>
        </h1>
        <p className='mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400'>
          Whether you need assistance choosing a plan, setting up your livestock records, or booking
          an onboarding demonstration.
        </p>
        <p className='font-urdu mt-3 text-base text-slate-500'>
          ہمارے کسٹمر سپورٹ نمائندے سے واٹس ایپ یا فون پر براہِ راست رابطہ کریں
        </p>
      </section>

      {/* Main Grid */}
      <section className='container mx-auto px-4 pb-24'>
        <div className='grid gap-12 lg:grid-cols-12'>
          {/* Left Column: Direct Contact Info */}
          <div className='space-y-8 lg:col-span-5'>
            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                Contact Information
              </h2>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
                Reach out to our Lahore support headquarters directly via phone or WhatsApp.
              </p>

              <div className='mt-8 space-y-6'>
                <a
                  href='https://wa.me/923038111297?text=Assalam-o-alaikum%20MTK%20Dairy%20team,%20I%20want%20information%20about%20your%20software'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 transition-all hover:bg-emerald-100/70 dark:border-emerald-900 dark:bg-emerald-950/30'
                >
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white'>
                    <MessageSquare className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400'>
                      WhatsApp (Fastest Response)
                    </div>
                    <div className='mt-0.5 text-base font-bold text-slate-900 dark:text-white'>
                      +92 303 8111297
                    </div>
                    <div className='mt-1 text-xs text-emerald-700 dark:text-emerald-300'>
                      Click to chat directly with our farm advisor
                    </div>
                  </div>
                </a>

                <div className='flex items-start gap-4 p-2'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                    <Phone className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                      Direct Phone
                    </div>
                    <a
                      href='tel:+923038111297'
                      className='mt-0.5 block text-base font-semibold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400'
                    >
                      +92 303 8111297
                    </a>
                    <div className='text-xs text-slate-500'>
                      Monday to Saturday, 9:00 AM - 6:00 PM PKT
                    </div>
                  </div>
                </div>

                <div className='flex items-start gap-4 p-2'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                    <Mail className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                      Support & Business Email
                    </div>
                    <a
                      href='mailto:mtkdairy@gmail.com'
                      className='mt-0.5 block text-base font-semibold text-slate-900 hover:text-emerald-600 dark:text-white dark:hover:text-emerald-400'
                    >
                      mtkdairy@gmail.com
                    </a>
                    <a
                      href='mailto:support@dairy.mtkcodex.site'
                      className='text-xs text-slate-500 hover:underline'
                    >
                      support@dairy.mtkcodex.site
                    </a>
                  </div>
                </div>

                <div className='flex items-start gap-4 p-2'>
                  <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'>
                    <MapPin className='h-5 w-5' />
                  </div>
                  <div>
                    <div className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                      Office Location
                    </div>
                    <div className='mt-0.5 text-base font-semibold text-slate-900 dark:text-white'>
                      Garhi Shahu, Allama Iqbal Road, Lahore
                    </div>
                    <div className='text-xs text-slate-500'>
                      Punjab, Pakistan (Postal Code: 54000)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Inquiry Form */}
          <div className='lg:col-span-7'>
            <div className='rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
              <h2 className='text-2xl font-bold text-slate-900 dark:text-white'>
                Send Us a Message
              </h2>
              <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
                Fill in your farm details and our technical team will respond within 2 hours.
              </p>

              {submitted ? (
                <div className='my-12 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 text-center dark:border-emerald-900 dark:bg-emerald-950/40'>
                  <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400'>
                    <CheckCircle2 className='h-8 w-8' />
                  </div>
                  <h3 className='mt-4 text-xl font-bold text-slate-900 dark:text-white'>
                    Thank You, {formData.name || 'Farmer'}!
                  </h3>
                  <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>
                    Your inquiry has been received. Our team will contact you at{' '}
                    {formData.phone || 'your phone number'} shortly.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        phone: '',
                        farmName: '',
                        animalCount: '',
                        message: '',
                      });
                    }}
                    className='mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700'
                  >
                    Send Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='mt-8 space-y-6'>
                  <div className='grid gap-6 sm:grid-cols-2'>
                    <div>
                      <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
                        Your Full Name *
                      </label>
                      <input
                        type='text'
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder='e.g. Muhammad Kashif'
                        className='mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
                        Phone / WhatsApp *
                      </label>
                      <input
                        type='tel'
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder='e.g. 0303-8111297'
                        className='mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      />
                    </div>
                  </div>

                  <div className='grid gap-6 sm:grid-cols-2'>
                    <div>
                      <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
                        Farm Name & City
                      </label>
                      <input
                        type='text'
                        value={formData.farmName}
                        onChange={e => setFormData({ ...formData, farmName: e.target.value })}
                        placeholder='e.g. Al-Razi Dairy, Lahore'
                        className='mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      />
                    </div>

                    <div>
                      <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
                        Approx. Herd Size
                      </label>
                      <select
                        value={formData.animalCount}
                        onChange={e => setFormData({ ...formData, animalCount: e.target.value })}
                        className='mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                      >
                        <option value=''>Select herd size</option>
                        <option value='1-10'>1 - 10 Animals</option>
                        <option value='11-50'>11 - 50 Animals</option>
                        <option value='51-200'>51 - 200 Animals</option>
                        <option value='200+'>200+ Commercial Herd</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className='block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300'>
                      Message / Questions
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder='Tell us about your farm goals or features you are interested in...'
                      className='mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
                    />
                  </div>

                  {/* Honeypot: hidden from people, filled by bots */}
                  <input
                    type='text'
                    name='website'
                    tabIndex={-1}
                    autoComplete='off'
                    aria-hidden='true'
                    className='hidden'
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                  />
                  {error && (
                    <p role='alert' className='text-sm text-red-600'>
                      {error}
                    </p>
                  )}
                  <button
                    type='submit'
                    disabled={sending}
                    className='flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 sm:w-auto'
                  >
                    <span>{sending ? 'Sending…' : 'Submit Inquiry'}</span>
                    <Send className='h-4 w-4' />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
