import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import FacultyLayout from '../layouts/FacultyLayout';

// Route Guards
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicOnlyRoute from '../components/common/PublicOnlyRoute';

// Public Pages
import LandingPage from '../pages/public/LandingPage';
import StudentLoginPage from '../pages/public/StudentLoginPage';
import StudentRegisterPage from '../pages/public/StudentRegisterPage';
import FacultyLoginPage from '../pages/public/FacultyLoginPage';

// Student Pages
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import CreateRequestPage from '../pages/student/CreateRequestPage';
import MyRequestsPage from '../pages/student/MyRequestsPage';
import RequestDetailPage from '../pages/student/RequestDetailPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';

// Faculty Pages
import FacultyDashboardPage from '../pages/faculty/FacultyDashboardPage';
import FacultyRequestsPage from '../pages/faculty/FacultyRequestsPage';
import FacultyRequestDetailPage from '../pages/faculty/FacultyRequestDetailPage';
import FacultyResourcesPage from '../pages/faculty/FacultyResourcesPage';
import FacultyNotificationsPage from '../pages/faculty/FacultyNotificationsPage';
import FacultyProfilePage from '../pages/faculty/FacultyProfilePage';

// 404 Page
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. PUBLIC WEBSITE & AUTH ROUTES */}
      <Route element={<PublicLayout />}>
        {/* Landing Page: Accessible to everyone */}
        <Route path="/" element={<LandingPage />} />

        {/* Public-only authentication routes (redirect authenticated users) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<StudentLoginPage />} />
          <Route path="/register" element={<StudentRegisterPage />} />
          <Route path="/faculty/login" element={<FacultyLoginPage />} />
        </Route>
      </Route>

      {/* 2. PROTECTED STUDENT PORTAL */}
      <Route element={<ProtectedRoute allowedRole="student" />}>
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<StudentDashboardPage />} />
          <Route path="create-request" element={<CreateRequestPage />} />
          <Route path="requests" element={<MyRequestsPage />} />
          <Route path="requests/:requestId" element={<RequestDetailPage />} />
          <Route path="profile" element={<StudentProfilePage />} />
        </Route>
      </Route>

      {/* 3. PROTECTED FACULTY / ADMIN PORTAL */}
      <Route element={<ProtectedRoute allowedRole="faculty" />}>
        <Route path="/faculty" element={<FacultyLayout />}>
          <Route index element={<FacultyDashboardPage />} />
          <Route path="requests" element={<FacultyRequestsPage />} />
          <Route path="requests/:requestId" element={<FacultyRequestDetailPage />} />
          <Route path="resources" element={<FacultyResourcesPage />} />
          <Route path="notifications" element={<FacultyNotificationsPage />} />
          <Route path="profile" element={<FacultyProfilePage />} />
        </Route>
      </Route>

      {/* 4. FALLBACK 404 NOT FOUND */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
