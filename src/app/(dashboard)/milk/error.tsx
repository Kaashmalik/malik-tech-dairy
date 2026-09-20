'use client';

import { SegmentError } from '@/components/errors/SegmentError';

export default function MilkError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SegmentError error={error} reset={reset} segment='milk' />;
}
