'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth, useUser } from '@clerk/nextjs';
import { PLAN_FEATURES, PLAN_LIMITS } from '@/lib/subscriptions/constants';
import { SubscriptionPlan, AnimalSpecies } from '@/types';

interface SubscriptionState {
  plan: SubscriptionPlan;
  status: 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due';
  features: string[];
  limits: (typeof PLAN_LIMITS)['free'];
  isLoading: boolean;
  canAccess: (feature: string) => boolean;
  canCreate: (resource: 'animals' | 'users' | 'storage', currentCount: number) => boolean;
  isSpeciesAllowed: (species: string) => boolean;
}

export function useSubscription(): SubscriptionState {
  const { orgId } = useAuth();
  const { user } = useUser();

  // Fetch subscription status for the current tenant
  // Note: In a real app we'd have a specific API endpoint for this
  // For now we derive it from organization metadata or fallback
  const { data, isLoading } = useQuery({
    queryKey: ['subscription', orgId],
    queryFn: async () => {
      // Only fetch if we have an orgId
      if (!orgId) return null;

      const res = await fetch(`/api/subscription?tenantId=${orgId}`);
      if (!res.ok) {
        // Fallback to free if API fails or no sub found
        return { plan: 'free', status: 'active' };
      }
      return res.json();
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Default to FREE tier if loading or no data
  const plan = (data?.data?.plan as SubscriptionPlan) || 'free';
  const status = data?.data?.status || 'active'; // Default active to avoid blocking during load

  const limits = PLAN_LIMITS[plan];
  const features = PLAN_FEATURES[plan];

  const canAccess = (feature: string) => {
    // If expired/cancelled, block access to premium features
    if (status !== 'active' && status !== 'trial' && status !== 'past_due') {
      // Only allow basic read-only access
      return feature === 'read_only';
    }
    return features.includes(feature);
  };

  const canCreate = (resource: 'animals' | 'users' | 'storage', currentCount: number) => {
    // Strict block on expiry
    if (status !== 'active' && status !== 'trial' && status !== 'past_due') {
      return false;
    }

    if (plan === 'enterprise') return true;

    switch (resource) {
      case 'animals':
        return currentCount < limits.maxAnimals;
      case 'users':
        return currentCount < limits.maxUsers;
      case 'storage':
        return currentCount < limits.maxStorageMB;
      default:
        return true;
    }
  };

  const isSpeciesAllowed = (species: string) => {
    // Cast to AnimalSpecies to match type, generic check
    return limits.allowedSpecies.includes(species as AnimalSpecies);
  };

  return {
    plan,
    status,
    features,
    limits,
    isLoading,
    canAccess,
    canCreate,
    isSpeciesAllowed,
  };
}
