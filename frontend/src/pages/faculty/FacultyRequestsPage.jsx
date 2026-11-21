import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Inbox,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Building,
  User,
  Clock,
} from 'lucide-react';
import facultyService from '../../services/faculty.service';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import Button from '../../components/ui/Button';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { formatTimeRange, formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

export const FacultyRequestsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'Under Review';

  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
        status: statusFilter,
      };
      if (activeSearch.trim()) {
        params.search = activeSearch.trim();
      }

      const response = await facultyService.getRequests(params);
      if (response.success && response.data) {
        setRequests(response.data.requests || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load faculty request inbox. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, activeSearch, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  const handleTabChange = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
    setSearchParams(newStatus === 'Under Review' ? {} : { status: newStatus });
  };

  const filterTabs = [
    { id: 'Under Review', label: 'Under Review (Pending)' },
    { id: 'Approved', label: 'Approved Allocations' },
    { id: 'Rejected', label: 'Rejected' },
    { id: 'all', label: 'All Submissions' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Request Inbox"
        description="Review student event submissions, check resource conflicts, and execute atomic reservation decisions."
      />

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-lg border border-surface-border p-4 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
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

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72 flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search event title or student..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-campus-600 focus:ring-1 focus:ring-campus-600"
              />
            </div>
            <Button type="submit" variant="outline" size="sm">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <LoadingState message="Fetching requests from campus registry..." />
      ) : error ? (
        <ErrorState
          title="Could not load requests"
          message={error}
          onRetry={fetchRequests}
        />
      ) : requests.length === 0 ? (
        <EmptyState
          title={
            activeSearch
              ? `No results matching "${activeSearch}"`
              : statusFilter !== 'all'
              ? `No requests currently marked "${statusFilter}"`
              : 'Inbox is currently empty'
          }
          description="Student submissions will appear here for administrative evaluation."
        />
      ) : (
        <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-surface-border text-slate-600 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Details</th>
                  <th className="py-3 px-4">Student Organizer</th>
                  <th className="py-3 px-4">Schedule Window</th>
                  <th className="py-3 px-4">Attendees</th>
                  <th className="py-3 px-4">Requested Resources</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-700">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-900 max-w-xs">
                      <Link
                        to={`/faculty/requests/${req._id}`}
                        className="hover:text-campus-700 text-sm block"
                      >
                        {req.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-normal">
                        <span>{req.eventType || 'Campus Event'}</span>
                        <span>&bull;</span>
                        <span>Submitted {formatDate(req.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800">
                        {req.studentId?.name || 'Student'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {req.studentId?.enrollmentNumber || req.studentId?.email}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                      {formatTimeRange(req.startAt, req.endAt)}
                    </td>
                    <td className="py-4 px-4 font-mono font-medium">
                      {req.attendeeCount} students
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {req.requestedResources?.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {item.resourceId?.name || 'Resource'}
                            {item.requestedQuantity ? ` (${item.requestedQuantity})` : ''}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <Link to={`/faculty/requests/${req._id}`}>
                        <Button
                          variant={req.status === 'Under Review' ? 'primary' : 'outline'}
                          size="sm"
                          rightIcon={ArrowRight}
                        >
                          {req.status === 'Under Review' ? 'Review' : 'View'}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
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

export default FacultyRequestsPage;
