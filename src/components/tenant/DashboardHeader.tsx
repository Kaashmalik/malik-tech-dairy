'use client';

import { useState, useEffect } from 'react';
import { useOrganization } from '@clerk/nextjs';
import { UserButton, OrganizationSwitcher, useUser, useClerk } from '@clerk/nextjs';
import { usePermissions } from '@/hooks/usePermissions';
import { ROLE_DISPLAY_NAMES } from '@/types/roles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Package,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
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
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

// Alias icons for semantic clarity
const Cow = Beef;
const Milk = Droplets;

export function DashboardHeader() {
  const { canAccessModule, isSuperAdmin, userRole } = usePermissions();
  const { organization } = useOrganization();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Fix hydration mismatch - only render dynamic content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get farm name from Clerk organization - use placeholder during SSR
  const farmName = mounted ? (organization?.name || 'Your Farm') : 'Your Farm';

  // Get user display name - use placeholder during SSR
  const userDisplayName = mounted
    ? (user?.firstName || user?.username || user?.emailAddresses?.[0]?.emailAddress || 'User')
    : 'User';

  // Handle sign out
  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/sign-in' });
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      module: 'dashboard',
    },
    {
      label: 'Animals',
      href: '/animals',
      icon: Cow,
      module: 'animals',
    },
    {
      label: 'Milk',
      href: '/milk',
      icon: Milk,
      module: 'milk',
    },
    {
      label: 'Health',
      href: '/health',
      icon: Heart,
      module: 'health',
    },
    {
      label: 'Breeding',
      href: '/breeding',
      icon: Baby,
      module: 'breeding',
    },
    {
      label: 'Diseases',
      href: '/diseases',
      icon: Bug,
      module: 'health',
    },
    {
      label: 'Medicine',
      href: '/medicine',
      icon: Pill,
      module: 'health',
    },
    {
      label: 'Finance',
      href: '/finance',
      icon: DollarSign,
      module: 'expenses',
    },
    {
      label: 'Assets',
      href: '/assets',
      icon: Package,
      module: 'expenses',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      module: 'analytics',
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      module: 'settings',
    },
    {
      label: 'Help',
      href: '/help',
      icon: HelpCircle,
      module: 'dashboard',
    },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <header className='sticky top-0 z-50 w-full glass-panel border-b border-white/20 dark:border-white/10'>
        <div className='container flex h-16 items-center justify-between px-4'>
          {/* Logo & Farm Name */}
          <div className='flex items-center gap-4'>
            <Link href='/dashboard' className='group flex items-center gap-3'>
              <div className='relative'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/50'>
                  🐄
                </div>
              </div>
              <div className='hidden sm:block'>
                <h1 className='text-lg font-bold leading-tight text-gray-900 dark:text-white'>
                  {mounted ? farmName : '...'}
                </h1>
              </div>
            </Link>
          </div>

          {!mounted ? (
            <div className="flex-1" /> /* Skeleton or empty during API load/SSR to verify hydration */
          ) : (
            /* Full Navigation */
            <>
              <div className='flex items-center gap-4'>
                <div className='hidden md:block'>
                  <OrganizationSwitcher
                    appearance={{
                      elements: {
                        rootBox: 'flex',
                        organizationSwitcherTrigger:
                          'px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/40 glass-panel transition-colors text-sm dark:bg-slate-800/50 dark:hover:bg-slate-700/50',
                      },
                    }}
                    afterSelectOrganizationUrl='/dashboard'
                    afterCreateOrganizationUrl='/dashboard'
                  />
                </div>
              </div>
              {/* Desktop Navigation */}
              <nav className='hidden items-center gap-1 rounded-2xl bg-white/40 p-1 lg:flex dark:bg-slate-800/40 backdrop-blur-sm border border-white/10'>

                {navItems.slice(0, 7).map(item => {
                  if (!canAccessModule(item.module)) return null;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${active
                        ? 'bg-white shadow-sm text-emerald-700 dark:bg-slate-700 dark:text-emerald-400'
                        : 'text-gray-600 hover:bg-white/50 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-white'
                        }`}
                    >
                      <item.icon className={`h-4 w-4 ${active ? 'text-emerald-500' : ''}`} />
                      {item.label}
                    </Link>
                  );
                })}
                {/* Simple Dropdown for 'More' could be added here if needed */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden xl:flex gap-1 px-2 text-gray-500 dark:text-gray-400">
                      More...
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {navItems.slice(7).map(item => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" /> {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {isSuperAdmin && (
                  <Link
                    href='/super-admin'
                    className='flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-purple-600 transition-all duration-200 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30'
                  >
                    <Shield className='h-4 w-4' />
                    Admin
                  </Link>
                )}
              </nav>

              {/* Right side */}
              <div className='flex items-center gap-2'>
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Search button */}
                <button
                  className='group hidden rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 md:flex dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-white/20'
                  title='Search (⌘K)'
                  aria-label='Search'
                >
                  <Search className='h-4 w-4 text-gray-500 group-hover:text-gray-700 dark:text-slate-400 dark:group-hover:text-slate-300' />
                  <span className='ml-2 text-xs text-gray-400 group-hover:text-gray-600 dark:text-slate-500 dark:group-hover:text-slate-400'>
                    ⌘K
                  </span>
                </button>

                {/* Notifications */}
                <button
                  className='relative rounded-xl bg-white/50 p-2.5 transition-colors hover:bg-white/80 dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-white/20'
                  aria-label='Notifications'
                >
                  <Bell className='h-4 w-4 text-gray-500 dark:text-slate-400' />
                  <span className='absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 animate-pulse'></span>
                </button>

                {userRole && (
                  <span className='hidden rounded-full border border-emerald-200/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-3 py-1.5 text-xs font-medium text-emerald-700 md:block dark:border-emerald-700/30 dark:from-emerald-900/30 dark:to-teal-900/30 dark:text-emerald-400 glass-panel'>
                    {ROLE_DISPLAY_NAMES[userRole]}
                  </span>
                )}

                <div className='ml-1'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        className='relative h-9 w-9 rounded-full p-0 ring-2 ring-emerald-500/20 ring-offset-2 ring-offset-white hover:bg-gray-100 dark:ring-offset-slate-900 dark:hover:bg-slate-800 transition-all active:scale-95'
                        aria-label='User menu'
                      >
                        <div className='flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-sm font-semibold text-white shadow-md'>
                          {userDisplayName.charAt(0).toUpperCase()}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className='w-64 glass-panel border-white/20' align='end' forceMount>
                      <DropdownMenuLabel className='font-normal'>
                        <div className='flex flex-col space-y-1'>
                          <p className='text-sm font-medium leading-none'>{userDisplayName}</p>
                          <p className='text-muted-foreground text-xs leading-none'>
                            {user?.emailAddresses?.[0]?.emailAddress}
                          </p>
                          <div className='mt-1 flex items-center gap-2'>
                            <Badge variant='outline' className='text-xs'>
                              {(userRole && ROLE_DISPLAY_NAMES[userRole]) || 'Member'}
                            </Badge>
                            <Badge variant='secondary' className='text-xs'>
                              {farmName}
                            </Badge>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

                      {/* User Profile Section */}
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href='/profile' className='flex cursor-pointer items-center'>
                            <User className='mr-2 h-4 w-4' />
                            Profile Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href='/subscription' className='flex cursor-pointer items-center'>
                            <CreditCard className='mr-2 h-4 w-4' />
                            Subscription
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

                      {/* Organization Management */}
                      <DropdownMenuGroup>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className='flex items-center'>
                            <Building className='mr-2 h-4 w-4' />
                            Organization
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent className='w-48 glass-panel'>
                            <DropdownMenuItem asChild>
                              <Link href='/settings/domain' className='cursor-pointer'>
                                Domain Settings
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href='/settings/custom-fields' className='cursor-pointer'>
                                Custom Fields
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href='/staff' className='cursor-pointer'>
                                Staff Management
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      </DropdownMenuGroup>

                      {/* Super Admin Section */}
                      {isSuperAdmin && (
                        <>
                          <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href='/super-admin' className='flex cursor-pointer items-center'>
                                <Shield className='mr-2 h-4 w-4' />
                                <div className='flex w-full items-center justify-between'>
                                  <span>Admin Dashboard</span>
                                  <Badge variant='destructive' className='ml-2 text-xs'>
                                    ADMIN
                                  </Badge>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href='/super-admin/migration/dashboard'
                                className='flex cursor-pointer items-center'
                              >
                                <Crown className='mr-2 h-4 w-4' />
                                Migration Monitor
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </>
                      )}

                      <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

                      {/* Help & Support */}
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href='/help' className='flex cursor-pointer items-center'>
                            <HelpCircle className='mr-2 h-4 w-4' />
                            Help & Support
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>

                      <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

                      {/* Sign Out */}
                      <DropdownMenuItem
                        className='cursor-pointer text-red-600 focus:text-red-600'
                        onClick={handleSignOut}
                      >
                        <LogOut className='mr-2 h-4 w-4' />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className='rounded-xl bg-white/50 p-2 transition-colors hover:bg-white/80 lg:hidden dark:bg-slate-800/50 dark:hover:bg-slate-700/50 border border-white/20'
                  aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                >
                  {mobileMenuOpen ? (
                    <X className='h-5 w-5 text-gray-600 dark:text-slate-300' />
                  ) : (
                    <Menu className='h-5 w-5 text-gray-600 dark:text-slate-300' />
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-0 top-16 z-40 bg-white/95 backdrop-blur-xl lg:hidden dark:bg-slate-900/95 border-t border-gray-200 dark:border-gray-800'
          >
            <nav className='container max-h-[calc(100vh-4rem)] space-y-1 overflow-y-auto px-4 py-4'>
              {/* Debug: Always show Dashboard as fallback */}
              <Link
                href='/dashboard'
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${isActive('/dashboard')
                  ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'text-gray-700 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                  }`}
              >
                <Home className='h-5 w-5' />
                Dashboard
              </Link>

              {/* Permission-based navigation items */}
              {navItems.map(item => {
                if (!canAccessModule(item.module)) return null;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-all ${active
                      ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'text-gray-700 hover:bg-gray-100/50 dark:text-slate-300 dark:hover:bg-slate-800/50'
                      }`}
                  >
                    <item.icon className='h-5 w-5' />
                    {item.label}
                  </Link>
                );
              })}

              {/* User info section */}
              <div className='mt-4 border-t border-gray-200/50 pt-4 dark:border-slate-700/50'>
                <div className='px-4 py-2'>
                  <p className='text-sm font-medium text-gray-900 dark:text-white'>
                    {userDisplayName}
                  </p>
                  <p className='text-xs text-gray-500 dark:text-slate-400'>
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </p>
                  <div className='mt-2 flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs'>
                      {(userRole && ROLE_DISPLAY_NAMES[userRole]) || 'Member'}
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
                className='flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
              >
                <LogOut className='h-5 w-5' />
                Sign Out
              </button>

              {isSuperAdmin && (
                <Link
                  href='/super-admin'
                  onClick={() => setMobileMenuOpen(false)}
                  className='flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-purple-600 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30'
                >
                  <Shield className='h-5 w-5' />
                  Super Admin
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
