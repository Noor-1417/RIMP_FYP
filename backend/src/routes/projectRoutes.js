const express = require('express');
const projectController = require('../controllers/projectController');
const { protect } = require('../middleware/auth');



const router = express.Router();

// All project routes require authentication


/**
 * POST /api/projects/generate-internship
 * Generate personalized internship project based on user's CV
 */
router.post('/generate-internship', projectController.generateInternshipProject);

/**
 * GET /api/projects/:enrollmentId
 * Get user's internship project details
 */
router.get('/:enrollmentId', projectController.getProject);

/**
 * POST /api/projects/:enrollmentId/submit-task
 * Submit a task for evaluation
 */
router.post('/:enrollmentId/submit-task', projectController.submitTask);

/**
 * PUT /api/projects/:enrollmentId/tasks/:taskId/status
 * Update task status
 */
router.put('/:enrollmentId/tasks/:taskId/status', projectController.updateTaskStatus);

/**
 * GET /api/projects/:enrollmentId/progress
 * Get detailed project progress and task statistics
 */
router.get('/:enrollmentId/progress', projectController.getProjectProgress);

/**
 * POST /api/projects/:enrollmentId/regenerate
 * Regenerate project for the same enrollment
 */
router.post('/:enrollmentId/regenerate', projectController.regenerateProject);

module.exports = router;
