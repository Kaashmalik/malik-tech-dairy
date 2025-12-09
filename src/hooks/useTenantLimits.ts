'use client';

import { useTenantContext } from '@/components/tenant/TenantProvider';
import { useQuery } from '@tanstack/react-query';
import {
  canAddAnimal,
  canAddUser,
  hasFeature,
  getRemainingAnimalSlots,
  getRemainingUserSlots,
} from '@/lib/utils/limits';

export function useTenantLimits() {
  const { limits, tenantId } = useTenantContext();

  // Fetch current animal count
  const { data: animalCount = 0 } = useQuery({
    queryKey: ['animal-count', tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const res = await fetch('/api/animals/count');
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    enabled: !!tenantId,
  });

  // Fetch current user count
  const { data: userCount = 0 } = useQuery({
    queryKey: ['user-count', tenantId],
    queryFn: async () => {
      if (!tenantId) return 0;
      const res = await fetch('/api/users/count');
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    enabled: !!tenantId,
  });

  return {
    limits,
    animalCount,
    userCount,
    canAddAnimal: canAddAnimal(limits, animalCount),
    canAddUser: canAddUser(limits, userCount),
    hasFeature: (feature: string) => hasFeature(limits, feature),
    remainingAnimalSlots: getRemainingAnimalSlots(limits, animalCount),
    remainingUserSlots: getRemainingUserSlots(limits, userCount),
  };
}
