import React from 'react';
import PageHeader from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Layers, Clock, Building, Package } from 'lucide-react';

export const FacultyDashboardPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Administration Overview"
        description="Monitor campus resource allocation, review pending student requests, and resolve scheduling conflicts."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Resources"
          value="—"
          helper="Venues & equipment"
          icon={Layers}
        />
        <StatCard
          label="Pending Review"
          value="—"
          helper="Requires faculty action"
          icon={Clock}
          variant="amber"
        />
        <StatCard
          label="Occupied Venues"
          value="—"
          helper="Currently reserved"
          icon={Building}
          variant="blue"
        />
        <StatCard
          label="Allocated Equipment"
          value="—"
          helper="Active equipment units"
          icon={Package}
        />
      </div>

      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Faculty Dashboard Foundation Ready
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Real-time metrics, urgent review queues, and conflict detection cards will be connected in upcoming batches.
        </p>
      </div>
    </div>
  );
};

export default FacultyDashboardPage;
