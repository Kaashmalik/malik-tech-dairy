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
    redirect("/onboarding");
  }

  return (
    <QueryProvider>
      <TenantProvider>
        <DynamicBranding />
        <div className="min-h-screen bg-background">
          <DashboardHeader />
          <main className="container mx-auto py-6">
            {children}
          </main>
        </div>
      </TenantProvider>
    </QueryProvider>
  );
}

