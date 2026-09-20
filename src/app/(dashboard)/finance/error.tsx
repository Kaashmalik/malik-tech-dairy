'use client';

import { SegmentError } from '@/components/errors/SegmentError';

export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError error={error} reset={reset} segment='finance' />;
}
