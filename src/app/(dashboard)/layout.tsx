import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TenantProvider } from "@/components/tenant/TenantProvider";
import { DynamicBranding } from "@/components/tenant/DynamicBranding";
import { DashboardHeader } from "@/components/tenant/DashboardHeader";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  if (!orgId) {
    // Redirect to farm selection page instead of onboarding
    redirect("/select-farm");
  }

  return (
    <QueryProvider>
      <TenantProvider>
        <DynamicBranding />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20">
          <DashboardHeader />
          <main className="container mx-auto py-6 px-4 md:px-6">
            {children}
          </main>
        </div>
      </TenantProvider>
    </QueryProvider>
  );
}

