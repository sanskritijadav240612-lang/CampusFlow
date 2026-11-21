import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Building,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import studentService from '../../services/student.service';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { formatTimeRange, isUpcoming } from '../../utils/date';

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await studentService.getMyRequests({ limit: 50 });
      if (response.success && response.data) {
        setRequests(response.data.requests || []);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load student dashboard records. Please check connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate real metrics from actual backend records
  const totalCount = requests.length;
  const underReviewCount = requests.filter((r) => r.status === 'Under Review').length;
  const approvedCount = requests.filter((r) => r.status === 'Approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'Rejected').length;

  // Upcoming confirmed events (Approved and startAt in future)
  const upcomingEvents = requests
    .filter((r) => r.status === 'Approved' && isUpcoming(r.startAt))
    .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
    .slice(0, 3);

  // Recent requests activity (last 5 sorted by creation date)
  const recentRequests = [...requests].slice(0, 5);

  const studentFirstName = user?.name ? user.name.split(' ')[0] : 'Student';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <PageHeader
        title={`Welcome back, ${studentFirstName}`}
        description="Monitor your campus event requests, view approved venue allocations, and coordinate new events."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={fetchDashboardData}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Link to="/student/create-request">
              <Button variant="primary" size="sm" leftIcon={PlusCircle}>
                New Event Request
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading your event activity..." />
      ) : error ? (
        <ErrorState
          title="Unable to load dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      ) : (
        <>
          {/* Real Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Requests"
              value={totalCount}
              helper="All submitted proposals"
              icon={Calendar}
            />
            <StatCard
              label="Under Review"
              value={underReviewCount}
              helper="Awaiting faculty review"
              icon={Clock}
              variant="amber"
            />
            <StatCard
              label="Approved Events"
              value={approvedCount}
              helper="Confirmed campus bookings"
              icon={CheckCircle2}
              variant="emerald"
            />
            <StatCard
              label="Rejected"
              value={rejectedCount}
              helper="Declined by administration"
              icon={AlertCircle}
            />
          </div>

          {/* Quick AI Action Banner */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-800">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-campus-900/60 text-campus-300 border border-campus-700/50">
                <Sparkles className="w-3.5 h-3.5 text-campus-400" />
                AI Event Coordinator Active
              </span>
              <h3 className="text-lg font-bold text-white">
                Planning a new seminar, club hackathon, or cultural fest?
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Describe your requirements naturally in conversation. The assistant extracts schedules,
                checks availability in real time, and pre-fills your request draft.
              </p>
            </div>
            <Link to="/student/create-request" className="shrink-0">
              <Button
                variant="primary"
                size="md"
                rightIcon={ArrowRight}
                className="bg-campus-600 hover:bg-campus-500 shadow-soft"
              >
                Start Event Proposal
              </Button>
            </Link>
          </div>

          {/* Dual Panel: Upcoming Confirmed Events vs Recent Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Upcoming Confirmed Events (1 col) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Confirmed Upcoming Events
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {upcomingEvents.length} Active
                </span>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="bg-white rounded-lg border border-surface-border p-6 text-center shadow-soft">
                  <Building className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No upcoming confirmed events</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Approved events with future dates will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map((evt) => (
                    <div
                      key={evt._id}
                      className="bg-white rounded-lg border border-surface-border p-4 shadow-soft hover:border-campus-400 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {evt.title}
                        </h4>
                        <StatusBadge status={evt.status} />
                      </div>
                      <p className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatTimeRange(evt.startAt, evt.endAt)}
                      </p>
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {evt.requestedResources?.length || 0} resource(s) reserved
                        </span>
                        <Link
                          to={`/student/requests/${evt._id}`}
                          className="text-campus-700 font-semibold hover:underline"
                        >
                          View Details &rarr;
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Recent Requests Table (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Recent Request Activity
                </h3>
                <Link
                  to="/student/requests"
                  className="text-xs font-semibold text-campus-700 hover:underline"
                >
                  View All Requests &rarr;
                </Link>
              </div>

              {recentRequests.length === 0 ? (
                <EmptyState
                  title="No event requests found"
                  description="You haven't submitted any campus event requests yet. Use the AI assistant to start your first draft."
                  actionText="Create First Request"
                  actionIcon={PlusCircle}
                  onAction={() => window.location.assign('/student/create-request')}
                />
              ) : (
                <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-surface-border text-slate-600 uppercase font-semibold tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Event Title</th>
                          <th className="py-3 px-4">Scheduled Window</th>
                          <th className="py-3 px-4">Attendees</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border text-slate-700">
                        {recentRequests.map((req) => (
                          <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              <Link
                                to={`/student/requests/${req._id}`}
                                className="hover:text-campus-700"
                              >
                                {req.title}
                              </Link>
                              {req.eventType && (
                                <span className="block text-[11px] font-normal text-slate-400">
                                  {req.eventType}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              {formatTimeRange(req.startAt, req.endAt)}
                            </td>
                            <td className="py-3.5 px-4 font-mono">{req.attendeeCount}</td>
                            <td className="py-3.5 px-4">
                              <StatusBadge status={req.status} />
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <Link
                                to={`/student/requests/${req._id}`}
                                className="font-semibold text-campus-700 hover:text-campus-900"
                              >
                                Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StudentDashboardPage;
