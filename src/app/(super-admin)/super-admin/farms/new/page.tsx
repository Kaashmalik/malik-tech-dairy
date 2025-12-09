// Super Admin - Create New Farm Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Loader2, User, Mail, Phone, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CreateFarmPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farmName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    province: '',
    plan: 'free',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/admin/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Farm created successfully!');
        router.push('/super-admin/farms');
      } else {
        toast.error(data.error || 'Failed to create farm');
      }
    } catch (error) {
      toast.error('Failed to create farm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-2xl space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Link href='/super-admin/farms'>
          <Button variant='ghost' size='icon'>
            <ArrowLeft className='h-5 w-5' />
          </Button>
        </Link>
        <div>
          <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Create New Farm</h1>
          <p className='text-sm text-gray-500'>Add a new farm to the platform</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className='space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800'
      >
        {/* Farm Details */}
        <div className='space-y-4'>
          <h3 className='flex items-center gap-2 font-semibold dark:text-white'>
            <Building2 className='h-5 w-5 text-emerald-600' />
            Farm Details
          </h3>

          <div>
            <Label htmlFor='farmName'>Farm Name *</Label>
            <Input
              id='farmName'
              value={formData.farmName}
              onChange={e => setFormData(s => ({ ...s, farmName: e.target.value }))}
              placeholder='e.g., Green Valley Dairy'
              required
              className='mt-1.5'
            />
          </div>
        </div>

        {/* Owner Details */}
        <div className='space-y-4'>
          <h3 className='flex items-center gap-2 font-semibold dark:text-white'>
            <User className='h-5 w-5 text-blue-600' />
            Owner Details
          </h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='ownerName'>Owner Name *</Label>
              <Input
                id='ownerName'
                value={formData.ownerName}
                onChange={e => setFormData(s => ({ ...s, ownerName: e.target.value }))}
                placeholder='Full name'
                required
                className='mt-1.5'
              />
            </div>
            <div>
              <Label htmlFor='email'>Email *</Label>
              <Input
                id='email'
                type='email'
                value={formData.email}
                onChange={e => setFormData(s => ({ ...s, email: e.target.value }))}
                placeholder='owner@example.com'
                required
                className='mt-1.5'
              />
            </div>
            <div>
              <Label htmlFor='phone'>Phone</Label>
              <Input
                id='phone'
                value={formData.phone}
                onChange={e => setFormData(s => ({ ...s, phone: e.target.value }))}
                placeholder='+92 300 1234567'
                className='mt-1.5'
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className='space-y-4'>
          <h3 className='flex items-center gap-2 font-semibold dark:text-white'>
            <MapPin className='h-5 w-5 text-purple-600' />
            Location
          </h3>

          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='city'>City</Label>
              <Input
                id='city'
                value={formData.city}
                onChange={e => setFormData(s => ({ ...s, city: e.target.value }))}
                placeholder='e.g., Lahore'
                className='mt-1.5'
              />
            </div>
            <div>
              <Label htmlFor='province'>Province</Label>
              <Select
                value={formData.province}
                onValueChange={v => setFormData(s => ({ ...s, province: v }))}
              >
                <SelectTrigger className='mt-1.5'>
                  <SelectValue placeholder='Select province' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='punjab'>Punjab</SelectItem>
                  <SelectItem value='sindh'>Sindh</SelectItem>
                  <SelectItem value='kpk'>KPK</SelectItem>
                  <SelectItem value='balochistan'>Balochistan</SelectItem>
                  <SelectItem value='islamabad'>Islamabad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Subscription */}
        <div className='space-y-4'>
          <h3 className='flex items-center gap-2 font-semibold dark:text-white'>
            <CreditCard className='h-5 w-5 text-amber-600' />
            Subscription Plan
          </h3>

          <div>
            <Label htmlFor='plan'>Plan</Label>
            <Select
              value={formData.plan}
              onValueChange={v => setFormData(s => ({ ...s, plan: v }))}
            >
              <SelectTrigger className='mt-1.5'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='free'>Free - 5 animals, 1 user</SelectItem>
                <SelectItem value='professional'>Professional - Rs. 4,999/mo</SelectItem>
                <SelectItem value='farm'>Farm - Rs. 12,999/mo</SelectItem>
                <SelectItem value='enterprise'>Enterprise - Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Actions */}
        <div className='flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row'>
          <Link href='/super-admin/farms' className='flex-1 sm:flex-none'>
            <Button type='button' variant='outline' className='w-full'>
              Cancel
            </Button>
          </Link>
          <Button
            type='submit'
            disabled={loading}
            className='flex-1 bg-emerald-600 hover:bg-emerald-700 sm:flex-none'
          >
            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Create Farm
          </Button>
        </div>
      </form>
    </div>
  );
}
