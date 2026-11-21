import React, { useState, useEffect } from 'react';
import {
  Database,
  Building,
  Package,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import resourceService from '../../services/resource.service';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Alert from '../../components/ui/Alert';
import LoadingState from '../../components/ui/LoadingState';
import ErrorState from '../../components/ui/ErrorState';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/date';
import { cn } from '../../utils/cn';

export const FacultyResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [modeFilter, setModeFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add Resource Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successFeedback, setSuccessFeedback] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Auditorium',
    resourceMode: 'capacity', // 'capacity' | 'quantity'
    capacity: '',
    totalQuantity: '',
    location: '',
    description: '',
  });

  const fetchResources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (modeFilter !== 'all') {
        params.resourceMode = modeFilter;
      }
      if (activeSearch.trim()) {
        params.search = activeSearch.trim();
      }

      const response = await resourceService.getResources(params);
      if (response.success && response.data) {
        setResources(response.data.resources || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to retrieve campus resource inventory.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [modeFilter, activeSearch, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  const handleCreateResource = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Resource name must be at least 2 characters.');
      return;
    }
    if (!formData.category.trim()) {
      setFormError('Category is required.');
      return;
    }
    if (formData.resourceMode === 'capacity') {
      const cap = parseInt(formData.capacity, 10);
      if (isNaN(cap) || cap <= 0) {
        setFormError('Capacity must be a positive integer for venues.');
        return;
      }
    } else {
      const qty = parseInt(formData.totalQuantity, 10);
      if (isNaN(qty) || qty <= 0) {
        setFormError('Total quantity must be a positive integer for equipment.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await resourceService.createResource(formData);
      setIsAddModalOpen(false);
      setSuccessFeedback(`Resource "${formData.name.trim()}" successfully added to inventory.`);
      setFormData({
        name: '',
        category: 'Auditorium',
        resourceMode: 'capacity',
        capacity: '',
        totalQuantity: '',
        location: '',
        description: '',
      });
      fetchResources();
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Failed to create resource. A duplicate name may already exist.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campus Resource Inventory"
        description="Manage university venues (capacity-controlled) and equipment (quantity-tracked) across all academic facilities."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={Plus}
            onClick={() => {
              setFormError(null);
              setIsAddModalOpen(true);
            }}
          >
            Add New Resource
          </Button>
        }
      />

      {successFeedback && (
        <Alert variant="success" onClose={() => setSuccessFeedback(null)}>
          {successFeedback}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-surface-border p-4 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'All Resources' },
              { id: 'capacity', label: 'Venues (Capacity)' },
              { id: 'quantity', label: 'Equipment (Quantity)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setModeFilter(tab.id);
                  setPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors duration-150',
                  modeFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-soft'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72 flex gap-1.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search resources by name..."
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

      {/* Inventory Table */}
      {isLoading ? (
        <LoadingState message="Loading resource inventory..." />
      ) : error ? (
        <ErrorState
          title="Could not load inventory"
          message={error}
          onRetry={fetchResources}
        />
      ) : resources.length === 0 ? (
        <EmptyState
          title={
            activeSearch
              ? `No resources matching "${activeSearch}"`
              : 'No resources registered in this category'
          }
          description="Click 'Add New Resource' to register a campus venue or equipment inventory."
          actionText="Add New Resource"
          actionIcon={Plus}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-surface-border text-slate-600 uppercase font-semibold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Resource Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Management Mode</th>
                  <th className="py-3 px-4">Capacity / Stock</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-slate-700">
                {resources.map((res) => {
                  const isCapacity = res.resourceMode === 'capacity';

                  return (
                    <tr key={res._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {isCapacity ? (
                            <Building className="w-4 h-4 text-campus-700 shrink-0" />
                          ) : (
                            <Package className="w-4 h-4 text-sky-700 shrink-0" />
                          )}
                          <span>{res.name}</span>
                        </div>
                        {res.description && (
                          <span className="block text-[11px] text-slate-400 font-normal mt-0.5 line-clamp-1">
                            {res.description}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{res.category}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[11px] font-semibold',
                            isCapacity
                              ? 'bg-campus-50 text-campus-800 border border-campus-200'
                              : 'bg-sky-50 text-sky-800 border border-sky-200'
                          )}
                        >
                          {isCapacity ? 'Venue (Capacity)' : 'Equipment (Quantity)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {isCapacity
                          ? `${res.capacity} Seats`
                          : `${res.totalQuantity} Total Units`}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {res.location || <span className="text-slate-400 italic">Campus Main</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
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
                total items)
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

      {/* Add Resource Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => !isSubmitting && setIsAddModalOpen(false)}
        title="Add Campus Resource"
        description="Register a new university venue or equipment asset into the institutional registry."
      >
        <form onSubmit={handleCreateResource} className="space-y-4 text-xs">
          {formError && <Alert variant="error">{formError}</Alert>}

          <Input
            label="Resource Name"
            placeholder="e.g. Science Block Seminar Hall 2"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Resource Mode"
              required
              value={formData.resourceMode}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  resourceMode: e.target.value,
                  capacity: '',
                  totalQuantity: '',
                })
              }
              options={[
                { value: 'capacity', label: 'Venue (Seating Capacity)' },
                { value: 'quantity', label: 'Equipment (Quantity Units)' },
              ]}
            />

            <Input
              label="Category"
              placeholder="e.g. Auditorium, Audio, Lab"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          {formData.resourceMode === 'capacity' ? (
            <Input
              label="Seating Capacity (Attendees limit)"
              type="number"
              min="1"
              placeholder="e.g. 250"
              required
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              helperText="Enforces single-booking mutual exclusivity. Requests with attendees exceeding capacity are flagged."
            />
          ) : (
            <Input
              label="Total Physical Quantity Stock"
              type="number"
              min="1"
              placeholder="e.g. 15"
              required
              value={formData.totalQuantity}
              onChange={(e) => setFormData({ ...formData, totalQuantity: e.target.value })}
              helperText="Tracked across overlapping reservations using discrete sweep interval calculations."
            />
          )}

          <Input
            label="Campus Location"
            placeholder="e.g. Academic Complex, 3rd Floor"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase mb-1">
              Description / Equipment Specs
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Equipped with 4K ceiling projector, motorized stage screen, and podium."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 rounded border border-slate-300 text-xs focus:outline-none focus:border-campus-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-surface-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              Save Resource to Catalog
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacultyResourcesPage;
