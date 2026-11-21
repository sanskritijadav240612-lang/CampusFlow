import React from 'react';
import { Outlet } from 'react-router-dom';
import { LayoutDashboard, Inbox, Database, Bell, User } from 'lucide-react';
import HorizontalNav from '../components/common/HorizontalNav';
import { useAuth } from '../context/AuthContext';

const FACULTY_NAV_ITEMS = [
  { label: 'Overview', to: '/faculty', icon: LayoutDashboard },
  { label: 'Request Inbox', to: '/faculty/requests', icon: Inbox },
  { label: 'Resource Inventory', to: '/faculty/resources', icon: Database },
  { label: 'Notifications', to: '/faculty/notifications', icon: Bell },
  { label: 'Profile', to: '/faculty/profile', icon: User },
];

export const FacultyLayout = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <HorizontalNav
        roleTitle="Faculty Portal"
        navItems={FACULTY_NAV_ITEMS}
        userEmail={user?.email || 'faculty@campus.edu'}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default FacultyLayout;
