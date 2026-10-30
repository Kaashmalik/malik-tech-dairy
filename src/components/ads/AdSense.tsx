'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

/**
 * Google AdSense, used only on public content pages (guides, tools).
 * Renders nothing until NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-...) is set.
 * Consent for EEA/UK/CH visitors is handled by Google's certified CMP, enabled in
 * AdSense -> Privacy & messaging (see docs/SETUP.md, AdSense section).
 */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdsenseScript() {
  if (!ADSENSE_CLIENT) return null;
  return (
    <Script
      id='adsense'
      async
      strategy='afterInteractive'
      crossOrigin='anonymous'
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
    />
  );
}

interface AdSlotProps {
  /** Ad unit slot id from AdSense; falls back to NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE */
  slot?: string;
  /** Reserved height prevents layout shift (CLS) while the ad loads */
  minHeight?: number;
  className?: string;
}

export function AdSlot({ slot, minHeight = 280, className }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const adSlot = slot || process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE || '';

  useEffect(() => {
    if (!ADSENSE_CLIENT || !adSlot || !ref.current) return;
    // Only request once per element (React strict mode / re-renders)
    if (ref.current.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers throw here; the reserved space simply stays empty
    }
  }, [adSlot]);

  if (!ADSENSE_CLIENT || !adSlot) return null;

  return (
    <aside aria-label='Advertisement' className={className} style={{ minHeight }}>
      <p className='mb-1 text-center text-[11px] uppercase tracking-wide text-slate-400'>
        Advertisement
      </p>
      <ins
        ref={ref}
        className='adsbygoogle block'
        style={{ display: 'block', minHeight: minHeight - 20 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={adSlot}
        data-ad-format='auto'
        data-full-width-responsive='true'
      />
    </aside>
  );
}
