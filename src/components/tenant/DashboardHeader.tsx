"use client";

import { TenantLogo } from "./DynamicBranding";
import { useTenantContext } from "./TenantProvider";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { ROLE_DISPLAY_NAMES } from "@/types/roles";
import Link from "next/link";
import {
  Home,
  Cow,
  Milk,
  Heart,
  Users,
  DollarSign,
  FileText,
  Settings,
  Shield,
} from "lucide-react";

export function DashboardHeader() {
  const { config } = useTenantContext();
  const { canAccessModule, isSuperAdmin, userRole } = usePermissions();

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      module: "dashboard",
    },
    {
      label: "Animals",
      href: "/dashboard/animals",
      icon: Cow,
      module: "animals",
    },
    {
      label: "Milk Production",
      href: "/dashboard/milk",
      icon: Milk,
      module: "milk",
    },
    {
      label: "Health",
      href: "/dashboard/health",
      icon: Heart,
      module: "health",
    },
    {
      label: "Breeding",
      href: "/dashboard/breeding",
      icon: Cow,
      module: "breeding",
    },
    {
      label: "Staff",
      href: "/dashboard/staff",
      icon: Users,
      module: "staff",
    },
    {
      label: "Expenses",
      href: "/dashboard/expenses",
      icon: DollarSign,
      module: "expenses",
    },
    {
      label: "Reports",
      href: "/dashboard/reports",
      icon: FileText,
      module: "reports",
    },
    {
      label: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      module: "settings",
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <TenantLogo className="h-8" />
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            if (!canAccessModule(item.module)) return null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
          {isSuperAdmin && (
            <Link
              href="/admin/tenants"
              className="text-sm font-medium transition-colors hover:text-primary flex items-center gap-1"
            >
              <Shield className="w-4 h-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {userRole && (
            <span className="text-xs text-gray-500 hidden sm:block">
              {ROLE_DISPLAY_NAMES[userRole]}
            </span>
          )}
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    </header>
  );
}

