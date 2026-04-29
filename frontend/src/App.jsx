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
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminApplicationsPage from './pages/admin/AdminApplicationsPage';

// Main Pages
import { CategoriesPage } from './pages/CategoriesPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { PaymentPage } from './pages/PaymentPage';
import {PaymentSuccessPage} from './pages/PaymentSuccessPage';
import {PaymentCancelPage} from './pages/PaymentCancelPage';
import LandingPage from './pages/LandingPage';
import ProfilePage from './pages/ProfilePage';
import TasksPage from './pages/TasksPage';
import CVBuilderPage from './pages/CVBuilderPage';
import StudentDashboard from './pages/StudentDashboard';
import InternshipTasksPage from './pages/InternshipTasksPage';
import StudentProgressDashboard from './pages/StudentProgressDashboard';
import { VerifyPage } from './pages/VerifyPage';
import { AdminQuizzesPage } from './pages/admin/AdminQuizzesPage';
import { QuizTakePage } from './pages/QuizTakePage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

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
  const { user, isAuthenticated } = useAuth();

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify/:certificateNumber" element={<VerifyPage />} />

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
          path="/admin/notifications"
          element={
            <ProtectedRoute user={user} allowedRoles={[ 'admin' ]}>
              <AdminNotificationsPage />
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
          path="/admin/quizzes"
          element={
            <ProtectedRoute user={user} allowedRoles={['admin']}>
              <AdminQuizzesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz/:id"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern']}>
              <QuizTakePage />
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

        <Route
          path="/payment-cancel"
          element={
            <ProtectedRoute user={user}>
              <PaymentCancelPage />
            </ProtectedRoute>
          }
        />


        <Route
          path="/my-tasks/:enrollmentId"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern']}>
              <InternshipTasksPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student-progress"
          element={
            <ProtectedRoute user={user} allowedRoles={['intern']}>
              <StudentProgressDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <LandingPage />
            ) : user?.role === 'admin' ? (
              <AdminDashboard />
            ) : (
              <InternDashboard />
            )
          }
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

