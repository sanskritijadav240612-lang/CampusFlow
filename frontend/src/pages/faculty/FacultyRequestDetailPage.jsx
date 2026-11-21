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
  AlertTriangle,
  Shield,
  User,
  Check,
  X,
  Layers,
  FileText,
  Package,
} from 'lucide-react';
import facultyService from '../../services/faculty.service';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { formatTimeRange, formatDateTime, formatDate, formatTime } from '../../utils/date';
import { cn } from '../../utils/cn';

export const FacultyRequestDetailPage = () => {
  const { requestId } = useParams();

  const [request, setRequest] = useState(null);
  const [conflictsData, setConflictsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Decision Modal States
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [decisionRemark, setDecisionRemark] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionFeedback, setDecisionFeedback] = useState(null);

  const fetchRequestAndConflicts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqRes, confRes] = await Promise.all([
        facultyService.getRequestDetails(requestId),
        facultyService.getRequestConflicts(requestId),
      ]);

      if (reqRes.success && reqRes.data?.request) {
        setRequest(reqRes.data.request);
      }
      if (confRes.success && confRes.data) {
        setConflictsData(confRes.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load request or conflict details. Please verify request ID.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestAndConflicts();
  }, [requestId]);

  const handleApprove = async () => {
    setIsSubmittingDecision(true);
    setDecisionFeedback(null);
    try {
      const response = await facultyService.approveRequest(requestId, decisionRemark);
      if (response.success && response.data?.request) {
        setIsApproveModalOpen(false);
        setDecisionRemark('');
        setDecisionFeedback({
          type: 'success',
          message: 'Request approved successfully! Resources have been locked and allocated atomically in MongoDB.',
        });
        await fetchRequestAndConflicts();
      }
    } catch (err) {
      setDecisionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Approval failed due to resource conflict or concurrency lock.',
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleReject = async () => {
    setIsSubmittingDecision(true);
    setDecisionFeedback(null);
    try {
      const response = await facultyService.rejectRequest(requestId, decisionRemark);
      if (response.success && response.data?.request) {
        setIsRejectModalOpen(false);
        setDecisionRemark('');
        setDecisionFeedback({
          type: 'success',
          message: 'Event request has been rejected. Notification record queued.',
        });
        await fetchRequestAndConflicts();
      }
    } catch (err) {
      setDecisionFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Rejection failed. Please try again.',
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Fetching proposal and conflict matrix..." />;
  }

  if (error || !request) {
    return (
      <div className="space-y-4">
        <Link to="/faculty/requests">
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>
            Back to Inbox
          </Button>
        </Link>
        <ErrorState
          title="Proposal Not Found"
          message={error || 'The requested event proposal could not be retrieved.'}
          onRetry={fetchRequestAndConflicts}
        />
      </div>
    );
  }

  const isPending = request.status === 'Under Review';
  const hasConflict = conflictsData?.hasAnyConflict;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Navigation & Feedback */}
      <div className="flex items-center justify-between">
        <Link to="/faculty/requests">
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft}>
            Back to Request Inbox
          </Button>
        </Link>

        {/* Action Controls for Pending Requests */}
        {isPending && (
          <div className="flex items-center gap-2.5">
            <Button
              variant="dangerOutline"
              size="sm"
              leftIcon={X}
              onClick={() => {
                setDecisionRemark('');
                setIsRejectModalOpen(true);
              }}
            >
              Reject Proposal
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={Check}
              onClick={() => {
                setDecisionRemark('');
                setIsApproveModalOpen(true);
              }}
            >
              Approve & Allocate
            </Button>
          </div>
        )}
      </div>

      {decisionFeedback && (
        <Alert
          variant={decisionFeedback.type}
          onClose={() => setDecisionFeedback(null)}
        >
          {decisionFeedback.message}
        </Alert>
      )}

      {/* Main Header */}
      <PageHeader
        title={request.title}
        description={`Submitted by ${request.studentId?.name || 'Student'} on ${formatDate(request.createdAt)}`}
        badge={<StatusBadge status={request.status} />}
      />

      {/* Decision Remarks Card (if already decided) */}
      {request.decisionRemark && (
        <div
          className={`p-5 rounded-lg border shadow-soft ${
            request.status === 'Approved'
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Faculty Administrative Feedback ({request.status})
            </h4>
          </div>
          <p className="text-xs leading-relaxed opacity-90">{request.decisionRemark}</p>
          <p className="text-[11px] opacity-75 mt-2 font-mono">
            Decided by {request.decisionBy?.name || 'Faculty Member'} on {formatDateTime(request.decisionAt)}
          </p>
        </div>
      )}

      {/* ========================================================
          1. CONFLICT & OVERLAP ANALYSIS MATRIX (HIGH PRIORITY)
          ======================================================== */}
      <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-campus-700" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Resource Conflict & Overlap Analysis
            </h3>
          </div>
          <span
            className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-bold font-mono',
              hasConflict
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            )}
          >
            {hasConflict
              ? 'Resource Conflicts Detected'
              : request.status === 'Approved'
                ? '0 Conflicts \u2022 Successfully Allocated'
                : '0 Conflicts \u2022 Clear to Allocate'}
          </span>
        </div>

        {conflictsData?.resourceConflicts?.length === 0 ? (
          <p className="text-xs text-slate-500 italic">No resources attached to evaluate.</p>
        ) : (
          <div className="space-y-3">
            {conflictsData?.resourceConflicts?.map((rc, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-lg border text-xs space-y-3 transition-colors',
                  rc.hasConflict
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-slate-50 border-slate-200'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {rc.resourceMode === 'capacity' ? (
                      <Building className="w-4 h-4 text-campus-700" />
                    ) : (
                      <Package className="w-4 h-4 text-sky-700" />
                    )}
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{rc.resourceName}</span>
                      <span className="text-[11px] text-slate-500 ml-2 font-mono">
                        ({rc.resourceMode === 'capacity' ? `Capacity: ${rc.capacity}` : `Total Stock: ${rc.totalQuantity}`})
                      </span>
                    </div>
                  </div>

                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-semibold self-start sm:self-auto',
                      rc.hasConflict
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-emerald-100 text-emerald-800'
                    )}
                  >
                    {rc.hasConflict ? 'Conflict' : 'Available'}
                  </span>
                </div>

                {/* Conflict Reason */}
                {rc.conflictReason && (
                  <div className="p-2.5 bg-rose-100/70 border border-rose-200 rounded text-rose-900 text-[11px] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{rc.conflictReason}</span>
                  </div>
                )}

                {/* Overlapping Approved Allocations */}
                {rc.overlappingAllocations && rc.overlappingAllocations.length > 0 && (
                  <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
                      Active Approved Allocations in this Window:
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {rc.overlappingAllocations.map((alloc, aIdx) => (
                        <li key={aIdx} className="flex items-center justify-between">
                          <span>
                            &bull; <strong>{alloc.eventTitle || 'Event'}</strong> (Organizer: {alloc.student?.name || 'Student'})
                          </span>
                          <span className="text-slate-500 font-mono">
                            {formatTime(alloc.startAt)} &ndash; {formatTime(alloc.endAt)}
                            {alloc.allocatedQuantity ? ` (${alloc.allocatedQuantity} units)` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Competing Pending Requests */}
                {rc.competingPendingRequests && rc.competingPendingRequests.length > 0 && (
                  <div className="bg-white p-3 rounded border border-slate-200 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                      Competing Pending Requests for this Window:
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-700">
                      {rc.competingPendingRequests.map((comp, cIdx) => (
                        <li key={cIdx} className="flex items-center justify-between">
                          <span>
                            &bull; <strong>{comp.eventTitle}</strong> (by {comp.student?.name || 'Student'})
                          </span>
                          <span className="text-slate-500 font-mono">
                            {formatTime(comp.startAt)} &ndash; {formatTime(comp.endAt)}
                            {comp.requestedQuantity ? ` (${comp.requestedQuantity} units)` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          2. STUDENT ORGANIZER & EVENT SPECIFICATIONS
          ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Organizer Info */}
        <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-surface-border">
            Student Organizer Credentials
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Name
              </span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {request.studentId?.name || 'Unknown Student'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Institutional Email
              </span>
              <p className="text-slate-800 font-mono mt-0.5">{request.studentId?.email || '—'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Enrollment Number
              </span>
              <p className="text-slate-800 font-mono mt-0.5">
                {request.studentId?.enrollmentNumber || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Schedule & Attendance */}
        <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-surface-border">
            Schedule & Attendance
          </h3>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Date & Timing
              </span>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {formatDate(request.startAt, { dateStyle: 'full' })}
              </p>
              <p className="text-xs text-slate-600 font-medium">
                {formatTime(request.startAt)} &ndash; {formatTime(request.endAt)}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Expected Attendees
              </span>
              <p className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                {request.attendeeCount} Students
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg border border-surface-border p-6 shadow-soft space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-2 border-b border-surface-border">
          Event Description & Purpose
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
          {request.description}
        </p>
      </div>

      {/* ========================================================
          3. APPROVAL MODAL
          ======================================================== */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => !isSubmittingDecision && setIsApproveModalOpen(false)}
        title="Approve Event Request & Commit Allocations"
        description="This will atomically lock the resources and reserve inventory for this event schedule."
      >
        <div className="space-y-4 text-xs">
          {hasConflict && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
              <strong>Warning:</strong> A conflict was detected. The backend transaction will re-verify availability; if resources are fully booked, approval will be rejected.
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Faculty Approval Remark (Optional, included in student email)
            </label>
            <textarea
              rows={3}
              value={decisionRemark}
              onChange={(e) => setDecisionRemark(e.target.value)}
              placeholder="e.g. Approved. Keys can be collected from the facilities office 30 mins prior."
              className="w-full p-2.5 rounded border border-slate-300 text-xs focus:outline-none focus:border-campus-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsApproveModalOpen(false)}
              disabled={isSubmittingDecision}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleApprove}
              isLoading={isSubmittingDecision}
            >
              Confirm Atomic Approval
            </Button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          4. REJECTION MODAL
          ======================================================== */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => !isSubmittingDecision && setIsRejectModalOpen(false)}
        title="Reject Event Proposal"
        description="Please provide feedback to explain to the student why this proposal cannot be approved."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Rejection Reason / Feedback (Sent in notification email)
            </label>
            <textarea
              rows={3}
              value={decisionRemark}
              onChange={(e) => setDecisionRemark(e.target.value)}
              placeholder="e.g. The requested auditorium is occupied by an institutional seminar. Please reschedule for next Friday."
              className="w-full p-2.5 rounded border border-slate-300 text-xs focus:outline-none focus:border-rose-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectModalOpen(false)}
              disabled={isSubmittingDecision}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              isLoading={isSubmittingDecision}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FacultyRequestDetailPage;
