'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@/types/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
  requiredPermission?: { resource: string; action: string };
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = '/unauthorized',
}: ProtectedRouteProps) {
  const { userRole, hasPermission, hasRole, loading } = usePermissions();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Check role requirement
    if (requiredRole && !hasRole(...requiredRole)) {
      router.push(fallbackUrl);
      return;
    }

    // Check permission requirement
    if (
      requiredPermission &&
      !hasPermission(requiredPermission.resource, requiredPermission.action)
    ) {
      router.push(fallbackUrl);
      return;
    }
  }, [
    loading,
    userRole,
    requiredRole,
    requiredPermission,
    hasRole,
    hasPermission,
    router,
    fallbackUrl,
  ]);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
