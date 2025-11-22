"use client";

import { usePermissions } from "@/hooks/usePermissions";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlatformRole } from "@/types/roles";

interface Tenant {
  id: string;
  farmName?: string;
  subdomain?: string;
  plan?: string;
  status?: string;
}

export default function SuperAdminTenantsPage() {
  const { isSuperAdmin } = usePermissions();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAllTenants();
    }
  }, [isSuperAdmin]);

  const fetchAllTenants = async () => {
    try {
      const response = await fetch("/api/admin/tenants");
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (tenantId: string) => {
    if (!confirm("Are you sure you want to suspend this tenant?")) return;

    try {
      const response = await fetch(`/api/admin/tenants/${tenantId}/suspend`, {
        method: "POST",
      });

      if (response.ok) {
        alert("Tenant suspended");
        fetchAllTenants();
      } else {
        alert("Failed to suspend tenant");
      }
    } catch (error) {
      console.error("Error suspending tenant:", error);
      alert("Failed to suspend tenant");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole={[PlatformRole.SUPER_ADMIN]}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">All Tenants</h1>
          <p className="text-gray-600 mt-2">Super Admin - Manage all farms</p>
        </div>

        <div className="grid gap-4">
          {tenants.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No tenants found</p>
            </Card>
          ) : (
            tenants.map((tenant) => (
              <Card key={tenant.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {tenant.farmName || "Unnamed Farm"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Plan: {tenant.plan || "free"} | Status:{" "}
                      {tenant.status || "active"}
                    </p>
                    <p className="text-xs text-gray-500">ID: {tenant.id}</p>
                    {tenant.subdomain && (
                      <p className="text-xs text-gray-500">
                        Subdomain: {tenant.subdomain}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        window.open(`/${tenant.subdomain || tenant.id}/dashboard`, "_blank")
                      }
                    >
                      View Dashboard
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleSuspend(tenant.id)}
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

