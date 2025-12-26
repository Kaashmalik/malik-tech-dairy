import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TenantProvider } from '@/components/tenant/TenantProvider';
import { DynamicBranding } from '@/components/tenant/DynamicBranding';
import { DashboardHeader } from '@/components/tenant/DashboardHeader';
import { CommandPalette } from '@/components/ui/command-palette';
import { WhatsAppButton } from '@/components/ui/whatsapp-button';
import ToastProviderWrapper from '@/components/providers/ToastProviderWrapper';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!orgId) {
    // Redirect to farm selection page instead of onboarding
    redirect('/select-farm');
  }

  return (
    <QueryProvider>
      <TenantProvider>
        <ToastProviderWrapper>
          <DynamicBranding />
          <div className='bg-background min-h-screen'>
            <DashboardHeader />
            <main className='container mx-auto px-4 py-6'>{children}</main>
          </div>
          <CommandPalette />
          <WhatsAppButton />
        </ToastProviderWrapper>
      </TenantProvider>
    </QueryProvider>
  );
}
