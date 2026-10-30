import { AdsenseScript } from '@/components/ads/AdSense';

// Ads load only on content pages (guides/tools), never in the app or on auth pages
export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdsenseScript />
      {children}
    </>
  );
}
