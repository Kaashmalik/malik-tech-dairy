/**
 * @jest-environment node
 */
import { guides, getGuide, getRelatedGuides, urduGuides } from '@/content/guides';
import { urduTranslations } from '@/content/guides/urdu';
import { guideHeadings, parseGuide } from '@/components/guides/GuideBody';
import { calvingPlan } from '@/components/tools/CalvingDateCalculator';
import { milkPrice } from '@/components/tools/MilkPriceCalculator';

describe('guides content', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = guides.map(g => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(guides.map(g => [g.slug, g]))('%s meets SEO and content rules', (_slug, guide) => {
    // Meta descriptions that Google shows in full
    expect(guide.description.length).toBeGreaterThanOrEqual(110);
    expect(guide.description.length).toBeLessThanOrEqual(175);
    expect(guide.title.length).toBeLessThanOrEqual(95);
    expect(guide.updated >= guide.published).toBe(true);
    // Substantial original content with structure
    const words = guide.body.split(/\s+/).filter(Boolean).length;
    expect(words).toBeGreaterThan(350);
    expect(guideHeadings(guide.body).length).toBeGreaterThanOrEqual(3);
    // No raw HTML in the markdown subset
    expect(guide.body).not.toMatch(/<[a-z]/i);
    // Related links resolve
    for (const slug of guide.related || []) expect(getGuide(slug)).toBeDefined();
  });

  it('returns related guides without the guide itself', () => {
    for (const guide of guides) {
      expect(getRelatedGuides(guide).map(g => g.slug)).not.toContain(guide.slug);
    }
  });

  it('parses lists, callouts and paragraphs', () => {
    const blocks = parseGuide('## A\n\nText one\nline two\n\n- a\n- b\n\n1. x\n2. y\n\n> note');
    expect(blocks.map(b => b.type)).toEqual(['h2', 'p', 'ul', 'ol', 'note']);
  });
});

describe('Urdu translations', () => {
  it('only translate guides that exist', () => {
    for (const slug of Object.keys(urduTranslations)) expect(getGuide(slug)).toBeDefined();
    expect(urduGuides.length).toBe(Object.keys(urduTranslations).length);
  });

  it.each(urduGuides.map(g => [g.slug, g]))('%s is a full Urdu article', (_slug, guide) => {
    const ur = guide.ur!;
    // Mostly Arabic-script text, not an untranslated English copy
    const letters = ur.body.match(/\p{L}/gu) || [];
    const arabic = ur.body.match(/\p{Script=Arabic}/gu) || [];
    expect(arabic.length / letters.length).toBeGreaterThan(0.8);
    expect(ur.body.split(/\s+/).filter(Boolean).length).toBeGreaterThan(250);
    expect(guideHeadings(ur.body).length).toBeGreaterThanOrEqual(3);
    // Every Urdu heading gets a usable anchor id
    for (const h of guideHeadings(ur.body)) expect(h.id.length).toBeGreaterThan(0);
    expect(ur.description.length).toBeGreaterThan(60);
    expect(ur.body).not.toMatch(/<[a-z]/i);
  });
});

describe('calving date calculator', () => {
  it('adds the species gestation and places dry-off 60 days before', () => {
    const plan = calvingPlan('buffalo', new Date('2026-01-01T00:00:00Z'));
    expect(plan.gestationDays).toBe(310);
    expect(plan.due.toISOString().slice(0, 10)).toBe('2026-11-07');
    expect(plan.dryOff.toISOString().slice(0, 10)).toBe('2026-09-08');
  });
});

describe('milk price calculator', () => {
  const base = { litres: 100, fat: 6, snf: 9, tsRate: 0, fatRate: 0, snfRate: 0, litreRate: 0 };

  it('prices on total solids', () => {
    const r = milkPrice({ ...base, method: 'ts', tsRate: 1000 });
    // 100 L * 1.03 = 103 kg; TS 15% = 15.45 kg * 1000
    expect(r.tsKg).toBeCloseTo(15.45, 5);
    expect(r.total).toBeCloseTo(15450, 5);
  });

  it('prices on separate fat and SNF rates', () => {
    const r = milkPrice({ ...base, method: 'fat_snf', fatRate: 1000, snfRate: 500 });
    expect(r.total).toBeCloseTo(6.18 * 1000 + 9.27 * 500, 5);
  });

  it('prices per litre', () => {
    expect(milkPrice({ ...base, method: 'per_litre', litreRate: 200 }).total).toBe(20000);
  });
});
