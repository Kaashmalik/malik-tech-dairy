import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * MTK Dairy brand mark. Inline SVG so it renders crisply at any size with no extra request.
 * Kept in sync with public/brand/logo-mark.svg (the source for all generated favicons/app icons).
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  const gradientId = `mtk-logo-bg-${useId().replace(/:/g, '')}`;

  return (
    <svg
      viewBox='0 0 512 512'
      className={cn('h-10 w-10 shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <defs>
        <linearGradient id={gradientId} x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stopColor='#10B981' />
          <stop offset='1' stopColor='#047857' />
        </linearGradient>
      </defs>
      <rect width='512' height='512' rx='116' fill={`url(#${gradientId})`} />
      <path fill='#FFFFFF' d='M178 176C146 158 124 128 120 86c30 28 66 44 104 54z' />
      <path fill='#FFFFFF' d='M334 176c32-18 54-48 58-90-30 28-66 44-104 54z' />
      <path fill='#FFFFFF' d='M174 200c-40-16-80-10-108 18 30 26 72 30 112 14z' />
      <path fill='#FFFFFF' d='M338 200c40-16 80-10 108 18-30 26-72 30-112 14z' />
      <path
        fill='#FFFFFF'
        d='M256 132c64 0 102 30 102 86 0 46-14 84-26 116H180c-12-32-26-70-26-116 0-56 38-86 102-86z'
      />
      <ellipse cx='256' cy='354' rx='98' ry='70' fill='#FDE68A' />
      <path fill='#10B981' d='M256 154c-16 22-26 38-26 52a26 26 0 0 0 52 0c0-14-10-30-26-52z' />
      <circle cx='210' cy='244' r='15' fill='#064E3B' />
      <circle cx='302' cy='244' r='15' fill='#064E3B' />
      <ellipse cx='224' cy='356' rx='14' ry='19' fill='#92400E' />
      <ellipse cx='288' cy='356' rx='14' ry='19' fill='#92400E' />
    </svg>
  );
}
