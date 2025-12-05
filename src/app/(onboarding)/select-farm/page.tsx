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
    userMemberships 
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
  const fetchUserFarms = useCallback(async (signal?: AbortSignal) => {
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
      console.error('Error fetching farms:', err);
      setError('Failed to load your farms. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userLoaded, user]);

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
      console.error('Error switching organization:', err);
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
      console.error('Error joining organization:', err);
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading your farms...</p>
        </div>
      </div>
    );
  }
  
  // If organization is set, show redirecting state
  if (organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting to dashboard...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Select Your Farm</h1>
          <p className="text-gray-600 mt-2">Choose a farm to access its dashboard</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-medium mb-2">⚠️ Setup Issue</p>
            <p className="text-red-600 text-sm mb-3">{error}</p>
            {error.includes('Clerk') && (
              <div className="bg-white rounded p-3 text-sm text-gray-700 mb-3">
                <p className="font-medium mb-2">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1 text-left">
                  <li>Go to <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Clerk Dashboard</a></li>
                  <li>Select your application</li>
                  <li>Go to <strong>Organizations</strong> in the sidebar</li>
                  <li>Click <strong>Enable Organizations</strong></li>
                  <li>Return here and try again</li>
                </ol>
              </div>
            )}
            <Button 
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Organizations from Clerk */}
        {hasClerkOrgs ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-700">Your Farms</h2>
            </div>
            <div className="divide-y">
              {clerkOrgs.map((membership) => (
                <button
                  key={membership.organization.id}
                  onClick={() => handleSelectOrg(membership.organization.id)}
                  disabled={switching}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{membership.organization.name}</p>
                      <p className="text-sm text-gray-500 capitalize">{membership.role.replace('org:', '')}</p>
                    </div>
                  </div>
                  {switching ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : approvedApp ? (
          // Approved but no Clerk org yet - show join button
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Farm Approved!</h2>
            <p className="text-gray-600 mb-4">
              Your farm <strong>{approvedApp.farmName}</strong> has been approved.
            </p>
            {approvedApp.assignedFarmId && (
              <div className="bg-emerald-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-500">Farm ID</p>
                <p className="font-mono font-bold text-emerald-600">{approvedApp.assignedFarmId}</p>
              </div>
            )}
            <p className="text-sm text-gray-500 mb-4">
              Click below to join your farm and access the dashboard.
            </p>
            <Button 
              onClick={handleJoinOrg}
              disabled={joining}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Farm
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        ) : pendingApp ? (
          // Pending application
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application Pending</h2>
            <p className="text-gray-600 mb-4">
              Your application for <strong>{pendingApp.farmName}</strong> is being reviewed.
            </p>
            <p className="text-sm text-gray-500">
              We&apos;ll notify you once it&apos;s approved.
            </p>
          </div>
        ) : (
          // No farms or applications
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Farms Yet</h2>
            <p className="text-gray-600 mb-6">
              You don&apos;t have any farms yet. Apply for a Farm ID to get started.
            </p>
            <Button 
              onClick={() => router.push('/apply')}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Apply for Farm ID
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
