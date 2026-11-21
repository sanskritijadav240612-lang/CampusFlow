import React from 'react';
import PageHeader from '../../components/ui/PageHeader';

export const FacultyResourcesPage = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Inventory Management"
        description="Inspect registered campus venues, audio-visual equipment inventories, and add new resources."
      />
      <div className="bg-white p-6 rounded-lg border border-surface-border text-center py-12">
        <p className="text-sm font-semibold text-slate-800">
          Campus Inventory Stub
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Resource inventory tables, capacity vs quantity indicators, and resource creation modals will be implemented in upcoming batches.
        </p>
      </div>
    </div>
  );
};

export default FacultyResourcesPage;
