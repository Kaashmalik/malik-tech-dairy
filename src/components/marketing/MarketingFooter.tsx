import React from 'react';
import Link from 'next/link';
import { Shield, Mail, MapPin } from 'lucide-react';

export function MarketingFooter() {
  return (
    <footer className='border-t border-slate-200 bg-slate-50 py-12 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'>
      <div className='container mx-auto px-4'>
        <div className='grid gap-8 sm:grid-cols-2 md:grid-cols-4'>
          {/* Col 1 */}
          <div>
            <div className='flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white'>
              <span>🐄 MTK Dairy</span>
            </div>
            <p className='mt-3 text-sm'>
              Smart dairy & livestock farm management platform. Built for farmers across Pakistan.
            </p>
            <p className='font-urdu mt-2 text-sm text-slate-500'>
              پاکستان کے ڈیری فارمز کے لیے جدید مینجمنٹ پلیٹ فارم
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className='text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white'>
              Platform
            </h4>
            <ul className='mt-3 space-y-2 text-sm'>
              <li>
                <Link href='/features' className='transition-colors hover:text-emerald-600'>
                  Features Overview
                </Link>
              </li>
              <li>
                <Link href='/pricing' className='transition-colors hover:text-emerald-600'>
                  Pricing & Subscriptions
                </Link>
              </li>
              <li>
                <Link href='/about' className='transition-colors hover:text-emerald-600'>
                  About MTK Dairy
                </Link>
              </li>
              <li>
                <Link href='/faq' className='transition-colors hover:text-emerald-600'>
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href='/apply' className='transition-colors hover:text-emerald-600'>
                  Register Your Farm (Free)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className='text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white'>
              Portals & Legal
            </h4>
            <ul className='mt-3 space-y-2 text-sm'>
              <li>
                <Link href='/sign-in' className='transition-colors hover:text-emerald-600'>
                  Farmer Sign In
                </Link>
              </li>
              <li>
                <Link href='/dashboard' className='transition-colors hover:text-emerald-600'>
                  Farm Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href='/super-admin'
                  className='inline-flex items-center gap-1.5 font-semibold text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400'
                >
                  <Shield className='h-4 w-4' />
                  Super Admin Portal
                </Link>
              </li>
              <li>
                <Link href='/privacy-policy' className='transition-colors hover:text-emerald-600'>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href='/terms-of-service' className='transition-colors hover:text-emerald-600'>
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className='text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white'>
              Contact & Support
            </h4>
            <ul className='mt-3 space-y-2 text-sm'>
              <li>
                <Link href='/contact' className='font-semibold text-emerald-600 hover:underline'>
                  Contact & Inquiry Form →
                </Link>
              </li>
              <li className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-emerald-600' />
                <a href='mailto:mtkdairy@gmail.com' className='hover:underline'>
                  mtkdairy@gmail.com
                </a>
              </li>
              <li className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-emerald-600' />
                <span>Lahore, Punjab, Pakistan</span>
              </li>
              <li className='text-xs text-slate-400'>WhatsApp Support: +92 303 8111297</li>
            </ul>
          </div>
        </div>

        <div className='mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-8 text-xs text-slate-500 sm:flex-row dark:border-slate-800/80'>
          <div>© {new Date().getFullYear()} MTK Dairy / MalikTech Dairy. All rights reserved.</div>
          <div className='flex gap-6'>
            <Link href='/privacy-policy' className='hover:underline'>
              Privacy Policy
            </Link>
            <Link href='/terms-of-service' className='hover:underline'>
              Terms of Service
            </Link>
            <Link href='/sitemap.xml' className='hover:underline'>
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
