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
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/super-admin" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Malik Tech</h1>
            <p className="text-xs text-slate-400">Super Admin</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/super-admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1">{item.title}</span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                  New
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-4 py-3">
          <UserButton 
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: 'w-10 h-10',
              },
            }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">Super Admin</p>
            <p className="text-xs text-slate-400 truncate">Platform Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
