/**
 * Groq Task Routes
 * Mounts the AI-powered task generation and retrieval endpoints.
 *
 * POST /api/tasks/generate       → generate tasks for an enrollment
 * GET  /api/tasks/student        → get all tasks for the logged-in student
 * GET  /api/tasks/:taskId        → get a single task (student-owned only)
 *
 * All routes are protected by JWT middleware.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  generateTasks,
  getStudentTasks,
  getTaskById,
} = require('../controllers/groqTaskController');

// All routes require authentication
router.use(protect);

/**
 * POST /api/tasks/generate
 * Body: { enrollmentId }
 * Generates AI tasks for an active enrollment.
 * Returns 400 if tasks already exist for that enrollment.
 */
router.post('/generate', generateTasks);

/**
 * GET /api/tasks/student
 * Returns all InternshipTask documents owned by the logged-in student.
 * Dynamically computes lock/unlock status and persists any changes.
 */
router.get('/student', getStudentTasks);

/**
 * GET /api/tasks/:taskId
 * Returns a single task — only if it belongs to the logged-in student.
 */
router.get('/:taskId', getTaskById);

module.exports = router;
