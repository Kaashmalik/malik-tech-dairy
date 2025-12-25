// Application Success Page - After submitting farm application
'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  Upload,
  Clock,
  ArrowRight,
  FileText,
  CreditCard,
  Loader2,
  Copy,
  Check,
  Landmark,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
interface Application {
  id: string;
  farm_name?: string;
  farmName?: string;
  requested_plan?: string;
  requestedPlan?: string;
  status: string;
  payment_slip_url?: string;
  paymentSlipUrl?: string;
}
// Payment methods
const paymentMethods = {
  bank: {
    name: 'Meezan Bank',
    accountName: 'MUHAMMAD KASHIF',
    accountNumber: '11330109676650',
    iban: 'PK26MEZN0011330109676650',
    branch: 'BHUBTIAN BRANCH LHR',
  },
  jazzcash: {
    name: 'JazzCash',
    accountName: 'Muhammad Kashif',
    accountNumber: '03020718182',
  },
};
function SuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('id');
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'bank' | 'jazzcash'>('bank');
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedField(null), 2000);
  };
  useEffect(() => {
    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);
  async function fetchApplication() {
    try {
      const response = await fetch(`/api/farm-applications/${applicationId}`);
      const data = await response.json();
      if (data.success) {
        setApplication(data.data.application);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !applicationId) return;
    // Validate file
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
      // Upload file
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
      // Update application with payment slip
      const updateResponse = await fetch(`/api/farm-applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentSlipUrl: uploadData.data.url,
          paymentSlipProvider: uploadData.data.provider,
          paymentAmount: getPlanAmount(application?.requestedPlan || 'free'),
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
  function getPlanAmount(plan: string): number {
    const prices: Record<string, number> = {
      free: 0,
      professional: 499900,
      farm: 1299900,
      enterprise: 0,
    };
    return prices[plan] || 0;
  }
  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
      </div>
    );
  }
  const farmName = application?.farm_name || application?.farmName || 'Your Farm';
  const requestedPlan = application?.requested_plan || application?.requestedPlan || 'free';
  const paymentSlipUrl = application?.payment_slip_url || application?.paymentSlipUrl;
  const needsPayment = requestedPlan !== 'free' && !paymentSlipUrl;
  const paymentUploaded = paymentSlipUrl && application?.status === 'payment_uploaded';
  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 dark:bg-slate-900'>
      <div className='mx-auto max-w-xl'>
        {/* Success Icon */}
        <div className='mb-8 text-center'>
          <div className='mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
            <CheckCircle2 className='h-10 w-10 text-emerald-600' />
          </div>
          <h1 className='text-3xl font-bold dark:text-white'>Application Submitted!</h1>
          <p className='mt-2 text-gray-500 dark:text-slate-400'>
            Your farm application has been received
          </p>
        </div>
        {/* Application Details Card */}
        <div className='mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'>
          <div className='flex items-center gap-3 border-b pb-4 dark:border-slate-700'>
            <FileText className='h-5 w-5 text-emerald-600' />
            <div>
              <p className='font-semibold dark:text-white'>{farmName}</p>
              <p className='text-sm text-gray-500 dark:text-slate-400'>
                Application ID: {applicationId}
              </p>
            </div>
          </div>
          <div className='space-y-3 py-4'>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-slate-400'>Plan</span>
              <span className='font-medium capitalize dark:text-white'>{requestedPlan}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-gray-500 dark:text-slate-400'>Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  application?.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-700'
                    : application?.status === 'payment_uploaded'
                      ? 'bg-amber-100 text-amber-700'
                      : application?.status === 'pending_payment'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-700'
                }`}
              >
                {application?.status === 'payment_uploaded'
                  ? 'Under Review'
                  : application?.status === 'pending_payment'
                    ? 'Pending Payment'
                    : application?.status?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
        {/* Next Steps */}
        {needsPayment && (
          <div className='mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'>
            <h2 className='mb-4 flex items-center gap-2 font-semibold dark:text-white'>
              <CreditCard className='h-5 w-5 text-emerald-600' />
              Next Step: Upload Payment Slip
            </h2>
            <div className='mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20'>
              <p className='text-sm text-amber-800 dark:text-amber-200'>
                Please transfer the subscription fee to our bank account and upload the payment
                slip.
              </p>
            </div>
            {/* Payment Method Tabs */}
            <div className='mb-4 flex gap-2 rounded-xl bg-gray-100 p-1 dark:bg-slate-700'>
              <button
                type='button'
                onClick={() => setSelectedPaymentMethod('bank')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selectedPaymentMethod === 'bank'
                    ? 'bg-white text-emerald-600 shadow-md dark:bg-slate-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Landmark className='h-4 w-4' />
                Bank
              </button>
              <button
                type='button'
                onClick={() => setSelectedPaymentMethod('jazzcash')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  selectedPaymentMethod === 'jazzcash'
                    ? 'bg-white text-red-500 shadow-md dark:bg-slate-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Smartphone className='h-4 w-4' />
                JazzCash
              </button>
            </div>
            {/* Bank Details */}
            {selectedPaymentMethod === 'bank' && (
              <div className='mb-4 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20'>
                <div className='mb-3 flex items-center gap-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-green-600'>
                    <Landmark className='h-4 w-4 text-white' />
                  </div>
                  <span className='font-semibold text-green-800 dark:text-green-200'>
                    {paymentMethods.bank.name}
                  </span>
                </div>
                <div className='space-y-2'>
                  {[
                    {
                      label: 'Account Title',
                      value: paymentMethods.bank.accountName,
                      key: 's-name',
                    },
                    { label: 'Account #', value: paymentMethods.bank.accountNumber, key: 's-num' },
                    { label: 'IBAN', value: paymentMethods.bank.iban, key: 's-iban' },
                    { label: 'Branch', value: paymentMethods.bank.branch, key: 's-branch' },
                  ].map(item => (
                    <div key={item.key} className='flex items-center justify-between py-1'>
                      <div>
                        <span className='text-xs text-green-600'>{item.label}:</span>
                        <p className='text-sm font-medium text-green-900 dark:text-green-100'>
                          {item.value}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.value, item.key)}
                        className='rounded p-1 hover:bg-green-100'
                      >
                        {copiedField === item.key ? (
                          <Check className='h-4 w-4 text-green-600' />
                        ) : (
                          <Copy className='h-4 w-4 text-green-600' />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* JazzCash Details */}
            {selectedPaymentMethod === 'jazzcash' && (
              <div className='mb-4 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20'>
                <div className='mb-3 flex items-center gap-2'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-red-500'>
                    <Smartphone className='h-4 w-4 text-white' />
                  </div>
                  <span className='font-semibold text-red-800 dark:text-red-200'>
                    {paymentMethods.jazzcash.name}
                  </span>
                </div>
                <div className='space-y-2'>
                  {[
                    {
                      label: 'Account Name',
                      value: paymentMethods.jazzcash.accountName,
                      key: 's-jname',
                    },
                    {
                      label: 'Mobile Number',
                      value: paymentMethods.jazzcash.accountNumber,
                      key: 's-jnum',
                    },
                  ].map(item => (
                    <div key={item.key} className='flex items-center justify-between py-1'>
                      <div>
                        <span className='text-xs text-red-600'>{item.label}:</span>
                        <p className='text-sm font-medium text-red-900 dark:text-red-100'>
                          {item.value}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(item.value, item.key)}
                        className='rounded p-1 hover:bg-red-100'
                      >
                        {copiedField === item.key ? (
                          <Check className='h-4 w-4 text-red-600' />
                        ) : (
                          <Copy className='h-4 w-4 text-red-600' />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Upload Button */}
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
            <p className='mt-2 text-center text-xs text-gray-500 dark:text-slate-400'>
              Accepted formats: JPG, PNG, PDF (max 5MB)
            </p>
          </div>
        )}
        {/* Payment Uploaded - Waiting */}
        {paymentUploaded && (
          <div className='mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-slate-800'>
            <div className='mb-4 flex items-center gap-3 text-amber-600'>
              <Clock className='h-6 w-6' />
              <h2 className='font-semibold'>Awaiting Verification</h2>
            </div>
            <p className='text-gray-600 dark:text-slate-300'>
              Your payment slip has been uploaded. Our team will verify the payment and assign your
              Farm ID within 24-48 hours.
            </p>
            <p className='mt-4 text-sm text-gray-500 dark:text-slate-400'>
              You will receive an email notification once your application is approved.
            </p>
          </div>
        )}
        {/* Free Plan - Immediate Access */}
        {requestedPlan === 'free' && (
          <div className='mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-800 dark:bg-emerald-900/20'>
            <div className='mb-4 flex items-center gap-3 text-emerald-600'>
              <CheckCircle2 className='h-6 w-6' />
              <h2 className='font-semibold'>Processing Your Application</h2>
            </div>
            <p className='text-gray-600 dark:text-slate-300'>
              Since you selected the Free plan, your application will be processed automatically.
              You should receive your Farm ID within a few minutes.
            </p>
          </div>
        )}
        {/* Actions */}
        <div className='flex flex-col gap-3 sm:flex-row'>
          <Link href={`/apply/status?id=${applicationId}`} className='flex-1'>
            <Button variant='outline' className='w-full'>
              <FileText className='mr-2 h-4 w-4' />
              Check Application Status
            </Button>
          </Link>
          {application?.status === 'approved' ? (
            <Link href='/dashboard' className='flex-1'>
              <Button className='w-full bg-emerald-600 hover:bg-emerald-700'>
                Go to Dashboard
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>
            </Link>
          ) : (
            <Link href='/' className='flex-1'>
              <Button variant='outline' className='w-full'>
                Back to Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
export default function ApplicationSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className='flex min-h-screen items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-emerald-600' />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}