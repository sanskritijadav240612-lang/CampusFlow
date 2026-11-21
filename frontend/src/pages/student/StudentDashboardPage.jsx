import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export const StudentDashboardPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Operations Overview"
        description="Monitor your active event requests, check review progress, and submit new campus reservations."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Submitted"
          value="—"
          helper="All submitted requests"
          icon={Calendar}
        />
        <StatCard
          label="Under Review"
          value="—"
          helper="Awaiting faculty decision"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          label="Approved"
          value="—"
          helper="Confirmed reservations"
          icon={CheckCircle2}
          variant="emerald"
        />
        <StatCard
          label="Rejected"
          value="—"
          helper="Requires rescheduling"
          icon={AlertCircle}
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Student Dashboard Foundation Ready
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Complete metrics, recent event lists, and AI coordinator will be implemented in upcoming batches.
        </p>
      </div>
    </div>
  );
};

export default StudentDashboardPage;
