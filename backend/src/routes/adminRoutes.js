const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Dashboard Stats
router.get('/stats', protect, authorize('admin'), adminController.getDashboardStats);

// Dashboard root (convenience)
router.get('/', protect, authorize('admin'), adminController.getDashboardStats);

// Alternative dashboard path
router.get('/dashboard', protect, authorize('admin'), adminController.getDashboardStats);

// Students - CRUD
router.get('/students', protect, authorize('admin'), adminController.getAllStudents);
router.get('/students/:id/report', protect, authorize('admin'), adminController.getStudentReport);
router.get('/students/:id', protect, authorize('admin'), adminController.getStudentDetail);
router.put('/students/:id', protect, authorize('admin'), adminController.updateStudent);
router.post('/students/:id/change-category', protect, authorize('admin'), adminController.changeStudentCategory);
router.post('/students/:id/suspend', protect, authorize('admin'), adminController.suspendStudent);
router.post('/students/:id/reactivate', protect, authorize('admin'), adminController.reactivateStudent);
router.delete('/students/:id', protect, authorize('admin'), adminController.deleteStudent);

// Submissions (DETAILED)
router.get('/submissions', protect, authorize('admin'), adminController.getRecentSubmissions);

// Simple/flat submissions
router.get('/submissions/basic', protect, authorize('admin'), adminController.getSubmissionsFlat);

// Categories CRUD
router.get('/categories', protect, authorize('admin'), adminController.getCategories);
router.get('/categories/:id', protect, authorize('admin'), adminController.getCategoryDetail);
router.post('/categories', protect, authorize('admin'), adminController.createCategory);
router.put('/categories/:id', protect, authorize('admin'), adminController.updateCategory);
router.delete('/categories/:id', protect, authorize('admin'), adminController.deleteCategory);

// Tasks CRUD
router.get('/tasks', protect, authorize('admin'), adminController.getAllTasks);
router.get('/tasks/:id', protect, authorize('admin'), adminController.getTaskDetail);
router.post('/tasks', protect, authorize('admin'), adminController.createTask);
router.put('/tasks/:id', protect, authorize('admin'), adminController.updateTask);
router.delete('/tasks/:id', protect, authorize('admin'), adminController.deleteTask);

// Submission grading
router.post('/submissions/:submissionId/grade', protect, authorize('admin'), adminController.gradeSubmission);

// Analytics / Reports
router.get('/analytics', protect, authorize('admin'), adminController.getAnalytics);
router.get('/analytics/submissions-over-time', protect, authorize('admin'), adminController.getSubmissionsOverTime);
router.get('/analytics/task-completion', protect, authorize('admin'), adminController.getTaskCompletionRates);
router.get('/analytics/category-performance', protect, authorize('admin'), adminController.getCategoryPerformance);
router.get('/analytics/student-progress', protect, authorize('admin'), adminController.getStudentProgress);

// Exports - CSV Downloads
router.get('/exports/users', protect, authorize('admin'), adminController.exportUsers);
router.get('/exports/submissions', protect, authorize('admin'), adminController.exportSubmissions);
router.get('/exports/tasks', protect, authorize('admin'), adminController.exportTasks);

// Settings
router.get('/settings', protect, authorize('admin'), adminController.getSettings);
router.post('/settings', protect, authorize('admin'), adminController.createSettings);
router.put('/settings/:id', protect, authorize('admin'), adminController.updateSettings);
router.delete('/settings/:id', protect, authorize('admin'), adminController.deleteSettings);
router.get('/settings/:id', protect, authorize('admin'), adminController.getSettings);

module.exports = router;
