'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface FeedInventoryTableProps {
  className?: string;
  onDataChange?: () => void;
}

interface FeedItem {
  id: string;
  ingredientName: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  unitCost: number;
  totalValue: number;
  supplierName: string;
  batchNumber: string;
  expiryDate: string;
  storageLocation: string;
  stockStatus: 'critical' | 'low' | 'adequate';
  daysUntilExpiry: number;
}

export function FeedInventoryTable({ className, onDataChange }: FeedInventoryTableProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    feedName: '',
    feedType: 'concentrate',
    quantity: 100,
    unit: 'kg',
    unitPrice: 50,
    minimumStock: 50,
    supplier: '',
    storageLocation: '',
    batchNumber: '',
    expiryDate: '',
  });

  const fetchFeedItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.append('search', search);
      if (categoryFilter) params.append('feedType', categoryFilter);

      const res = await fetch(`/api/feed-management/inventory?${params.toString()}`);
      if (!res.ok) {
        setFeedItems([]);
        return;
      }
      const json = await res.json();
      const rawItems = json.data?.inventory || [];

      const mapped: FeedItem[] = rawItems.map((item: any) => {
        const unitCost = Number(item.unitPrice || 0) / 100;
        const currentStock = Number(item.quantity || 0);
        const reorderLevel = Number(item.minimumStock || 0);
        const stockStatus = currentStock <= reorderLevel ? (currentStock <= reorderLevel / 2 ? 'critical' : 'low') : 'adequate';

        return {
          id: item.id,
          ingredientName: item.feedName,
          category: item.feedType,
          currentStock,
          unit: item.unit || 'kg',
          reorderLevel,
          unitCost,
          totalValue: currentStock * unitCost,
          supplierName: item.supplier || 'Direct Farm Purchase',
          batchNumber: item.batchNumber || '-',
          expiryDate: item.expiryDate || '',
          storageLocation: item.storageLocation || 'Main Barn',
          stockStatus,
          daysUntilExpiry: item.daysToExpiry ?? 90,
        };
      });

      setFeedItems(mapped);
    } catch (error) {
      console.error('Failed to fetch feed inventory:', error);
      toast.error('Failed to load feed inventory');
      setFeedItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedItems();
  }, [categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFeedItems();
  };

  const handleCreateFeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.feedName.trim()) {
      toast.error('Feed name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        feedName: formData.feedName,
        feedType: formData.feedType,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        unitPrice: Math.round(Number(formData.unitPrice) * 100), // convert to paise
        minimumStock: Number(formData.minimumStock),
        purchaseDate: new Date().toISOString(),
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
        supplier: formData.supplier || undefined,
        storageLocation: formData.storageLocation || undefined,
        batchNumber: formData.batchNumber || undefined,
      };

      const res = await fetch('/api/feed-management/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add feed item');
      }

      toast.success('Feed inventory item added successfully');
      setIsAddOpen(false);
      setFormData({
        feedName: '',
        feedType: 'concentrate',
        quantity: 100,
        unit: 'kg',
        unitPrice: 50,
        minimumStock: 50,
        supplier: '',
        storageLocation: '',
        batchNumber: '',
        expiryDate: '',
      });
      fetchFeedItems();
      if (onDataChange) onDataChange();
    } catch (err: any) {
      toast.error(err.message || 'Error adding feed item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from inventory?`)) return;

    try {
      const res = await fetch(`/api/feed-management/inventory?id=${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      toast.success('Feed item removed');
      fetchFeedItems();
      if (onDataChange) onDataChange();
    } catch (err: any) {
      toast.error(err.message || 'Error removing item');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300';
      case 'adequate':
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300';
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <CardTitle className='flex items-center text-xl'>
              <Package className='mr-2 h-5 w-5 text-amber-600' />
              Feed & Ration Inventory
            </CardTitle>
            <p className='text-muted-foreground text-sm mt-1'>
              Real-time stock levels, reorder thresholds, and ration costs.
            </p>
          </div>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm' onClick={fetchFeedItems} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button size='sm' onClick={() => setIsAddOpen(true)}>
              <Plus className='mr-1 h-4 w-4' />
              Add Feed Item
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <div className='flex flex-col sm:flex-row gap-3 pt-4'>
          <form onSubmit={handleSearch} className='flex-1 flex gap-2'>
            <div className='relative flex-1'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search feed by name or supplier...'
                value={search}
                onChange={e => setSearch(e.target.value)}
                className='pl-8'
              />
            </div>
            <Button type='submit' variant='secondary' size='sm'>
              Search
            </Button>
          </form>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className='rounded-md border bg-background px-3 py-1.5 text-sm'
          >
            <option value=''>All Categories</option>
            <option value='concentrate'>Concentrate</option>
            <option value='silage'>Silage</option>
            <option value='hay'>Hay</option>
            <option value='minerals'>Minerals</option>
            <option value='supplements'>Supplements</option>
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className='py-12 text-center'>
            <RefreshCw className='h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2' />
            <p className='text-sm text-muted-foreground'>Loading feed inventory...</p>
          </div>
        ) : feedItems.length === 0 ? (
          <div className='py-16 text-center space-y-3'>
            <Package className='h-10 w-10 text-muted-foreground mx-auto opacity-50' />
            <h4 className='font-semibold text-base'>No feed items recorded</h4>
            <p className='text-sm text-muted-foreground max-w-sm mx-auto'>
              {search || categoryFilter
                ? 'No inventory matched your search filter criteria.'
                : 'Track daily silage, hay, concentrates, and mineral supplements by adding your first batch.'}
            </p>
            <Button size='sm' onClick={() => setIsAddOpen(true)}>
              <Plus className='mr-1 h-4 w-4' />
              Add First Feed Item
            </Button>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b bg-muted/40 text-muted-foreground'>
                  <th className='p-2.5 text-left font-medium'>Ingredient / Item</th>
                  <th className='p-2.5 text-left font-medium'>Category</th>
                  <th className='p-2.5 text-right font-medium'>Current Stock</th>
                  <th className='p-2.5 text-center font-medium'>Status</th>
                  <th className='p-2.5 text-right font-medium'>Unit Cost</th>
                  <th className='p-2.5 text-right font-medium'>Total Value</th>
                  <th className='p-2.5 text-left font-medium'>Location</th>
                  <th className='p-2.5 text-center font-medium'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {feedItems.map(item => (
                  <tr key={item.id} className='hover:bg-muted/30 transition-colors'>
                    <td className='p-2.5'>
                      <div className='font-medium text-foreground'>{item.ingredientName}</div>
                      <div className='text-xs text-muted-foreground'>{item.supplierName}</div>
                    </td>
                    <td className='p-2.5'>
                      <Badge variant='outline' className='capitalize text-xs font-normal'>
                        {item.category}
                      </Badge>
                    </td>
                    <td className='p-2.5 text-right'>
                      <div className='font-semibold'>
                        {item.currentStock.toLocaleString()} {item.unit}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Reorder at {item.reorderLevel} {item.unit}
                      </div>
                    </td>
                    <td className='p-2.5 text-center'>
                      <Badge className={getStockStatusColor(item.stockStatus)}>
                        {item.stockStatus}
                      </Badge>
                    </td>
                    <td className='p-2.5 text-right font-mono text-xs'>
                      {formatCurrency(item.unitCost)} / {item.unit}
                    </td>
                    <td className='p-2.5 text-right font-medium text-foreground'>
                      {formatCurrency(item.totalValue)}
                    </td>
                    <td className='p-2.5 text-xs text-muted-foreground'>
                      {item.storageLocation}
                    </td>
                    <td className='p-2.5 text-center'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDelete(item.id, item.ingredientName)}
                        className='text-muted-foreground hover:text-destructive h-8 w-8 p-0'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Summary Footer */}
        {feedItems.length > 0 && (
          <div className='mt-4 rounded-lg bg-muted/50 p-4'>
            <div className='grid grid-cols-2 gap-4 text-sm sm:grid-cols-4'>
              <div>
                <span className='text-muted-foreground'>Total Items:</span>
                <span className='ml-2 font-semibold'>{feedItems.length}</span>
              </div>
              <div>
                <span className='text-muted-foreground'>Low Stock Alerts:</span>
                <span className='ml-2 font-semibold text-rose-600'>
                  {feedItems.filter(i => i.stockStatus === 'critical' || i.stockStatus === 'low').length}
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Total Inventory Mass:</span>
                <span className='ml-2 font-semibold'>
                  {feedItems.reduce((acc, i) => acc + i.currentStock, 0).toLocaleString()} kg
                </span>
              </div>
              <div>
                <span className='text-muted-foreground'>Total Valuation:</span>
                <span className='ml-2 font-semibold text-emerald-600'>
                  {formatCurrency(feedItems.reduce((sum, item) => sum + item.totalValue, 0))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Add Feed Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Add Feed Inventory Item</DialogTitle>
            <DialogDescription>
              Record a new batch or ration ingredient to track storage and consumption.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateFeed} className='space-y-3 pt-2'>
            <div className='space-y-1'>
              <label className='text-xs font-semibold'>Feed Name *</label>
              <Input
                placeholder='e.g. Premium Alfalfa Hay, Corn Silage'
                value={formData.feedName}
                onChange={e => setFormData({ ...formData, feedName: e.target.value })}
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Feed Type *</label>
                <select
                  value={formData.feedType}
                  onChange={e => setFormData({ ...formData, feedType: e.target.value })}
                  className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                >
                  <option value='concentrate'>Concentrate</option>
                  <option value='silage'>Silage</option>
                  <option value='hay'>Hay</option>
                  <option value='minerals'>Minerals</option>
                  <option value='supplements'>Supplements</option>
                  <option value='water'>Water</option>
                </select>
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Unit</label>
                <select
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  className='w-full rounded-md border bg-background px-3 py-2 text-sm'
                >
                  <option value='kg'>Kilograms (kg)</option>
                  <option value='tons'>Metric Tons</option>
                  <option value='liters'>Liters</option>
                  <option value='grams'>Grams</option>
                </select>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Initial Quantity *</label>
                <Input
                  type='number'
                  min='0'
                  step='0.1'
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Unit Price (PKR) *</label>
                <Input
                  type='number'
                  min='0'
                  step='0.1'
                  value={formData.unitPrice}
                  onChange={e => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Reorder Threshold</label>
                <Input
                  type='number'
                  min='0'
                  value={formData.minimumStock}
                  onChange={e => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                  placeholder='Threshold for low stock warning'
                />
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Supplier</label>
                <Input
                  placeholder='e.g. AgriSupply Co.'
                  value={formData.supplier}
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                />
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Storage Location</label>
                <Input
                  placeholder='e.g. Warehouse Silo 2'
                  value={formData.storageLocation}
                  onChange={e => setFormData({ ...formData, storageLocation: e.target.value })}
                />
              </div>

              <div className='space-y-1'>
                <label className='text-xs font-semibold'>Expiry Date</label>
                <Input
                  type='date'
                  value={formData.expiryDate}
                  onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className='pt-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => setIsAddOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Add Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
