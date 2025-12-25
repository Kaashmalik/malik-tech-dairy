// Farm Selection Page - User selects which farm to access
'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useOrganizationList, useOrganization } from '@clerk/nextjs';
import { Building2, Loader2, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
interface Farm {
  id: string;
  name: string;
  slug: string;
  role: string;
}
interface Application {
  id: string;
  farmName: string;
  status: string;
  assignedFarmId?: string;
}
interface UserFarmsData {
  farms: Farm[];
  applications: Application[];
  hasFarms: boolean;
}
export default function SelectFarmPage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const {
    isLoaded: orgsLoaded,
    setActive,
    userMemberships,
  } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [userFarms, setUserFarms] = useState<UserFarmsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasRedirected = useRef(false);
  // If already in an organization, redirect to dashboard
  useEffect(() => {
    if (orgLoaded && organization && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/dashboard');
    }
  }, [organization, orgLoaded, router]);
  // Fetch user farms from our API with cleanup
  const fetchUserFarms = useCallback(
    async (signal?: AbortSignal) => {
      if (!userLoaded || !user) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/user/farms', { signal });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setUserFarms(data.data);
        } else {
          setError(data.error || 'Failed to load your farms');
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err?.name === 'AbortError') return;
        setError('Failed to load your farms. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [userLoaded, user]
  );
  useEffect(() => {
    const controller = new AbortController();
    fetchUserFarms(controller.signal);
    return () => controller.abort();
  }, [fetchUserFarms]);
  // Handle switching to an organization
  async function handleSelectOrg(orgId: string) {
    if (!setActive) return;
    setSwitching(true);
    try {
      await setActive({ organization: orgId });
      router.push('/dashboard');
    } catch (err) {
      setError('Failed to switch to this farm. Please try again.');
      setSwitching(false);
    }
  }
  // Handle joining organization for approved users
  async function handleJoinOrg() {
    setJoining(true);
    setError(null);
    try {
      const response = await fetch('/api/user/join-org', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // Refresh the page to get updated memberships
        window.location.reload();
      } else {
        // Show detailed error if available
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to join organization';
        setError(errorMsg);
      }
    } catch (err) {
      setError('Failed to join organization. Please try again.');
    } finally {
      setJoining(false);
    }
  }
  // Handle retry
  const handleRetry = () => {
    const controller = new AbortController();
    fetchUserFarms(controller.signal);
  };
  // Loading state - wait for all required data
  const isLoading = loading || !userLoaded || !orgsLoaded || !orgLoaded;
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50'>
        <div className='text-center'>
          <Loader2 className='mx-auto h-12 w-12 animate-spin text-emerald-600' />
          <p className='mt-4 text-gray-600'>Loading your farms...</p>
        </div>
      </div>
    );
  }
  // If organization is set, show redirecting state
  if (organization) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50'>
        <div className='text-center'>
          <Loader2 className='mx-auto h-12 w-12 animate-spin text-emerald-600' />
          <p className='mt-4 text-gray-600'>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }
  // Get Clerk organizations
  const clerkOrgs = userMemberships?.data || [];
  // Check if user has any organizations in Clerk
  const hasClerkOrgs = clerkOrgs.length > 0;
  // Check for approved application without Clerk org
  const approvedApp = userFarms?.applications?.find(app => app.status === 'approved');
  const pendingApp = userFarms?.applications?.find(
    app => app.status === 'pending' || app.status === 'payment_uploaded'
  );
  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 px-4 py-12'>
      <div className='mx-auto max-w-lg'>
        {/* Header */}
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
            <Building2 className='h-8 w-8 text-emerald-600' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900'>Select Your Farm</h1>
          <p className='mt-2 text-gray-600'>Choose a farm to access its dashboard</p>
        </div>
        {/* Error message */}
        {error && (
          <div className='mb-6 rounded-lg border border-red-200 bg-red-50 p-4'>
            <p className='mb-2 font-medium text-red-600'>⚠️ Setup Issue</p>
            <p className='mb-3 text-sm text-red-600'>{error}</p>
            {error.includes('Clerk') && (
              <div className='mb-3 rounded bg-white p-3 text-sm text-gray-700'>
                <p className='mb-2 font-medium'>To fix this:</p>
                <ol className='list-inside list-decimal space-y-1 text-left'>
                  <li>
                    Go to{' '}
                    <a
                      href='https://dashboard.clerk.com'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 underline'
                    >
                      Clerk Dashboard
                    </a>
                  </li>
                  <li>Select your application</li>
                  <li>
                    Go to <strong>Organizations</strong> in the sidebar
                  </li>
                  <li>
                    Click <strong>Enable Organizations</strong>
                  </li>
                  <li>Return here and try again</li>
                </ol>
              </div>
            )}
            <Button onClick={handleRetry} variant='outline' size='sm' className='w-full'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>
          </div>
        )}
        {/* Organizations from Clerk */}
        {hasClerkOrgs ? (
          <div className='overflow-hidden rounded-xl bg-white shadow-lg'>
            <div className='border-b bg-gray-50 p-4'>
              <h2 className='font-semibold text-gray-700'>Your Farms</h2>
            </div>
            <div className='divide-y'>
              {clerkOrgs.map(membership => (
                <button
                  key={membership.organization.id}
                  onClick={() => handleSelectOrg(membership.organization.id)}
                  disabled={switching}
                  className='flex w-full items-center justify-between p-4 transition-colors hover:bg-gray-50 disabled:opacity-50'
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100'>
                      <Building2 className='h-5 w-5 text-emerald-600' />
                    </div>
                    <div className='text-left'>
                      <p className='font-medium text-gray-900'>{membership.organization.name}</p>
                      <p className='text-sm capitalize text-gray-500'>
                        {membership.role.replace('org:', '')}
                      </p>
                    </div>
                  </div>
                  {switching ? (
                    <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
                  ) : (
                    <ArrowRight className='h-5 w-5 text-gray-400' />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : approvedApp ? (
          // Approved but no Clerk org yet - show join button
          <div className='rounded-xl bg-white p-6 text-center shadow-lg'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'>
              <CheckCircle2 className='h-8 w-8 text-emerald-600' />
            </div>
            <h2 className='mb-2 text-xl font-bold text-gray-900'>Farm Approved!</h2>
            <p className='mb-4 text-gray-600'>
              Your farm <strong>{approvedApp.farmName}</strong> has been approved.
            </p>
            {approvedApp.assignedFarmId && (
              <div className='mb-4 rounded-lg bg-emerald-50 p-3'>
                <p className='text-sm text-gray-500'>Farm ID</p>
                <p className='font-mono font-bold text-emerald-600'>{approvedApp.assignedFarmId}</p>
              </div>
            )}
            <p className='mb-4 text-sm text-gray-500'>
              Click below to join your farm and access the dashboard.
            </p>
            <Button
              onClick={handleJoinOrg}
              disabled={joining}
              className='w-full bg-emerald-600 hover:bg-emerald-700'
            >
              {joining ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Joining...
                </>
              ) : (
                <>
                  Join Farm
                  <ArrowRight className='ml-2 h-4 w-4' />
                </>
              )}
            </Button>
          </div>
        ) : pendingApp ? (
          // Pending application
          <div className='rounded-xl bg-white p-6 text-center shadow-lg'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100'>
              <AlertCircle className='h-8 w-8 text-amber-600' />
            </div>
            <h2 className='mb-2 text-xl font-bold text-gray-900'>Application Pending</h2>
            <p className='mb-4 text-gray-600'>
              Your application for <strong>{pendingApp.farmName}</strong> is being reviewed.
            </p>
            <p className='text-sm text-gray-500'>We&apos;ll notify you once it&apos;s approved.</p>
          </div>
        ) : (
          // No farms or applications
          <div className='rounded-xl bg-white p-6 text-center shadow-lg'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <Building2 className='h-8 w-8 text-gray-400' />
            </div>
            <h2 className='mb-2 text-xl font-bold text-gray-900'>No Farms Yet</h2>
            <p className='mb-6 text-gray-600'>
              You don&apos;t have any farms yet. Apply for a Farm ID to get started.
            </p>
            <Button
              onClick={() => router.push('/apply')}
              className='w-full bg-emerald-600 hover:bg-emerald-700'
            >
              Apply for Farm ID
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}