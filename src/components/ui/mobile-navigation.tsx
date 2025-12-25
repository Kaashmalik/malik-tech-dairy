'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Users,
  Heart,
  Activity,
  TrendingUp,
  Calendar,
  Settings,
  LogOut,
  Menu,
  Bell,
  Search,
  Plus,
  ChevronDown,
  Package,
  DollarSign,
  FileText,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="h-5 w-5" />,
    href: '/dashboard',
  },
  {
    id: 'animals',
    label: 'Animals',
    icon: <Users className="h-5 w-5" />,
    href: '/animals',
    badge: 156,
    children: [
      {
        id: 'cattle',
        label: 'Cattle',
        icon: <Users className="h-4 w-4" />,
        href: '/animals/cattle',
      },
      {
        id: 'buffalo',
        label: 'Buffalo',
        icon: <Users className="h-4 w-4" />,
        href: '/animals/buffalo',
      },
    ],
  },
  {
    id: 'milk',
    label: 'Milk Production',
    icon: <Package className="h-5 w-5" />,
    href: '/milk',
  },
  {
    id: 'health',
    label: 'Health',
    icon: <Heart className="h-5 w-5" />,
    href: '/health',
    badge: 3,
  },
  {
    id: 'breeding',
    label: 'Breeding',
    icon: <Activity className="h-5 w-5" />,
    href: '/breeding',
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: <DollarSign className="h-5 w-5" />,
    href: '/finance',
    children: [
      {
        id: 'sales',
        label: 'Sales',
        icon: <TrendingUp className="h-4 w-4" />,
        href: '/finance/sales',
      },
      {
        id: 'expenses',
        label: 'Expenses',
        icon: <FileText className="h-4 w-4" />,
        href: '/finance/expenses',
      },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: <Calendar className="h-5 w-5" />,
    href: '/calendar',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings',
  },
];

interface MobileNavigationProps {
  currentPath?: string;
  userName?: string;
  farmName?: string;
  onLogout?: () => void;
}

export function MobileNavigation({
  currentPath = '/',
  userName = 'John Doe',
  farmName = 'Green Valley Dairy',
  onLogout,
}: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isItemActive = (item: NavItem): boolean => {
    if (currentPath === item.href) return true;
    if (item.children) {
      return item.children.some(child => currentPath === child.href);
    }
    return false;
  };

  const NavItemComponent = ({ item, level = 0 }: { item: NavItem; level?: number }) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              window.location.href = item.href;
            }
          }}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
            level > 0 && 'ml-4',
            isActive
              ? 'bg-blue-600 text-white'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          )}
        >
          <span className="flex-shrink-0">{item.icon}</span>
          <span className="flex-1 text-left">{item.label}</span>
          <div className="flex items-center gap-2">
            {item.badge && (
              <Badge variant="secondary" className="bg-white/20 text-white">
                {item.badge}
              </Badge>
            )}
            {hasChildren && (
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-180'
                )}
              />
            )}
          </div>
        </button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => (
              <NavItemComponent key={child.id} item={child} level={1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 bg-slate-900 border-white/10">
                <div className="flex flex-col h-full">
                  {/* User Info */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {userName.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold">{userName}</p>
                        <p className="text-white/60 text-sm">{farmName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                    {navigationItems.map(item => (
                      <NavItemComponent key={item.id} item={item} />
                    ))}
                  </nav>

                  {/* Logout */}
                  <div className="p-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={onLogout}
                      className="w-full justify-start text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <h1 className="text-lg font-semibold text-white">MTK Dairy</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </div>
      </header>

      {/* Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-white/10 z-40">
        <div className="grid grid-cols-5 gap-1">
          {[
            { id: 'dashboard', icon: <Home className="h-5 w-5" />, label: 'Home' },
            { id: 'animals', icon: <Users className="h-5 w-5" />, label: 'Animals' },
            { id: 'milk', icon: <Package className="h-5 w-5" />, label: 'Milk' },
            { id: 'health', icon: <Heart className="h-5 w-5" />, label: 'Health' },
            { id: 'more', icon: <Menu className="h-5 w-5" />, label: 'More' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'more') {
                  setOpen(true);
                } else {
                  const item = navigationItems.find(n => n.id === tab.id);
                  if (item) window.location.href = item.href;
                }
              }}
              className={cn(
                'flex flex-col items-center gap-1 py-2 px-1 transition-colors',
                currentPath.includes(tab.id) || (tab.id === 'dashboard' && currentPath === '/')
                  ? 'text-blue-400'
                  : 'text-white/60'
              )}
            >
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Add bottom padding to account for tab bar */}
      <div className="h-16" />
    </div>
  );
}

// Desktop Navigation (for comparison)
export function DesktopNavigation({ currentPath = '/' }: { currentPath?: string }) {
  return (
    <aside className="hidden lg:block w-64 backdrop-blur-xl bg-white/5 border-r border-white/10 min-h-screen">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">MTK Dairy</h1>
      </div>
      
      <nav className="px-4 pb-6 space-y-1">
        {navigationItems.map((item) => {
          const isActive = currentPath === item.href;
          return (
            <a
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {item.badge}
                </Badge>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
