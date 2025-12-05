"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { UserButton, OrganizationSwitcher, useUser, useClerk } from "@clerk/nextjs";
import { usePermissions } from "@/hooks/usePermissions";
import { ROLE_DISPLAY_NAMES } from "@/types/roles";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Beef,
  Droplets,
  Heart,
  DollarSign,
  Settings,
  Shield,
  BarChart3,
  Menu,
  X,
  Bug,
  Baby,
  Sparkles,
  Bell,
  Search,
  User,
  CreditCard,
  HelpCircle,
  LogOut,
  Crown,
  Building,
  Pill,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Alias icons for semantic clarity
const Cow = Beef;
const Milk = Droplets;

export function DashboardHeader() {
  const { canAccessModule, isSuperAdmin, userRole } = usePermissions();
  const { organization } = useOrganization();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  
  // Get farm name from Clerk organization
  const farmName = organization?.name || "Your Farm";
  
  // Get user display name
  const userDisplayName = user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress || "User";
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/sign-in' });
  };

  const navItems = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: Home,
      module: "dashboard",
    },
    {
      label: "Animals",
      href: "/animals",
      icon: Cow,
      module: "animals",
    },
    {
      label: "Milk",
      href: "/milk",
      icon: Milk,
      module: "milk",
    },
    {
      label: "Health",
      href: "/health",
      icon: Heart,
      module: "health",
    },
    {
      label: "Breeding",
      href: "/breeding",
      icon: Baby,
      module: "breeding",
    },
    {
      label: "Diseases",
      href: "/diseases",
      icon: Bug,
      module: "health",
    },
    {
      label: "Medicine",
      href: "/medicine",
      icon: Pill,
      module: "health",
    },
    {
      label: "Finance",
      href: "/finance",
      icon: DollarSign,
      module: "expenses",
    },
    {
      label: "Analytics",
      href: "/analytics",
      icon: BarChart3,
      module: "analytics",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      module: "settings",
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo & Farm Name */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300 group-hover:scale-105">
                  🐄
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                  {farmName}
                </h1>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Dairy Management
                </p>
              </div>
            </Link>
            
            {/* Organization Switcher for multiple farms */}
            <div className="hidden md:block">
              <OrganizationSwitcher 
                appearance={{
                  elements: {
                    rootBox: "flex",
                    organizationSwitcherTrigger: "px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
                  }
                }}
                afterSelectOrganizationUrl="/dashboard"
                afterCreateOrganizationUrl="/dashboard"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-gray-100/80 dark:bg-slate-800/50 rounded-xl p-1">
            {navItems.map((item) => {
              console.log('Desktop nav item:', item.label, 'Module:', item.module, 'Can access:', canAccessModule(item.module));
              if (!canAccessModule(item.module)) return null;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                    active
                      ? "bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${active ? "text-emerald-500" : ""}`} />
                  {item.label}
                </Link>
              );
            })}
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
              >
                <Shield className="w-4 h-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Search button */}
            <button 
              className="hidden md:flex p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors group"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4 text-gray-500 dark:text-slate-400 group-hover:text-gray-700 dark:group-hover:text-slate-300" />
              <span className="ml-2 text-xs text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-400">
                ⌘K
              </span>
            </button>
            
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
              <Bell className="w-4 h-4 text-gray-500 dark:text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            {userRole && (
              <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full text-emerald-700 dark:text-emerald-400 font-medium hidden md:block border border-emerald-200/50 dark:border-emerald-700/30">
                {ROLE_DISPLAY_NAMES[userRole]}
              </span>
            )}
            
            <div className="ml-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 hover:bg-gray-100 dark:hover:bg-slate-800 p-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm">
                      {userDisplayName.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.emailAddresses?.[0]?.emailAddress}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {ROLE_DISPLAY_NAMES[userRole] || 'Member'}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {farmName}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  {/* User Profile Section */}
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="flex items-center cursor-pointer">
                        <CreditCard className="mr-2 h-4 w-4" />
                        Subscription
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Organization Management */}
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="flex items-center">
                        <Building className="mr-2 h-4 w-4" />
                        Organization
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href="/settings/domain" className="cursor-pointer">
                            Domain Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/settings/custom-fields" className="cursor-pointer">
                            Custom Fields
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/staff" className="cursor-pointer">
                            Staff Management
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuGroup>
                  
                  {/* Super Admin Section */}
                  {isSuperAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/super-admin" className="flex items-center cursor-pointer">
                            <Shield className="mr-2 h-4 w-4" />
                            <div className="flex items-center justify-between w-full">
                              <span>Admin Dashboard</span>
                              <Badge variant="destructive" className="ml-2 text-xs">
                                ADMIN
                              </Badge>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/super-admin/migration/dashboard" className="flex items-center cursor-pointer">
                            <Crown className="mr-2 h-4 w-4" />
                            Migration Monitor
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  
                  {/* Help & Support */}
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/help" className="flex items-center cursor-pointer">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        Help & Support
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  
                  <DropdownMenuSeparator />
                  
                  {/* Sign Out */}
                  <DropdownMenuItem 
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-slate-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-40 bg-white dark:bg-slate-900 border-t">
          <nav className="container px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Debug: Always show Dashboard as fallback */}
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                isActive("/dashboard")
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Home className="w-5 h-5" />
              Dashboard
            </Link>
            
            {/* Permission-based navigation items */}
            {navItems.map((item) => {
              console.log('Mobile menu item:', item.label, 'Module:', item.module, 'Can access:', canAccessModule(item.module));
              if (!canAccessModule(item.module)) return null;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
            
            {/* User info section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
              <div className="px-4 py-2">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userDisplayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {ROLE_DISPLAY_NAMES[userRole] || 'Member'}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Sign out button */}
            <button
              onClick={() => {
                handleSignOut();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
            
            {isSuperAdmin && (
              <Link
                href="/super-admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
              >
                <Shield className="w-5 h-5" />
                Super Admin
              </Link>
            )}
          </nav>
        </div>
      )}
    </>
  );
}

