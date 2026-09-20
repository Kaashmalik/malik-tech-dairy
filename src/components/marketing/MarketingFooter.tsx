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
              پاکستان کا نمبر 1 ڈیری فارم مینجمنٹ سافٹ ویئر
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className='text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white'>
              Product
            </h4>
            <ul className='mt-3 space-y-2 text-sm'>
              <li>
                <Link href='/features' className='transition-colors hover:text-emerald-600'>
                  Features Overview
                </Link>
              </li>
              <li>
                <Link href='/#pricing' className='transition-colors hover:text-emerald-600'>
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href='/#faq' className='transition-colors hover:text-emerald-600'>
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link href='/apply' className='transition-colors hover:text-emerald-600'>
                  Register Your Farm
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className='text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white'>
              Portals & Access
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
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h4 className='text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white'>
              Contact & Support
            </h4>
            <ul className='mt-3 space-y-2 text-sm'>
              <li className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-emerald-600' />
                <a href='mailto:mtkdairy@gmail.com' className='hover:underline'>
                  mtkdairy@gmail.com
                </a>
              </li>
              <li className='flex items-center gap-2'>
                <MapPin className='h-4 w-4 text-emerald-600' />
                <span>Punjab, Pakistan</span>
              </li>
              <li className='text-xs text-slate-400'>24/7 Monitoring & Cloud Backup</li>
            </ul>
          </div>
        </div>

        <div className='mt-8 border-t border-slate-200/80 pt-8 text-center text-xs text-slate-500 dark:border-slate-800/80'>
          © {new Date().getFullYear()} MTK Dairy / Malik Tech Dairy. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
