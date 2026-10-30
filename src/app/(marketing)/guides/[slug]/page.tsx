import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGuide, guides } from '@/content/guides';
import { GuideArticle, guideMetadata } from '@/components/guides/GuideArticle';

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  return guide ? guideMetadata(guide, 'en') : {};
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();
  return <GuideArticle guide={guide} lang='en' />;
}
