import api from './api';
import { storageService } from './storage';

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  logout: () => api.get('/auth/logout'),
};

// Admin Services
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getSubmissions: (params) => api.get('/admin/submissions', { params }),
};

// Category Services
export const categoryService = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  enroll: (id) => api.post(`/categories/${id}/enroll`),
};

// Task Services
export const taskService = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  assign: (id, data) => api.post(`/tasks/${id}/assign`, data),
  submit: (id, data) => api.post(`/tasks/${id}/submit`, data),
  review: (id, data) => api.post(`/tasks/${id}/review`, data),
};

// Quiz Services
export const quizService = {
  getAll: (params) => api.get('/quizzes', { params }),
  getById: (id) => api.get(`/quizzes/${id}`),
  create: (data) => api.post('/quizzes', data),
  update: (id, data) => api.put(`/quizzes/${id}`, data),
  delete: (id) => api.delete(`/quizzes/${id}`),
  submit: (id, data) => api.post(`/quizzes/${id}/submit`, data),
  getResults: (id) => api.get(`/quizzes/${id}/results`),
};

// Certificate Services
export const certificateService = {
  getAll: (params) => api.get('/certificates', { params }),
  getById: (id) => api.get(`/certificates/${id}`),
  verify: (certificateNumber) => api.get(`/certificates/verify/${certificateNumber}`),
  download: (id) => api.get(`/certificates/${id}/download`),
  create: (data) => api.post('/certificates', data),
  delete: (id) => api.delete(`/certificates/${id}`),
};

// Payment Services
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  createIntent: (data) => api.post('/payments/create-intent', data),
  confirmPayment: (data) => api.post('/payments/confirm', data),
  refund: (id, data) => api.post(`/payments/${id}/refund`, data),
};

// Notification Services
export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default {
  authService,
  adminService,
  categoryService,
  taskService,
  quizService,
  certificateService,
  paymentService,
  notificationService,
  storageService,
};
