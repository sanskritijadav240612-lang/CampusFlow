import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

export const FacultyLoginPage = () => {
  return (
    <div className="max-w-md mx-auto py-16 px-4">
      <div className="bg-white p-8 rounded-lg border border-surface-border shadow-soft">
        <PageHeader
          title="Faculty Administration"
          description="Sign in using your institutional email or Faculty ID."
        />
        <div className="p-4 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 mb-6">
          Faculty authentication will be connected in Frontend Batch 2. Notice: Faculty accounts are pre-created by administration; there is no public faculty signup.
        </div>
        <div className="space-y-4">
          <Link to="/faculty" className="block">
            <Button variant="secondary" className="w-full">
              Go to Faculty Portal (Dev Preview)
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FacultyLoginPage;
