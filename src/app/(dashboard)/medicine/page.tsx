'use client';

// Medicine Management Page for MTK Dairy
// Tracks medications, inventory, and treatment records

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pill,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  Syringe,
  Stethoscope,
  ChevronRight,
  DollarSign,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  MessageCircle,
} from 'lucide-react';

interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiryDate?: string;
  supplier?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  batchNumber?: string;
  storageLocation?: string;
  minimumStock: number;
  status: 'adequate' | 'low' | 'out_of_stock';
  isExpired: boolean;
  isExpiringSoon: boolean;
}

interface MedicineStats {
  total: number;
  lowStock: number;
  expiringSoon: number;
  expired: number;
  totalValue: number;
}

// Enhanced category config with more farm-specific types
const categoryConfig: Record<string, { color: string; icon: typeof Pill; label: string }> = {
  antibiotic: { color: 'bg-blue-100 text-blue-700', icon: Pill, label: 'Antibiotic' },
  vaccine: { color: 'bg-green-100 text-green-700', icon: Syringe, label: 'Vaccine' },
  antiparasitic: { color: 'bg-amber-100 text-amber-700', icon: Syringe, label: 'Antiparasitic' },
  supplement: { color: 'bg-purple-100 text-purple-700', icon: Pill, label: 'Supplement (Vit/Min)' },
  painkiller: { color: 'bg-red-100 text-red-700', icon: Pill, label: 'Painkiller/NSAID' },
  hormonal: { color: 'bg-pink-100 text-pink-700', icon: Syringe, label: 'Reproductive/Hormonal' },
  disinfectant: { color: 'bg-cyan-100 text-cyan-700', icon: Package, label: 'Disinfectant/Sanitizer' },
  electrolyte: { color: 'bg-yellow-100 text-yellow-700', icon: Package, label: 'Electrolyte/Fluid' },
  topical: { color: 'bg-indigo-100 text-indigo-700', icon: Package, label: 'Topical/Ointment' },
  other: { color: 'bg-gray-100 text-gray-700', icon: Package, label: 'Other/Equipment' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function MedicinePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'antibiotic',
    stock: 0,
    unit: 'ml',
    expiryDate: '',
    supplier: '',
    purchasePrice: 0,
    minimumStock: 10,
    storageLocation: '',
    notes: '',
  });

  // Fetch medicines
  const { data, isLoading, error } = useQuery<{ medicines: Medicine[]; stats: MedicineStats }>({
    queryKey: ['medicines', selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === 'all'
        ? '/api/medicine'
        : `/api/medicine?category=${selectedCategory}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch medicines');
      return res.json();
    },
  });

  // Add medicine mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/medicine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add medicine');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Medicine added successfully!');
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
      setShowAddDialog(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'antibiotic',
      stock: 0,
      unit: 'ml',
      expiryDate: '',
      supplier: '',
      purchasePrice: 0,
      minimumStock: 10,
      storageLocation: '',
      notes: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(formData);
  };

  const medicines = data?.medicines || [];
  const stats = data?.stats || { total: 0, lowStock: 0, expiringSoon: 0, expired: 0, totalValue: 0 };

  // Filter by search
  const filteredMedicines = medicines.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    med.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (medicine: Medicine) => {
    if (medicine.isExpired) {
      return <Badge className="bg-red-100 text-red-700 border-0">Expired</Badge>;
    }
    if (medicine.isExpiringSoon) {
      return <Badge className="bg-amber-100 text-amber-700 border-0">Expiring Soon</Badge>;
    }
    if (medicine.status === 'out_of_stock') {
      return <Badge className="bg-red-100 text-red-700 border-0">Out of Stock</Badge>;
    }
    if (medicine.status === 'low') {
      return <Badge className="bg-yellow-100 text-yellow-700 border-0">Low Stock</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700 border-0">In Stock</Badge>;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-gray-600">Failed to load medicines</p>
        <Button className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['medicines'] })}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
              <Pill className="h-6 w-6" />
            </div>
            Medicine Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-1 text-gray-600 dark:text-slate-400"
          >
            Track medications, inventory, and treatment records
          </motion.p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Package className="mr-2 h-4 w-4" />
            Order Medicine
          </Button>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-4 md:grid-cols-5"
      >
        {[
          { title: 'Total Medicines', value: stats.total, icon: Package, color: 'from-blue-500 to-cyan-600', trend: '+5%' },
          { title: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'from-amber-500 to-orange-600', alert: true },
          { title: 'Expiring Soon', value: stats.expiringSoon, icon: Clock, color: 'from-yellow-500 to-amber-600', alert: stats.expiringSoon > 0 },
          { title: 'Expired', value: stats.expired, icon: X, color: 'from-red-500 to-rose-600', alert: stats.expired > 0 },
          { title: 'Inventory Value', value: `PKR ${(stats.totalValue / 1000).toFixed(1)}K`, icon: DollarSign, color: 'from-emerald-500 to-teal-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -4 }}
            className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white p-4 shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-slate-400">{stat.title}</p>
                <p className={`mt-1 text-2xl font-bold ${stat.alert ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-lg bg-gradient-to-br ${stat.color} p-2 text-white shadow-md`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 transition-opacity group-hover:opacity-100`} />
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="bg-gray-100 p-1 dark:bg-slate-800">
          <TabsTrigger value="inventory" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Package className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="treatments" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
            <Stethoscope className="mr-2 h-4 w-4" />
            Treatment Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Search and Filter */}
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search medicines, suppliers..."
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
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Medicine Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredMedicines.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600">No medicines found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try a different search term' : 'Add your first medicine to get started'}
                </p>
                <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Medicine
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
              {filteredMedicines.map((medicine) => {
                const catConfig = categoryConfig[medicine.category] || categoryConfig.other;

                return (
                  <motion.div
                    key={medicine.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    className="group overflow-hidden rounded-xl border border-gray-200/50 bg-white shadow-sm transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                  >
                    <div className={`h-1 bg-gradient-to-r ${medicine.isExpired || medicine.status === 'out_of_stock'
                      ? 'from-red-500 to-rose-500'
                      : medicine.status === 'low' || medicine.isExpiringSoon
                        ? 'from-amber-500 to-orange-500'
                        : 'from-emerald-500 to-teal-500'
                      }`} />

                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${catConfig.color}`}>
                            <catConfig.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{medicine.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">{catConfig.label}</p>
                          </div>
                        </div>
                        {getStatusBadge(medicine)}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-lg bg-gray-50 p-2 dark:bg-slate-700/50">
                          <p className="text-xs text-gray-500 dark:text-slate-400">Stock</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {medicine.stock} {medicine.unit}
                          </p>
                        </div>
                        {medicine.expiryDate && (
                          <div className="rounded-lg bg-gray-50 p-2 dark:bg-slate-700/50">
                            <p className="text-xs text-gray-500 dark:text-slate-400">Expires</p>
                            <p className={`font-semibold ${medicine.isExpired ? 'text-red-600' :
                              medicine.isExpiringSoon ? 'text-amber-600' : 'text-gray-900 dark:text-white'
                              }`}>
                              {new Date(medicine.expiryDate).toLocaleDateString('en-PK')}
                            </p>
                          </div>
                        )}
                        {medicine.supplier && (
                          <div className="col-span-2 rounded-lg bg-gray-50 p-2 dark:bg-slate-700/50">
                            <p className="text-xs text-gray-500 dark:text-slate-400">Supplier</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{medicine.supplier}</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-3 dark:border-slate-700">
                        {medicine.purchasePrice && (
                          <span className="text-sm font-medium text-emerald-600">
                            PKR {medicine.purchasePrice.toLocaleString()}
                          </span>
                        )}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4 text-gray-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600">
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
        </TabsContent>

        <TabsContent value="treatments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Records</CardTitle>
              <CardDescription>Medicine administration records for your animals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Stethoscope className="mb-4 h-16 w-16 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-600">No treatment records yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Treatment records will appear here when you administer medicine to your animals
                </p>
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Record Treatment
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vet Contact Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="overflow-hidden rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg"
      >
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-white/20 p-3">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Need Veterinary Guidance?</h3>
              <p className="text-green-100">Our MTK Dairy team is available 24/7 for medicine and treatment advice</p>
            </div>
          </div>
          <Button
            onClick={() => {
              const message = encodeURIComponent(
                `Assalam o Alaikum MTK Dairy Team!\n\nI need guidance about medicine/treatment for my animal.\n\n*Details:*\n- Animal: [Type]\n- Issue: [Describe]\n\nJazakAllah!`
              );
              window.open(`https://wa.me/923038111297?text=${message}`, '_blank');
            }}
            className="bg-white text-emerald-600 hover:bg-green-50"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat with Vet
          </Button>
        </div>
      </motion.div>

      {/* Add Medicine Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Pill className="h-5 w-5 text-emerald-600" />
              </div>
              Add New Medicine
            </DialogTitle>
            <DialogDescription>
              Add a new medicine to your inventory
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Medicine Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Penicillin G"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-950 dark:text-slate-50"
                >
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <option key={key} value={key} className="bg-white dark:bg-slate-950">
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 dark:bg-slate-950 dark:text-slate-50"
                >
                  <option value="ml" className="bg-white dark:bg-slate-950">ml (Milliliter)</option>
                  <option value="l" className="bg-white dark:bg-slate-950">L (Liter)</option>
                  <option value="mg" className="bg-white dark:bg-slate-950">mg (Milligram)</option>
                  <option value="g" className="bg-white dark:bg-slate-950">g (Gram)</option>
                  <option value="kg" className="bg-white dark:bg-slate-950">kg (Kilogram)</option>
                  <option value="tablets" className="bg-white dark:bg-slate-950">Tablets/Bolus</option>
                  <option value="bottles" className="bg-white dark:bg-slate-950">Bottles</option>
                  <option value="vials" className="bg-white dark:bg-slate-950">Vials</option>
                  <option value="doses" className="bg-white dark:bg-slate-950">Doses</option>
                  <option value="tubes" className="bg-white dark:bg-slate-950">Tubes</option>
                  <option value="sachets" className="bg-white dark:bg-slate-950">Sachets</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Current Stock</label>
                <Input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Minimum Stock Alert</label>
                <Input
                  type="number"
                  value={formData.minimumStock}
                  onChange={(e) => setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 10 })}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Expiry Date</label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Purchase Price (PKR)</label>
                <Input
                  type="number"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: parseInt(e.target.value) || 0 })}
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Supplier</label>
              <Input
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g., VetMed Inc"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Storage Location</label>
              <Input
                value={formData.storageLocation}
                onChange={(e) => setFormData({ ...formData, storageLocation: e.target.value })}
                placeholder="e.g., Cold Storage Room A"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Medicine
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
