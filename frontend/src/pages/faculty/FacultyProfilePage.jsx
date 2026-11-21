import React from 'react';
import { User, Mail, Hash, Shield, Building, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';

export const FacultyProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Faculty Administration Profile"
        description="View your institutional faculty account details, review authorization scope, and active administrative credentials."
      />

      <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
        {/* Profile Header Band */}
        <div className="p-6 bg-slate-900 text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-campus-700 text-white flex items-center justify-center font-bold text-xl border-2 border-campus-500 shadow-soft shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name || 'Faculty Member'}</h2>
            <p className="text-xs text-campus-300 font-mono mt-0.5">
              Faculty / Staff ID: {user?.facultyId || 'FAC-CAMPUS'}
            </p>
          </div>
        </div>

        {/* Account Details Form/List */}
        <div className="p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Full Name
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                {user?.name || '—'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Official Campus Email
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email || '—'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Faculty Identifier
              </span>
              <p className="text-sm font-semibold text-slate-800 font-mono flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                {user?.facultyId || 'FAC-CAMPUS'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Administrative Role
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-campus-600" />
                Faculty Reviewer & Approver
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Approval Scope
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                Institution-Wide Resource Authority
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Audit Status
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                Active Reviewer Credentials
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Institutional Security & Governance Policy
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Faculty administrative privileges grant authoritative control over campus resource allocations,
              conflict resolution, and student event approvals. All decisions and remarks are logged to immutable
              audit trails in compliance with university campus management policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyProfilePage;
