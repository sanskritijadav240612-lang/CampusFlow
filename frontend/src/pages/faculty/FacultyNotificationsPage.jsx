import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowRight,
} from 'lucide-react';
import facultyService from '../../services/faculty.service';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { formatDateTime, formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

export const FacultyNotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Retrying state map: { [notifId]: boolean }
  const [retryingMap, setRetryingMap] = useState({});
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await facultyService.getNotifications(params);
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to retrieve notification delivery logs.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter, page]);

  const handleRetry = async (notificationId) => {
    setRetryingMap((prev) => ({ ...prev, [notificationId]: true }));
    setActionFeedback(null);
    try {
      const response = await facultyService.retryNotification(notificationId);
      if (response.success) {
        setActionFeedback({
          type: 'success',
          message: response.message || 'Notification dispatch retry initiated.',
        });
        fetchNotifications();
      }
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Retry dispatch failed.',
      });
    } finally {
      setRetryingMap((prev) => ({ ...prev, [notificationId]: false }));
    }
  };

  const statusTabs = [
    { id: 'all', label: 'All Logs' },
    { id: 'sent', label: 'Sent' },
    { id: 'pending', label: 'Pending' },
    { id: 'failed', label: 'Failed' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Notifications & Delivery Audit"
        description="Monitor automated Resend decision emails, delivery statuses, attempt counts, and trigger manual dispatch retries."
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={RefreshCw}
            onClick={fetchNotifications}
            disabled={isLoading}
          >
            Refresh Logs
          </Button>
        }
      />

      {actionFeedback && (
        <Alert variant={actionFeedback.type} onClose={() => setActionFeedback(null)}>
          {actionFeedback.message}
        </Alert>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-surface-border p-3 shadow-soft flex items-center gap-1 overflow-x-auto">
        {statusTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setStatusFilter(tab.id);
              setPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors duration-150',
              statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow-soft'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Fetching notification logs..." />
      ) : error ? (
        <ErrorState
          title="Could not load notification audit"
          message={error}
          onRetry={fetchNotifications}
        />
      ) : notifications.length === 0 ? (
        <EmptyState
          title={
            statusFilter !== 'all'
              ? `No notifications marked "${statusFilter}"`
              : 'No notification records logged yet'
          }
          description="Decision notification emails triggered by faculty approvals or rejections will be tracked here."
        />
      ) : (
        <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-surface-border text-slate-600 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Proposal</th>
                  <th className="py-3 px-4">Recipient Email</th>
                  <th className="py-3 px-4">Notification Type</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Message ID / Error</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-700">
                {notifications.map((notif) => {
                  const isSent = notif.status === 'sent';
                  const isRetrying = Boolean(retryingMap[notif._id]);

                  return (
                    <tr key={notif._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                        {notif.eventRequestId?.title || 'Event Proposal'}
                        <span className="block text-[11px] text-slate-400 font-normal">
                          Logged: {formatDateTime(notif.createdAt)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">{notif.recipientEmail}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[11px] font-semibold',
                            notif.type === 'request_approved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          )}
                        >
                          {notif.type === 'request_approved' ? 'Approval Notice' : 'Rejection Notice'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={notif.status} />
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium">
                        {notif.attemptCount} / 5
                      </td>
                      <td className="py-3.5 px-4 max-w-xs font-mono text-[11px]">
                        {isSent ? (
                          <span className="text-emerald-700 truncate block" title={notif.providerMessageId}>
                            {notif.providerMessageId || 'Delivered'}
                          </span>
                        ) : notif.lastError ? (
                          <span className="text-rose-600 truncate block" title={notif.lastError}>
                            {notif.lastError}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending dispatch</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {!isSent && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={RotateCcw}
                            onClick={() => handleRetry(notif._id)}
                            isLoading={isRetrying}
                            disabled={isRetrying}
                          >
                            Retry
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-surface-border flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing page <strong className="text-slate-800">{pagination.page}</strong> of{' '}
                <strong className="text-slate-800">{pagination.totalPages}</strong> ({pagination.total}{' '}
                total records)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={ChevronLeft}
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  rightIcon={ChevronRight}
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FacultyNotificationsPage;
