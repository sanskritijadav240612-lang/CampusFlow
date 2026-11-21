import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Building,
  Package,
  Database,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Inbox,
  User,
  Calendar,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import facultyService from '../../services/faculty.service';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import { formatTimeRange, formatDate } from '../../utils/date';

export const FacultyDashboardPage = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await facultyService.getDashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load faculty operations dashboard. Please check connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const pendingRequests = dashboardData?.recentPendingRequests || [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Campus Operations & Approvals"
        description="Monitor university resource occupancy, inspect real-time allocation conflicts, and make administrative event decisions."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              leftIcon={RefreshCw}
              onClick={fetchDashboard}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Link to="/faculty/requests">
              <Button variant="primary" size="sm" leftIcon={Inbox}>
                Request Inbox
              </Button>
            </Link>
          </div>
        }
      />

      {isLoading ? (
        <LoadingState message="Fetching campus operations statistics..." />
      ) : error ? (
        <ErrorState
          title="Dashboard Unavailable"
          message={error}
          onRetry={fetchDashboard}
        />
      ) : (
        <>
          {/* Key Operations Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Pending Review"
              value={dashboardData?.pendingRequestsCount ?? 0}
              helper="Requests awaiting decision"
              icon={Clock}
              variant="amber"
            />
            <StatCard
              label="Occupied Venues"
              value={dashboardData?.currentlyOccupiedVenues ?? 0}
              helper="Currently active bookings"
              icon={Building}
              variant="blue"
            />
            <StatCard
              label="Allocated Equipment"
              value={`${dashboardData?.currentlyAllocatedEquipment ?? 0} units`}
              helper="Equipment currently in use"
              icon={Package}
              variant="emerald"
            />
            <StatCard
              label="Registered Resources"
              value={dashboardData?.totalActiveResources ?? 0}
              helper="Active campus inventory"
              icon={Database}
            />
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/faculty/requests"
              className="bg-white p-5 rounded-lg border border-surface-border shadow-soft hover:border-campus-400 hover:shadow-elevated transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Inbox className="w-4 h-4 text-campus-700" />
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-campus-700">
                    Decision Inbox
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Inspect proposals, resolve schedule version locks & approve
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-campus-700 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/faculty/resources"
              className="bg-white p-5 rounded-lg border border-surface-border shadow-soft hover:border-campus-400 hover:shadow-elevated transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-campus-700" />
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-campus-700">
                    Resource Inventory
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage facility capacities, warehouse stock & add resources
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-campus-700 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/faculty/notifications"
              className="bg-white p-5 rounded-lg border border-surface-border shadow-soft hover:border-campus-400 hover:shadow-elevated transition-all flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-campus-700" />
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-campus-700">
                    Delivery & Audit Log
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Automated email delivery tracking, attempt counts & manual dispatch retry
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-campus-700 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Urgent Review Queue (Oldest Pending Requests First) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                  Urgent Review Queue
                </h3>
              </div>
              <Link
                to="/faculty/requests?status=Under+Review"
                className="text-xs font-semibold text-campus-700 hover:underline"
              >
                View All Pending ({dashboardData?.pendingRequestsCount || 0}) &rarr;
              </Link>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-lg border border-surface-border p-8 text-center shadow-soft">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900">
                  All Caught Up!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are currently zero pending student event requests awaiting administrative review.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-surface-border text-slate-600 uppercase font-semibold tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Event Title</th>
                        <th className="py-3 px-4">Student Organizer</th>
                        <th className="py-3 px-4">Requested Timing</th>
                        <th className="py-3 px-4">Resources</th>
                        <th className="py-3 px-4">Attendees</th>
                        <th className="py-3 px-4 text-right">Review Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-border text-slate-700">
                      {pendingRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs">
                            <Link
                              to={`/faculty/requests/${req._id}`}
                              className="hover:text-campus-700"
                            >
                              {req.title}
                            </Link>
                            <span className="block text-[11px] text-slate-400 font-normal">
                              Submitted {formatDate(req.createdAt)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">
                              {req.studentId?.name || 'Student'}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {req.studentId?.enrollmentNumber || req.studentId?.email}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {formatTimeRange(req.startAt, req.endAt)}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs">
                            <div className="flex flex-wrap gap-1">
                              {req.requestedResources?.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {item.resourceId?.name || 'Resource'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium">
                            {req.attendeeCount}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <Link to={`/faculty/requests/${req._id}`}>
                              <Button variant="primary" size="sm" rightIcon={ArrowRight}>
                                Inspect & Decide
                              </Button>
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
        </>
      )}
    </div>
  );
};

export default FacultyDashboardPage;
