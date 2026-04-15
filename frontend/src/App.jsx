import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import './styles/globals.css';

// Auth Pages
import { LoginPage, RegisterPage } from './pages/auth/AuthPages';

// Dashboard Pages
import { InternDashboard } from './pages/dashboard/InternDashboard';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import AdminStudentsPage from './pages/admin/AdminStudentsPage';
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminTasksPage from './pages/admin/AdminTasksPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';

// Main Pages
import { CategoriesPage } from './pages/CategoriesPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { PaymentPage } from './pages/PaymentPage';
import {PaymentSuccessPage} from './pages/PaymentSuccessPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import TasksPage from './pages/TasksPage';
import TaskDetail from './pages/TaskDetail';
import CVBuilderPage from './pages/CVBuilderPage';
import StudentDashboard from './pages/StudentDashboard';

// Protected Route Component
const ProtectedRoute = ({ user, allowedRoles, children }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

    if (allowedRoles) {
    const userRole = (user.role || '').toString().toLowerCase();
    const allowed = allowedRoles.map((r) => r.toString().toLowerCase());
    if (!allowed.includes(userRole)) {
      // If the user is authenticated but not allowed, send them to the home page
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

function App() {
  const { user, isInitialized, isAuthenticated } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Routes */}

        <Route
          path="/admin/categories"
          element={
            <ProtectedRoute user={user} allowedRoles={[ 'admin' ]}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute user={user} allowedRoles={[ 'admin' ]}>
              <AdminTasksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute user={user} allowedRoles={[ 'admin' ]}>
              <AdminAnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute user={user} allowedRoles={[ 'admin' ]}>
              <AdminSettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/announcements"
          element={
            <ProtectedRoute user={user} allowedRoles={[ 'admin' ]}>
              <AdminAnnouncementsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/applications"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern', 'manager']}>
              <InternDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/intern-dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern', 'manager']}>
              <InternDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/students"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminStudentsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/submissions"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminSubmissionsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/categories"
          element={
            <ProtectedRoute user={user}>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks"
          element={
            <ProtectedRoute user={user}>
              <TasksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tasks/:id"
          element={
            <ProtectedRoute user={user}>
              <TaskDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/certificates"
          element={
            <ProtectedRoute user={user}>
              <CertificatesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Student CV Builder (students only) */}
        <Route
          path="/cv-builder"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern']}>
              <CVBuilderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-dashboard"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment/:categoryId"
          element={
            <ProtectedRoute user={user}>
              <PaymentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-success"
          element={
            <ProtectedRoute user={user}>
              <PaymentSuccessPage />
            </ProtectedRoute>
          }
        />

        {/* Redirect to dashboard if authenticated, else to login */}
        <Route
          path="/"
          element={isAuthenticated ? (<Navigate to={user?.role === 'admin' ? '/admin-dashboard' : '/intern-dashboard'} replace />) : (<LandingPage />)}
        />

        

        {/* 404 Page */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-light">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-primary mb-4">404</h1>
                <p className="text-gray-600 mb-6">Page not found</p>
                <a href="/" className="text-secondary hover:underline">
                  Go back home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
