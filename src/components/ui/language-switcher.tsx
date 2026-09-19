'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function LanguageSwitcher() {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState<'en' | 'ur'>('en');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Read from cookie or HTML lang attribute
    const htmlLang = document.documentElement.lang;
    const cookieMatch = document.cookie.match(/NEXT_LOCALE=(en|ur)/);
    const activeLocale = (cookieMatch ? cookieMatch[1] : htmlLang === 'ur' ? 'ur' : 'en') as
      | 'en'
      | 'ur';
    setCurrentLocale(activeLocale);
  }, []);

  const switchLanguage = (locale: 'en' | 'ur') => {
    if (locale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Set cookie
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem('mtk_locale', locale);

    // Update document immediately
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ur' ? 'rtl' : 'ltr';

    if (locale === 'ur') {
      document.body.classList.add('font-urdu');
    } else {
      document.body.classList.remove('font-urdu');
    }

    setCurrentLocale(locale);
    setIsOpen(false);

    // Refresh server components
    router.refresh();
  };

  return (
    <div className='relative inline-block text-left'>
      <button
        type='button'
        id='language-switcher-btn'
        aria-label='Change language'
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/50 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-white/80 dark:bg-slate-800/50 dark:text-neutral-200 dark:hover:bg-slate-700/50'
      >
        <Globe className='h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400' />
        <span>{currentLocale === 'ur' ? 'اردو' : 'EN'}</span>
      </button>

      {isOpen && (
        <div
          className='animate-in fade-in zoom-in-95 absolute right-0 z-50 mt-2 w-36 rounded-2xl border border-neutral-200 bg-white py-1 shadow-xl duration-100 dark:border-neutral-800 dark:bg-neutral-900'
          role='menu'
        >
          <button
            type='button'
            onClick={() => switchLanguage('en')}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
              currentLocale === 'en'
                ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <span className='flex items-center gap-2'>
              <span>🇬🇧</span>
              <span>English</span>
            </span>
            {currentLocale === 'en' && <Check className='h-3.5 w-3.5 text-emerald-600' />}
          </button>

          <button
            type='button'
            onClick={() => switchLanguage('ur')}
            className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors ${
              currentLocale === 'ur'
                ? 'bg-emerald-50 font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <span className='font-urdu flex items-center gap-2'>
              <span>🇵🇰</span>
              <span>اردو (Urdu)</span>
            </span>
            {currentLocale === 'ur' && <Check className='h-3.5 w-3.5 text-emerald-600' />}
          </button>
        </div>
      )}
    </div>
  );
}
