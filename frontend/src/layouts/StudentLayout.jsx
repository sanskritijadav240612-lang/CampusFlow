import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, CalendarCheck, User } from 'lucide-react';
import HorizontalNav from '../components/common/HorizontalNav';
import { useAuth } from '../context/AuthContext';

const STUDENT_NAV_ITEMS = [
  { label: 'Overview', to: '/student', icon: LayoutDashboard },
  { label: 'Create Request', to: '/student/create-request', icon: PlusCircle },
  { label: 'My Requests', to: '/student/requests', icon: CalendarCheck },
  { label: 'Profile', to: '/student/profile', icon: User },
];

export const StudentLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <HorizontalNav
        roleTitle="Student Portal"
        navItems={STUDENT_NAV_ITEMS}
        userEmail={user?.email || 'student@campus.edu'}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default StudentLayout;
