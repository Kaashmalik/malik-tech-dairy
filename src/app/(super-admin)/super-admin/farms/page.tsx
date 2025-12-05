// Super Admin - All Farms Management Page
'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  Filter,
  Eye,
  MoreVertical,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
  Loader2,
  ChevronDown,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Farm {
  id: string;
  farmName: string;
  slug: string;
  ownerName?: string;
  email?: string;
  plan: string;
  status: 'active' | 'paused' | 'suspended';
  animalCount: number;
  userCount: number;
  city?: string;
  createdAt: string;
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  professional: 'bg-blue-100 text-blue-700',
  farm: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const statusColors: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
};

export default function FarmsPage() {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFarms();
  }, [planFilter]);

  async function fetchFarms() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/farms');
      const data = await response.json();
      
      if (data.success) {
        setFarms(data.data || []);
      } else {
        // Mock data for demo
        setFarms([
          {
            id: '1',
            farmName: 'Green Valley Dairy',
            slug: 'green-valley',
            ownerName: 'Ahmad Khan',
            email: 'ahmad@example.com',
            plan: 'professional',
            status: 'active',
            animalCount: 45,
            userCount: 3,
            city: 'Lahore',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            farmName: 'Sunrise Farm',
            slug: 'sunrise-farm',
            ownerName: 'Sara Ali',
            email: 'sara@example.com',
            plan: 'free',
            status: 'active',
            animalCount: 5,
            userCount: 1,
            city: 'Karachi',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch farms:', error);
      setFarms([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = farm.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      farm.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlan = planFilter === 'all' || farm.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Page Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold dark:text-white">All Farms</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            Manage all registered farms on the platform
          </p>
        </div>
        <Link href="/super-admin/farms/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Create Farm
          </Button>
        </Link>
      </div>

      {/* Stats Cards - Scrollable on Mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">{farms.length}</p>
              <p className="text-xs text-gray-500">Total Farms</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">
                {farms.filter(f => f.status === 'active').length}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">
                {farms.reduce((acc, f) => acc + f.userCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold dark:text-white">
                {farms.reduce((acc, f) => acc + f.animalCount, 0)}
              </p>
              <p className="text-xs text-gray-500">Animals</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters - Stacked on Mobile */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search farms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-40 h-11">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="farm">Farm</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Farms List - Card Layout for Mobile, Table for Desktop */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">Loading farms...</p>
          </div>
        ) : filteredFarms.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No farms found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700">
              {filteredFarms.map((farm) => (
                <div key={farm.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate dark:text-white">{farm.farmName}</h3>
                      <p className="text-sm text-gray-500 truncate">{farm.ownerName}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <ExternalLink className="w-4 h-4 mr-2" /> Open Dashboard
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Pause className="w-4 h-4 mr-2" /> Pause Farm
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${planColors[farm.plan]}`}>
                      {farm.plan}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[farm.status]}`}>
                      {farm.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {farm.userCount}
                    </span>
                    <span className="flex items-center gap-1">
                      🐄 {farm.animalCount}
                    </span>
                    {farm.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" /> {farm.city}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredFarms.map((farm) => (
                    <tr key={farm.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium dark:text-white">{farm.farmName}</p>
                          <p className="text-sm text-gray-500">{farm.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="dark:text-white">{farm.ownerName || '-'}</p>
                          <p className="text-sm text-gray-500">{farm.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${planColors[farm.plan]}`}>
                          {farm.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[farm.status]}`}>
                          {farm.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" /> {farm.userCount}
                          </span>
                          <span>🐄 {farm.animalCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(farm.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Actions <ChevronDown className="w-4 h-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" /> Open Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Pause className="w-4 h-4 mr-2" /> Pause Farm
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
