/**
 * Submission Routes
 * Wires the submission controller to the /api/submissions/* paths.
 *
 * POST /api/submissions/:taskId/submit  → submit a task (file/GitHub/message)
 * GET  /api/submissions/student         → get all submissions for the logged-in student
 *
 * All routes are protected by JWT middleware.
 * The submit route uses multer middleware (uploadMiddleware) for optional file upload.
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  submitTask,
  getStudentSubmissions,
  uploadMiddleware,
} = require('../controllers/submissionController');

// All routes require authentication
router.use(protect);

/**
 * GET /api/submissions/student
 * Returns all Submission documents for the logged-in student,
 * sorted by most recent first.
 * NOTE: Must be registered BEFORE /:taskId/submit to avoid route collision.
 */
router.get('/student', getStudentSubmissions);

/**
 * POST /api/submissions/:taskId/submit
 * Body (multipart/form-data):
 *   file        (optional) — PDF or ZIP, max 25 MB
 *   githubLink  (optional) — GitHub repository URL
 *   message     (optional) — Text description / notes
 * At least ONE of file / githubLink / message must be provided.
 * Triggers Groq AI evaluation automatically after submission.
 */
router.post('/:taskId/submit', uploadMiddleware, submitTask);

module.exports = router;
