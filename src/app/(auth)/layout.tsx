import type { Metadata } from 'next';

// Sign-in / onboarding screens: keep out of search results
export const metadata: Metadata = {
  title: 'Account',
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
