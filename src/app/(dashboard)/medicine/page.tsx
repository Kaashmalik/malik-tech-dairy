'use client';

// Medicine Management Page for MTK Dairy
// Tracks medications, inventory, and treatment records

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Search,
  Pill,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

// Mock data for medicine inventory
const mockMedicines = [
  {
    id: '1',
    name: 'Penicillin G',
    category: 'Antibiotic',
    stock: 150,
    unit: 'ml',
    expiryDate: '2024-12-31',
    status: 'adequate',
    supplier: 'PharmaCo Ltd',
    price: 250,
  },
  {
    id: '2',
    name: 'Ivermectin',
    category: 'Antiparasitic',
    stock: 25,
    unit: 'ml',
    expiryDate: '2024-08-15',
    status: 'low',
    supplier: 'VetMed Inc',
    price: 450,
  },
  {
    id: '3',
    name: 'Vitamin B Complex',
    category: 'Supplement',
    stock: 500,
    unit: 'tablets',
    expiryDate: '2025-06-30',
    status: 'adequate',
    supplier: 'NutriVet',
    price: 150,
  },
];

const mockTreatments = [
  {
    id: '1',
    animalId: 'ANM001',
    animalName: 'Bessie',
    medicine: 'Penicillin G',
    dosage: '10ml',
    administeredBy: 'Dr. Ahmed',
    date: '2024-01-15',
    status: 'completed',
  },
  {
    id: '2',
    animalId: 'ANM002',
    animalName: 'Daisy',
    medicine: 'Ivermectin',
    dosage: '5ml',
    administeredBy: 'Dr. Sarah',
    date: '2024-01-14',
    status: 'completed',
  },
];

export default function MedicinePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'adequate':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'adequate':
        return <CheckCircle className='h-4 w-4' />;
      case 'low':
        return <AlertTriangle className='h-4 w-4' />;
      case 'critical':
        return <AlertTriangle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  const filteredMedicines = mockMedicines.filter(medicine => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='flex items-center gap-2 text-3xl font-bold'>
            <Pill className='h-8 w-8 text-emerald-600' />
            Medicine Management
          </h1>
          <p className='mt-1 text-gray-600'>Track medications, inventory, and treatment records</p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Package className='mr-2 h-4 w-4' />
            Order Medicine
          </Button>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Add Medicine
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Medicines</CardTitle>
            <Package className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{mockMedicines.length}</div>
            <p className='text-muted-foreground text-xs'>Active medications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Low Stock</CardTitle>
            <AlertTriangle className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {mockMedicines.filter(m => m.status === 'low').length}
            </div>
            <p className='text-muted-foreground text-xs'>Needs restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring Soon</CardTitle>
            <Clock className='h-4 w-4 text-orange-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>2</div>
            <p className='text-muted-foreground text-xs'>Within 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Treatments Today</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>5</div>
            <p className='text-muted-foreground text-xs'>Completed treatments</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='inventory' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='inventory'>Inventory</TabsTrigger>
          <TabsTrigger value='treatments'>Treatment Records</TabsTrigger>
          <TabsTrigger value='orders'>Orders</TabsTrigger>
        </TabsList>

        <TabsContent value='inventory' className='space-y-4'>
          {/* Search and Filter */}
          <div className='flex items-center gap-4'>
            <div className='relative max-w-sm flex-1'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                placeholder='Search medicines...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Button variant='outline'>
              <Filter className='mr-2 h-4 w-4' />
              Filter
            </Button>
          </div>

          {/* Medicine Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Medicine Inventory</CardTitle>
              <CardDescription>Current stock levels and expiration dates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {filteredMedicines.map(medicine => (
                  <div
                    key={medicine.id}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100'>
                        <Pill className='h-5 w-5 text-emerald-600' />
                      </div>
                      <div>
                        <h3 className='font-medium'>{medicine.name}</h3>
                        <p className='text-sm text-gray-500'>
                          {medicine.category} • {medicine.supplier}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='text-right'>
                        <p className='font-medium'>
                          {medicine.stock} {medicine.unit}
                        </p>
                        <p className='text-sm text-gray-500'>Expires: {medicine.expiryDate}</p>
                      </div>
                      <Badge className={getStatusColor(medicine.status)}>
                        {getStatusIcon(medicine.status)}
                        <span className='ml-1'>{medicine.status}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='treatments' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Treatments</CardTitle>
              <CardDescription>Medicine administration records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {mockTreatments.map(treatment => (
                  <div
                    key={treatment.id}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full bg-blue-100'>
                        <Pill className='h-5 w-5 text-blue-600' />
                      </div>
                      <div>
                        <h3 className='font-medium'>{treatment.animalName}</h3>
                        <p className='text-sm text-gray-500'>
                          {treatment.medicine} • {treatment.dosage}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <div className='text-right'>
                        <p className='font-medium'>{treatment.administeredBy}</p>
                        <p className='text-sm text-gray-500'>{treatment.date}</p>
                      </div>
                      <Badge variant='secondary'>{treatment.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='orders' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Medicine Orders</CardTitle>
              <CardDescription>Track and manage medicine orders</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='py-8 text-center text-gray-500'>
                <Package className='mx-auto mb-4 h-12 w-12 text-gray-300' />
                <p>No active orders</p>
                <Button className='mt-4'>
                  <Plus className='mr-2 h-4 w-4' />
                  Place New Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
