export type GuideCategory = 'Breeds' | 'Health' | 'Breeding' | 'Nutrition' | 'Milk' | 'Management';

export interface GuideFaq {
  q: string;
  a: string;
}

/** Full translation of a guide (currently Urdu, served under /ur). */
export interface GuideTranslation {
  title: string;
  description: string;
  body: string;
  faqs?: GuideFaq[];
}

export interface Guide {
  slug: string;
  title: string;
  /** 150-160 chars: used for meta description and cards */
  description: string;
  category: GuideCategory;
  /** Urdu keyword phrase shown under the title (helps bilingual search) */
  urdu?: string;
  published: string; // YYYY-MM-DD
  updated: string; // YYYY-MM-DD
  readingMinutes: number;
  keywords: string[];
  /**
   * Markdown subset rendered by GuideBody:
   * `## h2`, `### h3`, paragraphs, `- ` bullets, `1. ` numbered lists,
   * `> ` callouts, and **bold**. No raw HTML.
   */
  body: string;
  faqs?: GuideFaq[];
  /** Reputable institutions for further reading (names only, no invented links) */
  furtherReading?: string[];
  related?: string[];
  /** Link to an in-app feature or free tool that helps apply the guide */
  cta?: { label: string; href: string };
  /** Urdu translation; when present the guide is also published at /ur/guides/<slug> */
  ur?: GuideTranslation;
}
