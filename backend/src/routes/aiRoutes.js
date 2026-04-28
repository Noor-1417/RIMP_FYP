const express = require('express');
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All AI routes require authentication
router.use(protect);

/**
 * POST /api/ai/generate-project
 * Generate personalized AI project for user
 * Body: { skills[], field, educationLevel, enrollmentId? }
 */
router.post('/generate-project', aiController.generateProject);

/**
 * POST /api/ai/start-internship
 * Start internship with AI chatbot flow
 * Body: { enrollmentId }
 */
router.post('/start-internship', aiController.startInternship);

/**
 * POST /api/ai/submit-task
 * Submit task for AI evaluation
 * Body: { enrollmentId, taskId, submissionText }
 */
router.post('/submit-task', aiController.submitTask);

/**
 * POST /api/ai/evaluate-task
 * Evaluate task submission
 * Body: { enrollmentId, taskId, submissionText }
 */
router.post('/evaluate-task', aiController.evaluateTask);

/**
 * GET /api/ai/my-project
 * Get user's current project
 */
router.get('/my-project', aiController.getMyProject);

/**
 * GET /api/ai/progress/:enrollmentId
 * Get project progress and task statistics
 */
router.get('/progress/:enrollmentId', aiController.getProgress);

/**
 * POST /api/ai/regenerate-project
 * Regenerate project for same enrollment
 * Body: { enrollmentId, skills[]?, field? }
 */
router.post('/regenerate-project', aiController.regenerateProject);

/**
 * GET /api/ai/task/:enrollmentId/:taskId
 * Get specific task details with evaluation
 */
router.get('/task/:enrollmentId/:taskId', aiController.getTaskDetails);

module.exports = router;
