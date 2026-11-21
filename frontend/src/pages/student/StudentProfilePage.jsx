import React from 'react';
import { User, Mail, Hash, Shield, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/ui/PageHeader';
import { formatDate } from '../../utils/date';

export const StudentProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title="Student Organizer Profile"
        description="Review your verified institutional enrollment credentials and active platform permissions."
      />

      <div className="bg-white rounded-lg border border-surface-border shadow-soft overflow-hidden">
        {/* Profile Header Band */}
        <div className="p-6 bg-slate-900 text-white flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-campus-700 text-white flex items-center justify-center font-bold text-xl border-2 border-campus-500 shadow-soft shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user?.name || 'Student Organizer'}</h2>
            <p className="text-xs text-campus-300 font-mono mt-0.5">
              Roll / Enrollment: {user?.enrollmentNumber || 'N/A'}
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
                College Email
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email || '—'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Enrollment Number
              </span>
              <p className="text-sm font-semibold text-slate-800 font-mono flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                {user?.enrollmentNumber || '—'}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                Platform Role
              </span>
              <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-4 h-4 text-campus-600" />
                Student Organizer (Verified)
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Institutional Security Notice
            </h4>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Student enrollment credentials and accounts are bound to official university records.
              To modify your name or enrollment identifier, please contact the campus registrar or administrative office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
