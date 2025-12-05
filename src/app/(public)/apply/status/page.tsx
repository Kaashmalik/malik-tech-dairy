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
      console.error('Failed to fetch application:', error);
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
      console.error('Failed to fetch application:', error);
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
      console.error(error);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold dark:text-white mb-2">No Application Found</h2>
        <p className="text-gray-500 dark:text-slate-400 mb-6">
          You haven&apos;t submitted a farm application yet.
        </p>
        <Link href="/apply">
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Apply for Farm ID
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    );
  }

  const status = statusConfig[application.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const needsPayment = application.requestedPlan !== 'free' && !application.paymentSlipUrl && application.status === 'pending';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-xl mx-auto">
        {/* Status Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 ${status.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <StatusIcon className={`w-10 h-10 ${status.color}`} />
          </div>
          <h1 className="text-3xl font-bold dark:text-white">{status.title}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">{status.description}</p>
        </div>

        {/* Application Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between pb-4 border-b dark:border-slate-700">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="font-semibold dark:text-white">{application.farmName}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  ID: {application.id.slice(0, 8)}...
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="py-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">Owner</span>
              <span className="font-medium dark:text-white">{application.ownerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">Plan</span>
              <span className="font-medium dark:text-white capitalize">{application.requestedPlan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-slate-400">Applied</span>
              <span className="font-medium dark:text-white">
                {new Date(application.createdAt).toLocaleDateString()}
              </span>
            </div>
            {application.assignedFarmId && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">Farm ID</span>
                <span className="font-bold text-emerald-600">{application.assignedFarmId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Upload Section */}
        {needsPayment && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="font-semibold dark:text-white flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Upload Payment Slip
            </h2>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Please transfer the subscription fee to our bank account and upload the payment slip.
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-4 space-y-2">
              <p className="text-sm font-medium dark:text-white">Bank Account Details:</p>
              <div className="text-sm text-gray-600 dark:text-slate-300 space-y-1">
                <p><strong>Bank:</strong> Bank Alfalah</p>
                <p><strong>Account Title:</strong> MTK Dairy Pvt Ltd</p>
                <p><strong>Account #:</strong> 1234567890123</p>
                <p><strong>IBAN:</strong> PK12ALFH1234567890123456</p>
              </div>
            </div>

            <div className="relative">
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Payment Slip
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Rejection Reason */}
        {application.status === 'rejected' && application.rejectionReason && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 mb-6 border border-red-200 dark:border-red-800">
            <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">Reason:</h3>
            <p className="text-red-600 dark:text-red-400">{application.rejectionReason}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {application.status === 'approved' ? (
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : application.status === 'rejected' ? (
            <Link href="/apply" className="flex-1">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                Apply Again
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <div className="text-center w-full py-4 text-gray-500 dark:text-slate-400">
              <Clock className="w-5 h-5 inline mr-2" />
              We&apos;ll notify you by email when your application status changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
