import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getGuide, urduGuides } from '@/content/guides';
import { GuideArticle, guideMetadata } from '@/components/guides/GuideArticle';

export const dynamicParams = false;

export function generateStaticParams() {
  return urduGuides.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  return guide?.ur ? guideMetadata(guide, 'ur') : {};
}

export default async function UrduGuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide?.ur) notFound();
  return <GuideArticle guide={guide} lang='ur' />;
}
