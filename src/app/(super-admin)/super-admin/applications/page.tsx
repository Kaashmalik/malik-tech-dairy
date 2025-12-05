// Super Admin - Farm Applications Management Page
'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  ExternalLink,
  Loader2
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';

type ApplicationStatus = 'pending' | 'payment_uploaded' | 'under_review' | 'approved' | 'rejected';

interface FarmApplication {
  id: string;
  farmName: string;
  ownerName: string;
  email: string;
  phone: string;
  city?: string;
  province?: string;
  requestedPlan: string;
  status: ApplicationStatus;
  paymentSlipUrl?: string;
  paymentAmount?: number;
  assignedFarmId?: string;
  createdAt: string;
}

const statusConfig: Record<ApplicationStatus, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: Clock },
  payment_uploaded: { label: 'Payment Uploaded', color: 'bg-amber-100 text-amber-700', icon: Upload },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700', icon: Eye },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<FarmApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<FarmApplication | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch applications
  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? '/api/admin/applications'
        : `/api/admin/applications?status=${statusFilter}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setApplications(data.data.applications.map((item: { application: FarmApplication }) => item.application));
      }
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }

  // Handle review submission
  async function handleReview() {
    if (!selectedApplication) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/applications/${selectedApplication.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: reviewAction,
          reviewNotes,
          rejectionReason: reviewAction === 'reject' ? rejectionReason : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setShowReviewDialog(false);
        setSelectedApplication(null);
        setReviewNotes('');
        setRejectionReason('');
        fetchApplications();
      } else {
        // Show detailed error message
        const errorMsg = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to review application';
        toast.error(errorMsg);
        console.error('Review error:', data);
      }
    } catch (error) {
      console.error('Review failed:', error);
      toast.error('Failed to review application - check console for details');
    } finally {
      setSubmitting(false);
    }
  }

  // Filter applications by search query (robust with null checks)
  const filteredApplications = applications.filter(app => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const farmName = (app.farmName || '').toLowerCase();
    const ownerName = (app.ownerName || '').toLowerCase();
    const email = (app.email || '').toLowerCase();
    const phone = (app.phone || '').toLowerCase();
    const farmId = (app.assignedFarmId || '').toLowerCase();
    
    return farmName.includes(query) ||
           ownerName.includes(query) ||
           email.includes(query) ||
           phone.includes(query) ||
           farmId.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Farm Applications</h1>
          <p className="text-gray-500 dark:text-slate-400">
            Review and manage farm registration applications
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search farm, owner, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-10">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Applications</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="payment_uploaded">Payment Uploaded</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      {!loading && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
          <span>
            {searchQuery ? (
              <>Showing <strong className="text-gray-700 dark:text-white">{filteredApplications.length}</strong> of {applications.length} applications</>
            ) : (
              <><strong className="text-gray-700 dark:text-white">{filteredApplications.length}</strong> applications</>
            )}
          </span>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-gray-400" />
            <p className="mt-2 text-gray-500">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-300" />
            <p className="mt-2 text-gray-500">No applications found</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View - Enhanced */}
            <div className="lg:hidden">
              {filteredApplications.map((app, index) => {
                const status = statusConfig[app.status];
                const StatusIcon = status.icon;
                
                return (
                  <div 
                    key={app.id} 
                    className={`p-4 ${index !== 0 ? 'border-t border-gray-100 dark:border-slate-700' : ''}`}
                  >
                    {/* Header with status badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {app.farmName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-slate-300">{app.ownerName}</p>
                        {app.assignedFarmId && (
                          <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30">
                            <span className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                              {app.assignedFarmId}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">{status.label}</span>
                      </span>
                    </div>
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wide">Email</p>
                        <p className="text-gray-700 dark:text-slate-300 truncate">{app.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wide">Phone</p>
                        <p className="text-gray-700 dark:text-slate-300">{app.phone}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wide">Plan</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 capitalize">
                          {app.requestedPlan}
                        </span>
                      </div>
                      <div>
                        <p className="text-gray-400 dark:text-slate-500 text-xs uppercase tracking-wide">Applied</p>
                        <p className="text-gray-700 dark:text-slate-300">{format(new Date(app.createdAt), 'MMM d, yyyy')}</p>
                      </div>
                    </div>

                    {/* Payment slip link */}
                    {app.paymentSlipUrl && (
                      <div className="mb-3">
                        <a
                          href={app.paymentSlipUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Payment Slip
                        </a>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    {(app.status === 'pending' || app.status === 'payment_uploaded') && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app);
                            setReviewAction('approve');
                            setShowReviewDialog(true);
                          }}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApplication(app);
                            setReviewAction('reject');
                            setShowReviewDialog(true);
                          }}
                          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Farm Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {filteredApplications.map((app) => {
                    const status = statusConfig[app.status];
                    const StatusIcon = status.icon;
                    
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium dark:text-white">{app.farmName}</p>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{app.ownerName}</p>
                            {app.assignedFarmId && (
                              <p className="text-xs text-emerald-600 font-mono mt-1">
                                {app.assignedFarmId}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="dark:text-white">{app.email}</p>
                            <p className="text-gray-500 dark:text-slate-400">{app.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                            {app.requestedPlan}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {app.paymentSlipUrl ? (
                            <a
                              href={app.paymentSlipUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                              View Slip
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">Not uploaded</span>
                          )}
                          {app.paymentAmount && (
                            <p className="text-xs text-gray-500 mt-1">
                              Rs. {(app.paymentAmount / 100).toLocaleString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-slate-400">
                          {format(new Date(app.createdAt), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(app.status === 'pending' || app.status === 'payment_uploaded') && (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setReviewAction('approve');
                                  setShowReviewDialog(true);
                                }}
                                className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApplication(app);
                                  setReviewAction('reject');
                                  setShowReviewDialog(true);
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
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

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? '✅ Approve Application' : '❌ Reject Application'}
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approve' 
                ? 'Confirm approval and assign Farm ID to this application.'
                : 'Provide a reason for rejecting this application.'}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p className="font-medium">{selectedApplication.farmName}</p>
                <p className="text-sm text-gray-500">{selectedApplication.ownerName}</p>
                <p className="text-sm text-gray-500">{selectedApplication.email}</p>
              </div>

              {selectedApplication.paymentSlipUrl && (
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Slip</label>
                  <a
                    href={selectedApplication.paymentSlipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Payment Slip
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  {reviewAction === 'approve' ? 'Notes (optional)' : 'Rejection Reason *'}
                </label>
                {reviewAction === 'approve' ? (
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    rows={3}
                    placeholder="Add any notes about this approval..."
                  />
                ) : (
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={3}
                    placeholder="Explain why this application is being rejected..."
                    required
                  />
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReviewDialog(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={submitting || (reviewAction === 'reject' && !rejectionReason)}
              className={reviewAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {reviewAction === 'approve' ? 'Approve & Assign Farm ID' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
