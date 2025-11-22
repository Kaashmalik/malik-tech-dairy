"use client";

import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { PlatformRole } from "@/types/roles";

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole={[PlatformRole.SUPER_ADMIN]}>
      <div className="p-6">
        <AdminDashboard />
      </div>
    </ProtectedRoute>
  );
}

