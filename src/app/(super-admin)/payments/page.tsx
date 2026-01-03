'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Loader2, ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  currency: string;
  gateway: string;
  status: string;
  plan: string;
  metadata: {
    proof_url?: string;
    original_amount?: number;
    discount_amount?: number;
  };
  createdAt: string;
  tenant: {
    farmName: string;
  };
}

export default function AdminPaymentsPage() {
  const {
    data: payments,
    isLoading,
    refetch,
  } = useQuery<Payment[]>({
    queryKey: ['admin-payments'],
    queryFn: async () => {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
  });

  const handleAction = async (paymentId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, action }),
      });

      if (!res.ok) throw new Error('Failed to update status');

      toast.success(`Payment ${action}ed successfully`);
      refetch();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  const pendingPayments = payments?.filter(p => p.status === 'manual_verification') || [];

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Payment Verification</h1>
        <Button onClick={() => refetch()} variant='outline'>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals ({pendingPayments.length})</CardTitle>
          <CardDescription>Review manual payment receipts from bank transfers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farm Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Reference/Proof</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-muted-foreground py-8 text-center'>
                    No pending payments found.
                  </TableCell>
                </TableRow>
              ) : (
                pendingPayments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell className='font-medium'>
                      {payment.tenant?.farmName || payment.id}
                    </TableCell>
                    <TableCell className='capitalize'>{payment.plan} Plan</TableCell>
                    <TableCell>PKR {payment.amount.toLocaleString()}</TableCell>
                    <TableCell>{format(new Date(payment.createdAt), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      {payment.metadata?.proof_url ? (
                        <a
                          href={payment.metadata.proof_url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-primary flex items-center gap-1 hover:underline'
                        >
                          View Receipt <ExternalLink className='h-4 w-4' />
                        </a>
                      ) : (
                        <span className='text-muted-foreground italic'>No upload</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          size='sm'
                          className='bg-green-600 hover:bg-green-700'
                          onClick={() => handleAction(payment.id, 'approve')}
                        >
                          <Check className='mr-1 h-4 w-4' /> Approve
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => handleAction(payment.id, 'reject')}
                        >
                          <X className='mr-1 h-4 w-4' /> Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* History Table (Optional future enhancement for "All Payments") */}
    </div>
  );
}
