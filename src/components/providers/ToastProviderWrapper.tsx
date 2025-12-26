'use client';

import { ToastProviderWithState } from '@/components/ui/toast';

interface ToastProviderWrapperProps {
  children: React.ReactNode;
}

export default function ToastProviderWrapper({ children }: ToastProviderWrapperProps) {
  return <ToastProviderWithState>{children}</ToastProviderWithState>;
}
