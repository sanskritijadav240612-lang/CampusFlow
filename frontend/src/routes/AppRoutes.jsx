import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../layouts/PublicLayout';
import StudentLayout from '../layouts/StudentLayout';
import FacultyLayout from '../layouts/FacultyLayout';

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
import FacultyProfilePage from '../pages/faculty/FacultyProfilePage';

// 404
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<StudentLoginPage />} />
        <Route path="/register" element={<StudentRegisterPage />} />
        <Route path="/faculty/login" element={<FacultyLoginPage />} />
      </Route>

      {/* 2. Student Portal Routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboardPage />} />
        <Route path="create-request" element={<CreateRequestPage />} />
        <Route path="requests" element={<MyRequestsPage />} />
        <Route path="requests/:requestId" element={<RequestDetailPage />} />
        <Route path="profile" element={<StudentProfilePage />} />
      </Route>

      {/* 3. Faculty Portal Routes */}
      <Route path="/faculty" element={<FacultyLayout />}>
        <Route index element={<FacultyDashboardPage />} />
        <Route path="requests" element={<FacultyRequestsPage />} />
        <Route path="requests/:requestId" element={<FacultyRequestDetailPage />} />
        <Route path="resources" element={<FacultyResourcesPage />} />
        <Route path="profile" element={<FacultyProfilePage />} />
      </Route>

      {/* 4. Fallback 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
