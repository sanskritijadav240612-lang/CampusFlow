import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  Layers,
  MapPin,
} from 'lucide-react';
import studentService from '../../services/student.service';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { formatTimeRange, formatDateTime, formatDate, formatTime } from '../../utils/date';

export const RequestDetailPage = () => {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequestDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getRequestById(requestId);
      if (response.success && response.data) {
        setRequest(response.data.request);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load event request details. Please check ID.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  if (isLoading) {
    return <LoadingState message="Fetching event request breakdown..." />;
  }

  if (error || !request) {
    return (
      <div className="space-y-4">
        <Link to="/student/requests">
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>
            Back to Requests
          </Button>
        </Link>
        <ErrorState
          title="Event Request Not Found"
          message={error || 'The requested event record does not exist or does not belong to you.'}
          onRetry={fetchRequestDetails}
        />
      </div>
    );
  }

  const isApproved = request.status === 'Approved';
  const isRejected = request.status === 'Rejected';
  const isUnderReview = request.status === 'Under Review';

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Back Button */}
      <div>
        <Link to="/student/requests">
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>
            Back to My Requests
          </Button>
        </Link>
      </div>

      {/* Main Header */}
      <PageHeader
        title={request.title}
        description={
          request.eventType
            ? `Category: ${request.eventType} &bull; Submitted on ${formatDate(request.createdAt)}`
            : `Submitted on ${formatDate(request.createdAt)}`
        }
        badge={<StatusBadge status={request.status} />}
      />

      {/* 1. VISUAL REQUEST LIFECYCLE TIMELINE */}
      <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-6">
          Request Approval Lifecycle
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Step 1: Submission */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Request Submitted</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {formatDateTime(request.createdAt)}
              </p>
              <span className="inline-block mt-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          </div>

          {/* Step 2: Under Review */}
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                isUnderReview
                  ? 'bg-amber-50 text-amber-700 border border-amber-300 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">Faculty Review</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isUnderReview
                  ? 'Pending administrative review'
                  : `Reviewed on ${formatDate(request.decisionAt || request.updatedAt)}`}
              </p>
              <span
                className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded ${
                  isUnderReview
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {isUnderReview ? 'In Progress' : 'Completed'}
              </span>
            </div>
          </div>

          {/* Step 3: Decision */}
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                  : isRejected
                  ? 'bg-rose-50 text-rose-700 border border-rose-300'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : isRejected ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-900">
                {isApproved
                  ? 'Allocations Confirmed'
                  : isRejected
                  ? 'Request Rejected'
                  : 'Final Decision'}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {request.decisionAt ? formatDateTime(request.decisionAt) : 'Awaiting review decision'}
              </p>
              {request.status && (
                <span className="inline-block mt-1">
                  <StatusBadge status={request.status} />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FACULTY REMARK / DECISION NOTICE (IF DECIDED) */}
      {request.decisionRemark && (
        <div
          className={`p-5 rounded-lg border shadow-soft ${
            isApproved
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              {isApproved ? 'Faculty Approval Remarks' : 'Faculty Rejection Reason'}
            </h4>
          </div>
          <p className="text-xs leading-relaxed opacity-90">{request.decisionRemark}</p>
        </div>
      )}

      {/* 3. EVENT SPECIFICATIONS & SCHEDULE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Schedule & Timing Card */}
        <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-surface-border">
            Scheduled Time Window
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Event Date
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {formatDate(request.startAt, { dateStyle: 'full' })}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Timing
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {formatTime(request.startAt)} &ndash; {formatTime(request.endAt)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Expected Attendance
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5 font-mono">
                {request.attendeeCount} Students
              </p>
            </div>
          </div>
        </div>

        {/* Requested Resources Breakdown */}
        <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-surface-border">
            Requested Campus Resources
          </h3>
          <div className="space-y-2.5">
            {request.requestedResources?.map((item, idx) => {
              const res = item.resourceId;
              const isCapacity = res?.resourceMode === 'capacity';

              return (
                <div
                  key={idx}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-campus-700" />
                      {res?.name || 'Campus Resource'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Category: {res?.category || 'General'}
                      {res?.location ? ` &bull; Location: ${res.location}` : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {isCapacity ? (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-campus-100 text-campus-800">
                        Venue (Capacity: {res?.capacity || '—'})
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 font-mono">
                        {item.requestedQuantity || 1} unit(s)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. EVENT DESCRIPTION */}
      <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-surface-border">
          Event Purpose & Description
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
          {request.description}
        </p>
      </div>
    </div>
  );
};

export default RequestDetailPage;
