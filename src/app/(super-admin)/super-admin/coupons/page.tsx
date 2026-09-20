'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Tag, Loader2, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CouponForm } from '@/components/admin/CouponForm';
import { toast } from 'sonner';
import type { Coupon } from '@/lib/coupons/types';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | undefined>();

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load coupons');
      }
      setCoupons(
        (data.coupons || []).map((c: Coupon) => ({
          ...c,
          validFrom: new Date(c.validFrom),
          validUntil: new Date(c.validUntil),
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }))
      );
    } catch (error) {
      console.error(error);
      toast.error('Failed to load coupons');
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  async function deactivateCoupon(id: string) {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Failed to deactivate');
      }
      toast.success('Coupon deactivated');
      fetchCoupons();
    } catch {
      toast.error('Failed to deactivate coupon');
    }
  }

  if (showForm) {
    return (
      <div className='space-y-6 p-6'>
        <CouponForm
          coupon={editing}
          onSuccess={() => {
            setShowForm(false);
            setEditing(undefined);
            fetchCoupons();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditing(undefined);
          }}
        />
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-slate-900'>Coupons</h1>
          <p className='text-sm text-slate-500'>Create and manage subscription discount codes</p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setShowForm(true);
          }}
        >
          <Plus className='mr-2 h-4 w-4' />
          New Coupon
        </Button>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-20'>
          <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
        </div>
      ) : coupons.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center'>
          <Tag className='mx-auto mb-3 h-10 w-10 text-slate-300' />
          <p className='text-slate-600'>No coupons yet</p>
        </div>
      ) : (
        <div className='overflow-hidden rounded-xl border border-slate-200 bg-white'>
          <table className='w-full text-left text-sm'>
            <thead className='border-b bg-slate-50 text-slate-600'>
              <tr>
                <th className='px-4 py-3 font-medium'>Code</th>
                <th className='px-4 py-3 font-medium'>Type</th>
                <th className='px-4 py-3 font-medium'>Value</th>
                <th className='px-4 py-3 font-medium'>Valid</th>
                <th className='px-4 py-3 font-medium'>Status</th>
                <th className='px-4 py-3 font-medium'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.id} className='border-b last:border-0'>
                  <td className='px-4 py-3 font-mono font-semibold'>{coupon.code}</td>
                  <td className='px-4 py-3 capitalize'>{coupon.type.replace('_', ' ')}</td>
                  <td className='px-4 py-3'>
                    {coupon.type === 'percentage' ? `${coupon.value}%` : `PKR ${coupon.value}`}
                  </td>
                  <td className='px-4 py-3 text-slate-500'>
                    {new Date(coupon.validFrom).toLocaleDateString()} –{' '}
                    {new Date(coupon.validUntil).toLocaleDateString()}
                  </td>
                  <td className='px-4 py-3'>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        coupon.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setEditing(coupon);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </Button>
                      {coupon.isActive && (
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => deactivateCoupon(coupon.id)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
