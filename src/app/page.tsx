'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const { isSignedIn, isLoaded, orgId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      if (!orgId) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } else {
      // Show marketing page by redirecting to it
      router.push('/marketing');
    }
  }, [isSignedIn, isLoaded, orgId, router]);

  // Return a simple loading state during redirect
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent' />
    </div>
  );
}
