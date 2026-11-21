import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

export const StudentRegisterPage = () => {
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white p-8 rounded-lg border border-surface-border shadow-soft">
        <PageHeader
          title="Student Registration"
          description="Register with your institutional enrollment number to begin organizing campus events."
        />
        <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 mb-6">
          Student registration form and client validation will be connected in Frontend Batch 2.
        </div>
        <div className="space-y-4">
          <Link to="/login" className="block">
            <Button variant="outline" className="w-full">
              Return to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentRegisterPage;
