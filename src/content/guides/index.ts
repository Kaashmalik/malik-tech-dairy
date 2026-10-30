import type { Guide } from './types';
import { calvingCalendar, heatDetection } from './breeding';
import { heatStress, mastitis, vaccinationSchedule } from './health';
import { fatSnf, increaseMilkYield } from './milk';
import { calfRearing, fodderSilage, recordKeeping } from './management';
import { cattleBreeds, niliRavi } from './breeds';
import { deworming, fmd, lumpySkin, milkFever, tickControl } from './health-2';
import { balancedRation, minerals } from './nutrition';
import { artificialInsemination, cleanMilk, shedDesign } from './farm';
import { beetalGoat, buffaloVsCow, profitability, startDairyFarm } from './business';

import { urduTranslations } from './urdu';

export type { Guide, GuideCategory, GuideFaq, GuideTranslation } from './types';

/** All published guides, in the order shown on /guides. */
const allGuides: Guide[] = [
  vaccinationSchedule,
  heatDetection,
  calvingCalendar,
  fatSnf,
  increaseMilkYield,
  mastitis,
  heatStress,
  fodderSilage,
  calfRearing,
  cattleBreeds,
  niliRavi,
  recordKeeping,
  fmd,
  lumpySkin,
  tickControl,
  deworming,
  milkFever,
  artificialInsemination,
  cleanMilk,
  balancedRation,
  minerals,
  shedDesign,
  buffaloVsCow,
  beetalGoat,
  startDairyFarm,
  profitability,
];

export const guides: Guide[] = allGuides.map(g =>
  urduTranslations[g.slug] ? { ...g, ur: urduTranslations[g.slug] } : g
);

/** Guides that have an Urdu translation (published under /ur/guides). */
export const urduGuides = guides.filter((g): g is Guide & { ur: NonNullable<Guide['ur']> } =>
  Boolean(g.ur)
);

export const guideUrl = (slug: string, lang: 'en' | 'ur' = 'en') =>
  lang === 'ur' ? `/ur/guides/${slug}` : `/guides/${slug}`;

export function getGuide(slug: string): Guide | undefined {
  return guides.find(g => g.slug === slug);
}

export function getRelatedGuides(guide: Guide, limit = 3): Guide[] {
  const explicit = (guide.related || []).map(getGuide).filter((g): g is Guide => Boolean(g));
  const sameCategory = guides.filter(
    g => g.category === guide.category && g.slug !== guide.slug && !explicit.includes(g)
  );
  return [...explicit, ...sameCategory].slice(0, limit);
}
