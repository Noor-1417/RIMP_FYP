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



function App() {
  const { user, isAuthenticated, isInitialized } = useAuth();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F2F6]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
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
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/verify/:certificateNumber" element={<VerifyPage />} />

        {/* Protected Routes */}

        <Route path="/admin/categories" element={<AdminCategoriesPage />} />
        <Route path="/admin/tasks" element={<AdminTasksPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
        <Route path="/admin/settings" element={<AdminSettingsPage />} />
        <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
        <Route path="/admin/applications" element={<AdminApplicationsPage />} />
        <Route path="/admin/quizzes" element={<AdminQuizzesPage />} />
        <Route path="/quiz/:id" element={<QuizTakePage />} />
        <Route path="/dashboard" element={<InternDashboard />} />
        <Route path="/intern-dashboard" element={<InternDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<AdminStudentsPage />} />
        <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/cv-builder" element={<CVBuilderPage />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/payment/:categoryId" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccessPage />} />
        <Route path="/payment-cancel" element={<PaymentCancelPage />} />
        <Route path="/my-tasks/:enrollmentId" element={<InternshipTasksPage />} />
        <Route path="/student-progress" element={<StudentProgressDashboard />} />

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

