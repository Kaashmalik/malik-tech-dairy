'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Tractor,
  Home,
  Droplets,
  Wrench,
  Truck,
  Thermometer,
  CircuitBoard,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Loader2,
  X,
  Filter,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Asset {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'maintenance' | 'retired';
  purchaseDate: string;
  purchasePrice: number;
  currentValue: number;
  location: string;
  serialNumber?: string;
  warrantyExpiry?: string;
  lastMaintenance?: string;
  notes?: string;
}

const categoryConfig: Record<string, { icon: typeof Tractor; color: string; label: string }> = {
  machinery: { icon: Tractor, color: 'from-amber-500 to-orange-600', label: 'Machinery' },
  buildings: { icon: Home, color: 'from-blue-500 to-cyan-600', label: 'Buildings' },
  irrigation: { icon: Droplets, color: 'from-cyan-500 to-blue-600', label: 'Irrigation' },
  equipment: { icon: Wrench, color: 'from-purple-500 to-violet-600', label: 'Equipment' },
  vehicles: { icon: Truck, color: 'from-emerald-500 to-teal-600', label: 'Vehicles' },
  cooling: { icon: Thermometer, color: 'from-sky-500 to-blue-600', label: 'Cooling Systems' },
  electronics: { icon: CircuitBoard, color: 'from-pink-500 to-rose-600', label: 'Electronics' },
};

const statusConfig = {
  active: { color: 'bg-green-100 text-green-700', label: 'Active', icon: CheckCircle2 },
  maintenance: { color: 'bg-amber-100 text-amber-700', label: 'In Maintenance', icon: Wrench },
  retired: { color: 'bg-gray-100 text-gray-700', label: 'Retired', icon: Clock },
};

// Mock data for demonstration
const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Milking Machine - Deluxe',
    category: 'equipment',
    status: 'active',
    purchaseDate: '2023-06-15',
    purchasePrice: 250000,
    currentValue: 200000,
    location: 'Milking Shed A',
    serialNumber: 'MM-2023-001',
    warrantyExpiry: '2026-06-15',
    lastMaintenance: '2024-09-01',
  },
  {
    id: '2',
    name: 'Tractor - John Deere 5050D',
    category: 'machinery',
    status: 'active',
    purchaseDate: '2022-03-20',
    purchasePrice: 1500000,
    currentValue: 1200000,
    location: 'Main Shed',
    serialNumber: 'JD-5050-2022-PK',
    lastMaintenance: '2024-08-15',
  },
  {
    id: '3',
    name: 'Bulk Milk Cooler - 1000L',
    category: 'cooling',
    status: 'active',
    purchaseDate: '2023-01-10',
    purchasePrice: 180000,
    currentValue: 150000,
    location: 'Cold Storage',
    serialNumber: 'BMC-1000-001',
    warrantyExpiry: '2025-01-10',
  },
  {
    id: '4',
    name: 'Generator - 15KVA',
    category: 'electronics',
    status: 'maintenance',
    purchaseDate: '2021-08-05',
    purchasePrice: 350000,
    currentValue: 200000,
    location: 'Power House',
    lastMaintenance: '2024-10-01',
    notes: 'Scheduled for repair - starter motor issue',
  },
  {
    id: '5',
    name: 'Cattle Shed - Section B',
    category: 'buildings',
    status: 'active',
    purchaseDate: '2020-01-01',
    purchasePrice: 2000000,
    currentValue: 1800000,
    location: 'Farm Area B',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [assets] = useState<Asset[]>(mockAssets);

  // Calculate stats
  const stats = {
    total: assets.length,
    totalValue: assets.reduce((sum, a) => sum + a.currentValue, 0),
    active: assets.filter((a) => a.status === 'active').length,
    inMaintenance: assets.filter((a) => a.status === 'maintenance').length,
    retired: assets.filter((a) => a.status === 'retired').length,
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || asset.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 text-3xl font-bold text-gray-900 dark:text-white"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg">
              <Package className="h-6 w-6" />
            </div>
            Assets Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-gray-600 dark:text-slate-400"
          >
            Track farm equipment, machinery, and infrastructure
          </motion.p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className="bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 md:grid-cols-5"
      >
        {[
          {
            title: 'Total Assets',
            value: stats.total,
            icon: Package,
            color: 'from-blue-500 to-cyan-600',
          },
          {
            title: 'Total Value',
            value: `PKR ${(stats.totalValue / 1000000).toFixed(1)}M`,
            icon: DollarSign,
            color: 'from-emerald-500 to-teal-600',
          },
          {
            title: 'Active',
            value: stats.active,
            icon: CheckCircle2,
            color: 'from-green-500 to-emerald-600',
          },
          {
            title: 'In Maintenance',
            value: stats.inMaintenance,
            icon: Wrench,
            color: 'from-amber-500 to-orange-600',
            alert: stats.inMaintenance > 0,
          },
          {
            title: 'Retired',
            value: stats.retired,
            icon: Clock,
            color: 'from-gray-500 to-slate-600',
          },
        ].map((stat) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white p-4 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{stat.title}</p>
                <p
                  className={`mt-1 text-2xl font-bold ${stat.alert ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}
                >
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2 text-white shadow-md`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search assets, location, serial number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>
              {config.label}
            </option>
          ))}
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="h-11 rounded-lg border border-gray-200 bg-white px-4 text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="maintenance">In Maintenance</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="mb-4 h-16 w-16 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-600">No assets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Add your first asset to get started'}
            </p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredAssets.map((asset) => {
            const catConfig = categoryConfig[asset.category] || categoryConfig.equipment;
            const statConfig = statusConfig[asset.status];
            const StatusIcon = statConfig.icon;

            return (
              <motion.div
                key={asset.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="group overflow-hidden rounded-xl border border-gray-200/50 bg-white shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                <div className={`h-1.5 bg-gradient-to-r ${catConfig.color}`} />

                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-xl bg-gradient-to-br ${catConfig.color} p-3 text-white shadow-md`}
                      >
                        <catConfig.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{asset.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{catConfig.label}</p>
                      </div>
                    </div>
                    <Badge className={`${statConfig.color} border-0`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {statConfig.label}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {asset.location}
                    </div>
                    {asset.serialNumber && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-xs">{asset.serialNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-slate-700/50">
                      <p className="text-xs text-gray-500 dark:text-slate-400">Purchase Value</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        PKR {(asset.purchasePrice / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-900/20">
                      <p className="text-xs text-gray-500 dark:text-slate-400">Current Value</p>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        PKR {(asset.currentValue / 1000).toFixed(0)}K
                      </p>
                    </div>
                  </div>

                  {asset.notes && asset.status === 'maintenance' && (
                    <div className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      ⚠️ {asset.notes}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t pt-3 dark:border-slate-700">
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      Purchased: {format(new Date(asset.purchaseDate), 'MMM yyyy')}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Add Asset Dialog Placeholder */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2">
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              Add New Asset
            </DialogTitle>
            <DialogDescription>Add a new asset to your farm inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Asset Name *</label>
              <Input placeholder="e.g., Milking Machine" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select className="h-10 w-full rounded-lg border px-3">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Status</label>
                <select className="h-10 w-full rounded-lg border px-3">
                  <option value="active">Active</option>
                  <option value="maintenance">In Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Purchase Date</label>
                <Input type="date" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Purchase Price (PKR)</label>
                <Input type="number" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Location</label>
              <Input placeholder="e.g., Main Shed" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Serial Number</label>
              <Input placeholder="Optional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

