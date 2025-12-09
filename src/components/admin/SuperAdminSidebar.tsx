'use client';

// Super Admin Sidebar Component
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Building2,
  CreditCard,
  Settings,
  BarChart3,
  Bell,
  Shield,
  LogOut,
} from 'lucide-react';
import { UserButton } from '@clerk/nextjs';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/super-admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Farm Applications',
    href: '/super-admin/applications',
    icon: FileText,
    badge: 'pending',
  },
  {
    title: 'All Farms',
    href: '/super-admin/farms',
    icon: Building2,
  },
  {
    title: 'Users',
    href: '/super-admin/users',
    icon: Users,
  },
  {
    title: 'Payments',
    href: '/super-admin/payments',
    icon: CreditCard,
  },
  {
    title: 'Analytics',
    href: '/super-admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Notifications',
    href: '/super-admin/notifications',
    icon: Bell,
  },
  {
    title: 'Security',
    href: '/super-admin/security',
    icon: Shield,
  },
  {
    title: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
  },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className='flex w-64 flex-col bg-slate-900 text-white'>
      {/* Logo */}
      <div className='border-b border-slate-700 p-6'>
        <Link href='/super-admin' className='flex items-center gap-2'>
          <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500'>
            <Shield className='h-6 w-6 text-white' />
          </div>
          <div>
            <h1 className='text-lg font-bold'>Malik Tech</h1>
            <p className='text-xs text-slate-400'>Super Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className='flex-1 space-y-1 overflow-y-auto p-4'>
        {sidebarItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/super-admin' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className='h-5 w-5' />
              <span className='flex-1'>{item.title}</span>
              {item.badge && (
                <span className='rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white'>
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className='border-t border-slate-700 p-4'>
        <div className='flex items-center gap-3 px-4 py-3'>
          <UserButton
            afterSignOutUrl='/sign-in'
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
              },
            }}
          />
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-medium'>Super Admin</p>
            <p className='truncate text-xs text-slate-400'>Platform Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
