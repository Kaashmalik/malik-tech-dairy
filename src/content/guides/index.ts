import type { Guide } from './types';
import { calvingCalendar, heatDetection } from './breeding';
import { heatStress, mastitis, vaccinationSchedule } from './health';
import { fatSnf, increaseMilkYield } from './milk';
import { calfRearing, fodderSilage, recordKeeping } from './management';
import { cattleBreeds, niliRavi } from './breeds';

export type { Guide, GuideCategory, GuideFaq } from './types';

/** All published guides, in the order shown on /guides. */
export const guides: Guide[] = [
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
];

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
