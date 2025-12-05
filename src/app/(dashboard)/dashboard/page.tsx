"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrganization, useUser } from "@clerk/nextjs";
import { MilkChart } from "@/components/dashboard/MilkChart";
import { AnimalsBySpeciesChart } from "@/components/dashboard/AnimalsBySpeciesChart";
import Link from "next/link";
import { format } from "date-fns";
import { 
  Beef,
  Droplets,
  Egg,
  Crown, 
  TrendingUp, 
  Plus, 
  Settings, 
  Heart,
  ArrowUpRight,
  Sparkles,
  Sun,
  Moon,
  CloudSun,
  Activity,
  Calendar,
  ChevronRight
} from "lucide-react";

// Alias icons for semantic clarity
const CowIcon = Beef;
const MilkIcon = Droplets;

export default function DashboardPageClient() {
  const { organization } = useOrganization();
  const { user } = useUser();
  
  const { data: animalsData, isLoading: animalsLoading } = useQuery({
    queryKey: ["animals"],
    queryFn: async () => {
      const res = await fetch("/api/animals");
      if (!res.ok) return { animals: [] };
      return res.json();
    },
  });

  const { data: milkStats, isLoading: milkLoading } = useQuery({
    queryKey: ["milk-stats"],
    queryFn: async () => {
      const res = await fetch("/api/milk/stats?days=1");
      if (!res.ok) return { todayTotal: 0 };
      return res.json();
    },
  });

  const { data: eggStats } = useQuery({
    queryKey: ["egg-stats"],
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const res = await fetch(`/api/eggs?date=${today}`);
      if (!res.ok) return { logs: [] };
      const data = await res.json();
      const todayTotal = data.logs.reduce((sum: number, log: any) => sum + (log.quantity || 0), 0);
      return { todayTotal };
    },
  });

  const animals = animalsData?.animals || [];
  const totalAnimals = animals.length;
  const milkToday = milkStats?.todayTotal || 0;
  const eggsToday = eggStats?.todayTotal || 0;
  
  const farmName = organization?.name || "Your Farm";
  const userName = user?.firstName || "Farmer";
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: Sun, color: "text-amber-500" };
    if (hour < 17) return { text: "Good Afternoon", icon: CloudSun, color: "text-orange-500" };
    return { text: "Good Evening", icon: Moon, color: "text-indigo-500" };
  };
  
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const statCards = [
    {
      title: "Total Animals",
      value: totalAnimals,
      suffix: "",
      icon: CowIcon,
      gradient: "from-emerald-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      trend: "+12%",
      trendUp: true,
      description: totalAnimals === 0 ? "Add animals to start" : "Active livestock",
      loading: animalsLoading,
    },
    {
      title: "Milk Today",
      value: milkToday.toFixed(1),
      suffix: " L",
      icon: MilkIcon,
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      iconColor: "text-blue-600 dark:text-blue-400",
      trend: "+8%",
      trendUp: true,
      description: milkToday === 0 ? "Start logging milk" : "Today's production",
      loading: milkLoading,
    },
    {
      title: "Eggs Collected",
      value: eggsToday,
      suffix: "",
      icon: Egg,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
      iconBg: "bg-amber-100 dark:bg-amber-900/50",
      iconColor: "text-amber-600 dark:text-amber-400",
      trend: "+5%",
      trendUp: true,
      description: eggsToday === 0 ? "No eggs today" : "Today's collection",
      loading: false,
    },
    {
      title: "Farm Status",
      value: "Active",
      suffix: "",
      icon: Crown,
      gradient: "from-purple-500 to-pink-600",
      bgGradient: "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      iconColor: "text-purple-600 dark:text-purple-400",
      trend: "Free Plan",
      trendUp: null,
      description: "Trial period active",
      loading: false,
    },
  ];

  const quickActions = [
    {
      title: "Add Animal",
      description: "Register new livestock",
      href: "/animals/new",
      icon: CowIcon,
      gradient: "from-emerald-500 to-teal-600",
      bgHover: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
    },
    {
      title: "Log Milk",
      description: "Record milk production",
      href: "/milk/new",
      icon: MilkIcon,
      gradient: "from-blue-500 to-cyan-600",
      bgHover: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
    },
    {
      title: "Health Check",
      description: "Add health records",
      href: "/health",
      icon: Heart,
      gradient: "from-red-500 to-rose-600",
      bgHover: "hover:bg-red-50 dark:hover:bg-red-900/20",
    },
    {
      title: "Farm Settings",
      description: "Configure your farm",
      href: "/settings",
      icon: Settings,
      gradient: "from-gray-500 to-slate-600",
      bgHover: "hover:bg-gray-50 dark:hover:bg-gray-800/50",
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-emerald-100 mb-2">
            <GreetingIcon className={`w-5 h-5 ${greeting.color.replace('text-', 'text-white/')}`} />
            <span className="text-sm font-medium">{greeting.text}</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-1">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-emerald-100 text-sm md:text-base max-w-xl">
            Here&apos;s what&apos;s happening at <span className="font-semibold text-white">{farmName}</span> today. 
            Keep up the great work managing your dairy farm!
          </p>
          
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{format(new Date(), "EEEE, MMMM d")}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${stat.bgGradient} border border-gray-200/50 dark:border-gray-700/50 p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.iconBg} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              {stat.trendUp !== null && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                  stat.trendUp 
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400" 
                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                }`}>
                  {stat.trendUp && <TrendingUp className="w-3 h-3" />}
                  {stat.trend}
                </div>
              )}
              {stat.trendUp === null && (
                <div className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  {stat.trend}
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
              <div className="flex items-baseline gap-1">
                {stat.loading ? (
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ) : (
                  <>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                    <span className="text-lg font-medium text-gray-500 dark:text-gray-400">{stat.suffix}</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">{stat.description}</p>
            </div>
            
            {/* Decorative gradient line at bottom */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Milk Production</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Last 7 days trend</p>
            </div>
            <Link href="/milk" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <MilkChart />
        </div>
        
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Animals by Species</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribution overview</p>
            </div>
            <Link href="/animals" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <AnimalsBySpeciesChart />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Quick Actions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Common tasks at your fingertips</p>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action, index) => (
            <Link
              key={action.title}
              href={action.href}
              className={`group relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 p-5 transition-all duration-300 ${action.bgHover} hover:shadow-md hover:-translate-y-1`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.gradient} text-white mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="w-5 h-5" />
              </div>
              
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {action.title}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer tip */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-500 dark:text-gray-500">
          💡 <span className="font-medium">Tip:</span> Log your milk production daily for accurate analytics
        </p>
      </div>
    </div>
  );
}
