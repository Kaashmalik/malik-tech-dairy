// Super Admin - Payments Management Page
'use client';

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  MoreVertical,
} from 'lucide-react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Payment {
  id: string;
  farmName: string;
  amount: number;
  currency: string;
  gateway: 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'xpay';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  plan: string;
  transactionId?: string;
  createdAt: string;
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-700', icon: DollarSign },
};

const gatewayConfig: Record<string, { label: string; color: string }> = {
  jazzcash: { label: 'JazzCash', color: 'bg-red-100 text-red-700' },
  easypaisa: { label: 'EasyPaisa', color: 'bg-green-100 text-green-700' },
  bank_transfer: { label: 'Bank Transfer', color: 'bg-blue-100 text-blue-700' },
  xpay: { label: 'XPay', color: 'bg-purple-100 text-purple-700' },
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  async function fetchPayments() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/payments');
      const data = await response.json();

      if (data.success) {
        setPayments(data.data || []);
      } else {
        // Mock data for demo
        setPayments([
          {
            id: '1',
            farmName: 'Green Valley Dairy',
            amount: 499900,
            currency: 'PKR',
            gateway: 'jazzcash',
            status: 'completed',
            plan: 'professional',
            transactionId: 'JC-2024-001234',
            createdAt: new Date().toISOString(),
          },
          {
            id: '2',
            farmName: 'Sunrise Farm',
            amount: 1299900,
            currency: 'PKR',
            gateway: 'bank_transfer',
            status: 'pending',
            plan: 'farm',
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => acc + p.amount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'pending')
    .reduce((acc, p) => acc + p.amount, 0);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transactionId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatAmount = (amount: number) => {
    return `Rs. ${(amount / 100).toLocaleString()}`;
  };

  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold md:text-2xl dark:text-white'>Payments</h1>
          <p className='text-sm text-gray-500 dark:text-slate-400'>
            Track and manage all platform payments
          </p>
        </div>
        <Button className='w-full bg-emerald-600 hover:bg-emerald-700 sm:w-auto'>
          <Download className='mr-2 h-4 w-4' />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4'>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-emerald-100 p-2'>
              <TrendingUp className='h-5 w-5 text-emerald-600' />
            </div>
            <div>
              <p className='text-lg font-bold md:text-2xl dark:text-white'>
                {formatAmount(totalRevenue)}
              </p>
              <p className='text-xs text-gray-500'>Total Revenue</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-amber-100 p-2'>
              <Clock className='h-5 w-5 text-amber-600' />
            </div>
            <div>
              <p className='text-lg font-bold md:text-2xl dark:text-white'>
                {formatAmount(pendingAmount)}
              </p>
              <p className='text-xs text-gray-500'>Pending</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-blue-100 p-2'>
              <CreditCard className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-2xl font-bold dark:text-white'>{payments.length}</p>
              <p className='text-xs text-gray-500'>Transactions</p>
            </div>
          </div>
        </div>
        <div className='rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='rounded-lg bg-purple-100 p-2'>
              <CheckCircle2 className='h-5 w-5 text-purple-600' />
            </div>
            <div>
              <p className='text-2xl font-bold dark:text-white'>
                {payments.filter(p => p.status === 'completed').length}
              </p>
              <p className='text-xs text-gray-500'>Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-3 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search by farm or transaction ID...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='h-11 pl-10'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='h-11 w-full sm:w-44'>
            <Filter className='mr-2 h-4 w-4' />
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='pending'>Pending</SelectItem>
            <SelectItem value='completed'>Completed</SelectItem>
            <SelectItem value='failed'>Failed</SelectItem>
            <SelectItem value='refunded'>Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <div className='overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800'>
        {loading ? (
          <div className='p-12 text-center'>
            <Loader2 className='mx-auto h-8 w-8 animate-spin text-gray-400' />
            <p className='mt-2 text-gray-500'>Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className='p-12 text-center'>
            <CreditCard className='mx-auto h-12 w-12 text-gray-300' />
            <p className='mt-2 text-gray-500'>No payments found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className='divide-y divide-gray-100 md:hidden dark:divide-slate-700'>
              {filteredPayments.map(payment => {
                const status = statusConfig[payment.status];
                const StatusIcon = status.icon;
                const gateway = gatewayConfig[payment.gateway];

                return (
                  <div key={payment.id} className='space-y-3 p-4'>
                    <div className='flex items-start justify-between'>
                      <div className='min-w-0 flex-1'>
                        <h3 className='truncate font-medium dark:text-white'>{payment.farmName}</h3>
                        <p className='text-lg font-bold text-emerald-600'>
                          {formatAmount(payment.amount)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon' className='h-8 w-8'>
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>
                            <Eye className='mr-2 h-4 w-4' /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className='mr-2 h-4 w-4' /> Download Receipt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className='flex flex-wrap gap-2'>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${status.color}`}
                      >
                        <StatusIcon className='h-3 w-3' />
                        {status.label}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${gateway.color}`}
                      >
                        {gateway.label}
                      </span>
                      <span className='rounded-full bg-purple-100 px-2 py-1 text-xs capitalize text-purple-700'>
                        {payment.plan}
                      </span>
                    </div>

                    <div className='flex items-center justify-between text-xs text-gray-500'>
                      {payment.transactionId && (
                        <span className='font-mono'>{payment.transactionId}</span>
                      )}
                      <span className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className='hidden overflow-x-auto md:block'>
              <table className='w-full'>
                <thead className='bg-gray-50 dark:bg-slate-700/50'>
                  <tr>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Farm
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Amount
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Gateway
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Plan
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Status
                    </th>
                    <th className='px-6 py-4 text-left text-xs font-medium uppercase text-gray-500'>
                      Date
                    </th>
                    <th className='px-6 py-4 text-right text-xs font-medium uppercase text-gray-500'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100 dark:divide-slate-700'>
                  {filteredPayments.map(payment => {
                    const status = statusConfig[payment.status];
                    const StatusIcon = status.icon;
                    const gateway = gatewayConfig[payment.gateway];

                    return (
                      <tr key={payment.id} className='hover:bg-gray-50 dark:hover:bg-slate-700/30'>
                        <td className='px-6 py-4'>
                          <div>
                            <p className='font-medium dark:text-white'>{payment.farmName}</p>
                            {payment.transactionId && (
                              <p className='font-mono text-xs text-gray-500'>
                                {payment.transactionId}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <p className='font-bold text-emerald-600'>
                            {formatAmount(payment.amount)}
                          </p>
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${gateway.color}`}
                          >
                            {gateway.label}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span className='rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium capitalize text-purple-700'>
                            {payment.plan}
                          </span>
                        </td>
                        <td className='px-6 py-4'>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}
                          >
                            <StatusIcon className='h-3.5 w-3.5' />
                            {status.label}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-sm text-gray-500'>
                          {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          <Button variant='ghost' size='sm'>
                            <Eye className='mr-1 h-4 w-4' /> View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
