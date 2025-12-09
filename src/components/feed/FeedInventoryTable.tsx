'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Filter,
  Download,
  Plus,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedInventoryTableProps {
  className?: string;
}

interface FeedItem {
  id: string;
  ingredientName: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  maxStockLevel: number;
  unitCost: number;
  totalValue: number;
  supplierName: string;
  batchNumber: string;
  expiryDate: string;
  storageLocation: string;
  qualityGrade: string;
  daysUntilExpiry: number;
  stockStatus: 'critical' | 'low' | 'adequate' | 'overstock';
  daysOfSupply: number;
}

export function FeedInventoryTable({ className }: FeedInventoryTableProps) {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    stockStatus: '',
  });

  useEffect(() => {
    fetchFeedItems();
  }, []);

  const fetchFeedItems = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData: FeedItem[] = [
        {
          id: '1',
          ingredientName: 'Premium Alfalfa Hay',
          category: 'hay',
          currentStock: 2500,
          unit: 'kg',
          reorderLevel: 1000,
          maxStockLevel: 5000,
          unitCost: 45,
          totalValue: 112500,
          supplierName: 'Green Pastures Supply',
          batchNumber: 'ALF-2024-001',
          expiryDate: '2025-03-15',
          storageLocation: 'Warehouse A - Bay 3',
          qualityGrade: 'premium',
          daysUntilExpiry: 105,
          stockStatus: 'adequate',
          daysOfSupply: 45,
        },
        {
          id: '2',
          ingredientName: 'Dairy Concentrate Mix',
          category: 'concentrate',
          currentStock: 450,
          unit: 'kg',
          reorderLevel: 800,
          maxStockLevel: 2000,
          unitCost: 120,
          totalValue: 54000,
          supplierName: 'NutriFeeds Ltd',
          batchNumber: 'CON-2024-042',
          expiryDate: '2024-12-30',
          storageLocation: 'Warehouse B - Bay 1',
          qualityGrade: 'standard',
          daysUntilExpiry: 30,
          stockStatus: 'critical',
          daysOfSupply: 15,
        },
        {
          id: '3',
          ingredientName: 'Soybean Meal',
          category: 'supplements',
          currentStock: 1200,
          unit: 'kg',
          reorderLevel: 500,
          maxStockLevel: 1500,
          unitCost: 85,
          totalValue: 102000,
          supplierName: 'Protein Sources Inc',
          batchNumber: 'SOY-2024-018',
          expiryDate: '2025-06-20',
          storageLocation: 'Warehouse A - Bay 5',
          qualityGrade: 'premium',
          daysUntilExpiry: 172,
          stockStatus: 'adequate',
          daysOfSupply: 60,
        },
      ];

      setFeedItems(mockData);
    } catch (error) {
      console.error('Error fetching feed items:', error);
    } finally {
      setLoading(false);
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
        return 'bg-red-100 text-red-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'overstock':
        return 'bg-blue-100 text-blue-800';
      case 'adequate':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatusColor = (days: number) => {
    if (days <= 30) return 'text-red-600';
    if (days <= 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Feed Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='h-64 rounded bg-gray-200'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center'>
            <Package className='mr-2 h-5 w-5' />
            Feed Inventory
          </CardTitle>
          <div className='flex items-center space-x-2'>
            <Button variant='outline' size='sm'>
              <Filter className='mr-2 h-4 w-4' />
              Filters
            </Button>
            <Button variant='outline' size='sm'>
              <Download className='mr-2 h-4 w-4' />
              Export
            </Button>
            <Button size='sm'>
              <Plus className='mr-2 h-4 w-4' />
              Add Item
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='p-2 text-left'>Ingredient</th>
                <th className='p-2 text-left'>Category</th>
                <th className='p-2 text-left'>Stock</th>
                <th className='p-2 text-left'>Status</th>
                <th className='p-2 text-left'>Unit Cost</th>
                <th className='p-2 text-left'>Total Value</th>
                <th className='p-2 text-left'>Expiry</th>
                <th className='p-2 text-left'>Days Supply</th>
                <th className='p-2 text-left'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedItems.map(item => (
                <tr key={item.id} className='border-b hover:bg-gray-50'>
                  <td className='p-2'>
                    <div>
                      <div className='font-medium'>{item.ingredientName}</div>
                      <div className='text-xs text-gray-500'>{item.supplierName}</div>
                    </div>
                  </td>
                  <td className='p-2'>
                    <Badge variant='outline' className='capitalize'>
                      {item.category}
                    </Badge>
                  </td>
                  <td className='p-2'>
                    <div className='text-right'>
                      <div className='font-medium'>
                        {item.currentStock} {item.unit}
                      </div>
                      <div className='text-xs text-gray-500'>
                        Reorder at {item.reorderLevel} {item.unit}
                      </div>
                    </div>
                  </td>
                  <td className='p-2'>
                    <Badge className={getStockStatusColor(item.stockStatus)}>
                      {item.stockStatus}
                    </Badge>
                  </td>
                  <td className='p-2 text-right'>{formatCurrency(item.unitCost)}</td>
                  <td className='p-2 text-right font-medium'>{formatCurrency(item.totalValue)}</td>
                  <td className='p-2'>
                    <div className={cn('text-sm', getExpiryStatusColor(item.daysUntilExpiry))}>
                      {new Date(item.expiryDate).toLocaleDateString()}
                    </div>
                    <div className='text-xs text-gray-500'>{item.daysUntilExpiry} days</div>
                  </td>
                  <td className='p-2 text-center'>{item.daysOfSupply} days</td>
                  <td className='p-2'>
                    <div className='flex items-center space-x-1'>
                      <Button variant='ghost' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm'>
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button variant='ghost' size='sm' className='text-red-600'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className='mt-4 rounded bg-gray-50 p-4'>
          <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-4'>
            <div>
              <span className='text-gray-600'>Total Items:</span>
              <span className='ml-2 font-medium'>{feedItems.length}</span>
            </div>
            <div>
              <span className='text-gray-600'>Low Stock:</span>
              <span className='ml-2 font-medium text-red-600'>
                {
                  feedItems.filter(
                    item => item.stockStatus === 'critical' || item.stockStatus === 'low'
                  ).length
                }
              </span>
            </div>
            <div>
              <span className='text-gray-600'>Expiring Soon:</span>
              <span className='ml-2 font-medium text-orange-600'>
                {feedItems.filter(item => item.daysUntilExpiry <= 30).length}
              </span>
            </div>
            <div>
              <span className='text-gray-600'>Total Value:</span>
              <span className='ml-2 font-medium'>
                {formatCurrency(feedItems.reduce((sum, item) => sum + item.totalValue, 0))}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
