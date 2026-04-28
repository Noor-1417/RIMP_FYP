const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const internshipTaskController = require('../controllers/internshipTaskController');

// All routes require authentication
router.use(protect);

/**
 * GET /api/internship-tasks/my-enrollments
 * Get all active enrollments for the student with task progress
 */
router.get('/my-enrollments', internshipTaskController.getMyEnrollments);

/**
 * POST /api/internship-tasks/chat
 * Mentor chatbot endpoint
 * Body: { message, taskId?, conversationHistory? }
 */
router.post('/chat', internshipTaskController.mentorChat);

/**
 * GET /api/internship-tasks/:enrollmentId
 * Get all tasks for a given enrollment
 */
router.get('/:enrollmentId', internshipTaskController.getMyTasks);

/**
 * GET /api/internship-tasks/detail/:taskId
 * Get single task detail
 */
router.get('/detail/:taskId', internshipTaskController.getTaskDetail);

/**
 * POST /api/internship-tasks/:taskId/submit
 * Submit task with file upload, GitHub link, and/or message
 */
router.post(
  '/:taskId/submit',
  internshipTaskController.uploadMiddleware,
  internshipTaskController.submitTask
);

module.exports = router;
