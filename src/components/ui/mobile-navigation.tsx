'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence, PanInfo, useAnimation } from 'framer-motion';
import {
  Home,
  Users,
  Heart,
  Activity,
  Package,
  DollarSign,
  Menu,
  Settings,
  LogOut,
  Bell,
  Search,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

// Haptic feedback utility
const vibrate = (pattern = [10]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

interface MobileNavigationProps {
  currentPath?: string;
  userName?: string;
  farmName?: string;
  onLogout?: () => void;
}

export function MobileNavigation({
  currentPath: propPath,
  userName = 'John Doe',
  farmName = 'Green Valley Dairy',
  onLogout,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = propPath || pathname || '/';

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);

  // Handle swipe gestures for sidebar
  const onDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > 100) {
      setSidebarOpen(true);
      vibrate();
    } else if (info.offset.x < -100) {
      setSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    vibrate();
    setSidebarOpen(!sidebarOpen);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/dashboard' },
    { id: 'animals', label: 'Animals', icon: Users, href: '/animals', badge: 156 },
    { id: 'milk', label: 'Milk', icon: Package, href: '/milk' },
    { id: 'health', label: 'Health', icon: Heart, href: '/health', badge: 3 },
    { id: 'breeding', label: 'Breeding', icon: Activity, href: '/breeding' },
    { id: 'finance', label: 'Finance', icon: DollarSign, href: '/finance' },
  ];

  const bottomTabs = [
    { id: 'dashboard', label: 'Home', icon: Home, href: '/dashboard' },
    { id: 'animals', label: 'Animals', icon: Users, href: '/animals' },
    { id: 'milk', label: 'Milk', icon: Package, href: '/milk' },
    { id: 'menu', label: 'Menu', icon: Menu, action: () => setBottomSheetOpen(true) },
  ];

  return (
    <>
      <motion.div
        className="fixed top-0 bottom-0 left-0 w-4 z-50 lg:hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={onDragEnd}
      />

      <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50 supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="active:scale-95 transition-transform">
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-semibold text-lg tracking-tight">MTK Dairy</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <Search className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full ring-2 ring-background" />
            </Button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 bottom-0 left-0 w-[80%] max-w-sm bg-background border-r border-border z-50 lg:hidden shadow-2xl"
            >
              <div className="flex flex-col h-full">
                <div className="p-6 border-b border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">JD</div>
                    <div>
                      <h3 className="font-semibold">{userName}</h3>
                      <p className="text-xs text-muted-foreground">{farmName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {navItems.map((item) => (
                    <Button
                      key={item.id}
                      variant={currentPath.startsWith(item.href) ? "secondary" : "ghost"}
                      className="w-full justify-start gap-3 text-base h-12"
                      onClick={() => {
                        vibrate();
                        router.push(item.href);
                        setSidebarOpen(false);
                      }}
                    >
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge variant="outline" className="ml-auto text-xs">{item.badge}</Badge>
                      )}
                    </Button>
                  ))}
                </div>

                <div className="p-4 border-t border-border/50 space-y-2">
                  <Button variant="ghost" className="w-full justify-start gap-3">
                    <Settings className="h-5 w-5" /> Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={onLogout}>
                    <LogOut className="h-5 w-5" /> Logout
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bottomSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBottomSheetOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100) setBottomSheetOpen(false);
              }}
              className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 lg:hidden border-t border-border shadow-xl p-4 min-h-[300px]"
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              <div className="grid grid-cols-4 gap-4">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      vibrate();
                      router.push(item.href);
                      setBottomSheetOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-2 active:scale-95 transition-transform"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <item.icon className="h-6 w-6 text-foreground" />
                    </div>
                    <span className="text-xs font-medium text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 lg:hidden z-40 pb-safe">
        <div className="flex justify-around items-center h-16">
          {bottomTabs.map((tab) => {
            const isActive = tab.href ? currentPath === tab.href : false;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  vibrate([5]);
                  if (tab.action) tab.action();
                  else if (tab.href) router.push(tab.href);
                }}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-[1px] w-8 h-1 bg-primary rounded-b-full shadow-[0_2px_8px_rgba(var(--primary),0.5)]"
                  />
                )}
                <tab.icon className={cn("h-6 w-6", isActive && "fill-current/20")} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="h-16 lg:hidden" />
    </>
  );
}
