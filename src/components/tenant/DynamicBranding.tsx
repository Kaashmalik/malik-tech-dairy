'use client';

import { useTenantContext } from './TenantProvider';
import { useEffect } from 'react';
import Image from 'next/image';

/**
 * Applies dynamic branding (colors, logo) from tenant config
 */
export function DynamicBranding() {
  const { config } = useTenantContext();

  useEffect(() => {
    if (!config) return;

    const root = document.documentElement;

    // Apply primary color
    if (config.primaryColor) {
      root.style.setProperty('--tenant-primary', config.primaryColor);
    }

    // Apply accent color
    if (config.accentColor) {
      root.style.setProperty('--tenant-accent', config.accentColor);
    }

    // Apply language direction
    if (config.language === 'ur') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ur');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    }
  }, [config]);

  return null;
}

/**
 * Tenant Logo Component
 */
export function TenantLogo({ className }: { className?: string }) {
  const { config } = useTenantContext();

  if (config?.logoUrl) {
    return (
      <div className={className} style={{ position: 'relative', width: '32px', height: '32px' }}>
        <Image src={config.logoUrl} alt={config.farmName || 'Farm Logo'} fill className="object-contain" sizes="32px" />
      </div>
    );
  }

  // Default logo
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className='bg-primary flex h-8 w-8 items-center justify-center rounded-lg'>
        <span className='text-primary-foreground text-lg font-bold'>M</span>
      </div>
      <span className='text-lg font-semibold'>{config?.farmName || 'MTK Dairy'}</span>
    </div>
  );
}
