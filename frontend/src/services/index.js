import api from './api';
import { storageService } from './storage';

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  generateInternship: (data) => api.post('/auth/generate-internship', data),
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
  enroll: (id, data) => api.post(`/categories/${id}/enroll`, data),
  verifyPayment: (data) => api.post('/categories/verify-payment', data),
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

export const certificateService = {
  getAll:                (params)       => api.get('/certificates', { params }),
  getById:               (id)           => api.get(`/certificates/${id}`),
  getMine:               ()             => api.get('/certificates/mine'),
  verify:                (certNumber)   => api.get(`/certificates/verify/${certNumber}`),
  download:              (id)           => api.get(`/certificates/${id}/download`),
  create:                (data)         => api.post('/certificates', data),
  delete:                (id)           => api.delete(`/certificates/${id}`),
  generateForEnrollment: (enrollmentId) => api.post(`/certificates/generate/${enrollmentId}`),
};


// Payment Services
export const paymentService = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  createIntent: (data) => api.post('/payments/create-intent', data),
  createCheckoutSession: (data) => api.post('/payments/create-checkout-session', data),
  verifySession: (data) => api.post('/payments/verify-session', data),
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

// Project Services
export const projectService = {
  generateInternship: (data) => api.post('/projects/generate-internship', data),
  getProject: (enrollmentId) => api.get(`/projects/${enrollmentId}`),
  submitTask: (enrollmentId, data) => api.post(`/projects/${enrollmentId}/submit-task`, data),
  getProgress: (enrollmentId) => api.get(`/projects/${enrollmentId}/progress`),
};

// ── AI Internship Task Services ──
export const internshipTaskService = {
  // Get all active enrollments with task progress
  getMyEnrollments: () => api.get('/internship-tasks/my-enrollments'),

  // Get all tasks for an enrollment
  getTasksByEnrollment: (enrollmentId) => api.get(`/internship-tasks/${enrollmentId}`),

  // Get single task detail
  getTaskDetail: (taskId) => api.get(`/internship-tasks/detail/${taskId}`),

  // Submit task (supports FormData for file upload)
  submitTask: (taskId, formData) =>
    api.post(`/internship-tasks/${taskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Mentor chatbot
  chat: (data) => api.post('/internship-tasks/chat', data),

  // Weekly progress analytics
  getWeeklyProgress: () => api.get('/student/weekly-progress'),
};

// ── Groq Task Generation Service (on-demand) ──
export const groqTaskService = {
  // Generate AI tasks for an active enrollment (POST /api/groq-tasks/generate)
  generateTasks: (enrollmentId) => api.post('/groq-tasks/generate', { enrollmentId }),
  // All tasks for the logged-in student across all enrollments
  getStudentTasks: () => api.get('/groq-tasks/student'),
  // Single task by ID
  getTaskById: (taskId) => api.get(`/groq-tasks/${taskId}`),
};

// ── Submission Service ──
export const submissionService = {
  // Submit a task (FormData — supports file upload)
  submitTask: (taskId, formData) =>
    api.post(`/submissions/${taskId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  // Get all submissions for the logged-in student
  getStudentSubmissions: () => api.get('/submissions/student'),
};

// ── Chat/Mentor Service ──
export const chatService = {
  // Send a message to the AI mentor (POST /api/chat/mentor)
  sendMessage: (data) => api.post('/chat/mentor', data),
};

const services = {
  authService,
  adminService,
  categoryService,
  taskService,
  quizService,
  certificateService,
  paymentService,
  notificationService,
  projectService,
  storageService,
  internshipTaskService,
  groqTaskService,
  submissionService,
  chatService,
};

export default services;
