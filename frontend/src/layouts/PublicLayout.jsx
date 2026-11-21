import React from 'react';
import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/common/PublicNavbar';
import PublicFooter from '../components/common/PublicFooter';

export const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
