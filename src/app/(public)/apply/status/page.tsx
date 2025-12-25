// Application Status Page - Check application status
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Upload,
  CreditCard,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
interface Application {
  id: string;
  farmName: string;
  ownerName: string;
  email: string;
  requestedPlan: string;
  status: 'pending' | 'payment_uploaded' | 'under_review' | 'approved' | 'rejected';
  paymentSlipUrl?: string;
  assignedFarmId?: string;
  rejectionReason?: string;
  createdAt: string;
}
const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    title: 'Pending',
    description: 'Your application is pending. Please upload payment slip if required.',
  },
  payment_uploaded: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    title: 'Under Review',
    description: 'Payment slip uploaded. Our team is verifying your payment.',
  },
  under_review: {
    icon: Clock,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    title: 'Under Review',
    description: 'Your application is being reviewed by our team.',
  },
  approved: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    title: 'Approved!',
    description: 'Your farm has been approved. You can now access your dashboard.',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    title: 'Rejected',
    description: 'Unfortunately, your application was not approved.',
  },
};
export default function ApplicationStatusPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const applicationId = searchParams.get('id');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    } else {
      // Fetch user's latest application
      fetchLatestApplication();
    }
  }, [applicationId]);
  async function fetchApplication() {
    try {
      const response = await fetch(`/api/farm-applications/${applicationId}`);
      const data = await response.json();
      if (data.success) {
        setApplication(data.data.application);
      } else {
        toast.error('Application not found');
      }
    } catch (error) {
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  }
  async function fetchLatestApplication() {
    try {
      const response = await fetch('/api/farm-applications/my');
      const data = await response.json();
      if (data.success && data.data) {
        setApplication(data.data);
      } else {
        // No application found - redirect to apply
        router.push('/apply');
      }
    } catch (error) {
      router.push('/apply');
    } finally {
      setLoading(false);
    }
  }
  async function handleRefresh() {
    setRefreshing(true);
    await fetchApplication();
    setRefreshing(false);
    toast.success('Status refreshed');
  }
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !application?.id) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'payment-slips');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadData = await uploadResponse.json();
      if (!uploadData.success) {
        throw new Error(uploadData.error || 'Upload failed');
      }
      const updateResponse = await fetch(`/api/farm-applications/${application.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentSlipUrl: uploadData.data.url,
          paymentSlipProvider: uploadData.data.provider,
          paymentDate: new Date().toISOString(),
        }),
      });
      const updateData = await updateResponse.json();
      if (updateData.success) {
        toast.success('Payment slip uploaded successfully!');
        setApplication(updateData.data);
      } else {
        throw new Error(updateData.error || 'Failed to update application');
      }
    } catch (error) {
      toast.error('Failed to upload payment slip');
    } finally {
      setUploading(false);
    }
  }
  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
      </div>
    );
  }
  if (!application) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center p-4'>
        <FileText className='mb-4 h-16 w-16 text-gray-300' />
        <h2 className='mb-2 text-xl font-semibold dark:text-white'>No Application Found</h2>
        <p className='mb-6 text-gray-500 dark:text-slate-400'>
          You haven&apos;t submitted a farm application yet.
        </p>
        <Link href='/apply'>
          <Button className='bg-emerald-600 hover:bg-emerald-700'>
            Apply for Farm ID
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </Link>
      </div>
    );
  }
  const status = statusConfig[application.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const needsPayment =
    application.requestedPlan !== 'free' &&
    !application.paymentSlipUrl &&
    application.status === 'pending';
  return (
    <div className='min-h-screen px-4 py-12'>
      <div className='mx-auto max-w-xl'>
        {/* Status Header */}
        <div className='mb-8 text-center'>
          <div
            className={`h-20 w-20 ${status.bgColor} mx-auto mb-4 flex items-center justify-center rounded-full`}
          >
            <StatusIcon className={`h-10 w-10 ${status.color}`} />
          </div>
          <h1 className='text-3xl font-bold dark:text-white'>{status.title}</h1>
          <p className='mt-2 text-gray-500 dark:text-slate-400'>{status.description}</p>
        </div>
        {/* Application Details */}
        <div className='mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'>
          <div className='flex items-center justify-between border-b pb-4 dark:border-slate-700'>
            <div className='flex items-center gap-3'>
              <FileText className='h-5 w-5 text-emerald-600' />
              <div>
                <p className='font-semibold dark:text-white'>{application.farmName}</p>
                <p className='text-sm text-gray-500 dark:text-slate-400'>
                  ID: {application.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <Button variant='ghost' size='sm' onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className='space-y-3 py-4'>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-slate-400'>Owner</span>
              <span className='font-medium dark:text-white'>{application.ownerName}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-slate-400'>Plan</span>
              <span className='font-medium capitalize dark:text-white'>
                {application.requestedPlan}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-slate-400'>Applied</span>
              <span className='font-medium dark:text-white'>
                {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>
            {application.assignedFarmId && (
              <div className='flex justify-between'>
                <span className='text-gray-500 dark:text-slate-400'>Farm ID</span>
                <span className='font-bold text-emerald-600'>{application.assignedFarmId}</span>
              </div>
            )}
          </div>
        </div>
        {/* Payment Upload Section */}
        {needsPayment && (
          <div className='mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'>
            <h2 className='mb-4 flex items-center gap-2 font-semibold dark:text-white'>
              <CreditCard className='h-5 w-5 text-emerald-600' />
              Upload Payment Slip
            </h2>
            <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
              <p className='text-sm text-amber-800 dark:text-amber-200'>
                Please transfer the subscription fee to our bank account and upload the payment
                slip.
              </p>
            </div>
            <div className='mb-4 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-slate-700/50'>
              <p className='text-sm font-medium dark:text-white'>Bank Account Details:</p>
              <div className='space-y-1 text-sm text-gray-600 dark:text-slate-300'>
                <p>
                  <strong>Bank:</strong> Bank Alfalah
                </p>
                <p>
                  <strong>Account Title:</strong> MTK Dairy Pvt Ltd
                </p>
                <p>
                  <strong>Account #:</strong> 1234567890123
                </p>
                <p>
                  <strong>IBAN:</strong> PK12ALFH1234567890123456
                </p>
              </div>
            </div>
            <div className='relative'>
              <input
                type='file'
                accept='image/jpeg,image/png,application/pdf'
                onChange={handleFileUpload}
                disabled={uploading}
                className='absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
              />
              <Button className='w-full bg-emerald-600 hover:bg-emerald-700' disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className='mr-2 h-4 w-4' />
                    Upload Payment Slip
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        {/* Rejection Reason */}
        {application.status === 'rejected' && application.rejectionReason && (
          <div className='mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20'>
            <h3 className='mb-2 font-semibold text-red-700 dark:text-red-300'>Reason:</h3>
            <p className='text-red-600 dark:text-red-400'>{application.rejectionReason}</p>
          </div>
        )}
        {/* Actions */}
        <div className='flex flex-col gap-3 sm:flex-row'>
          {application.status === 'approved' ? (
            <Link href='/dashboard' className='flex-1'>
              <Button className='w-full bg-emerald-600 hover:bg-emerald-700'>
                Go to Dashboard
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          ) : application.status === 'rejected' ? (
            <Link href='/apply' className='flex-1'>
              <Button className='w-full bg-emerald-600 hover:bg-emerald-700'>
                Apply Again
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          ) : (
            <div className='w-full py-4 text-center text-gray-500 dark:text-slate-400'>
              <Clock className='mr-2 inline h-5 w-5' />
              We&apos;ll notify you by email when your application status changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}