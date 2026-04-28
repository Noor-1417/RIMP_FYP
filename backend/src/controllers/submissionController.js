/**
 * Submission Controller — handles task submissions and AI evaluation.
 * Uses groqService.js for AI evaluation.
 *
 * Routes handled:
 *   POST /api/submissions/:taskId/submit  → submitTask
 *   GET  /api/submissions/student         → getStudentSubmissions
 */

const Submission = require('../models/Submission');
const InternshipTask = require('../models/InternshipTask');
const groqService = require('../services/groqService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ──────────────────────────────────────────────────────────────
// MULTER CONFIG for file upload (PDF/ZIP, max 25MB)
// ──────────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `submission-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ];
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|zip)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and ZIP files are allowed'), false);
  }
};

exports.uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
}).single('file');

// ──────────────────────────────────────────────────────────────
// POST /api/submissions/:taskId/submit
// Submit a task + trigger AI evaluation
// ──────────────────────────────────────────────────────────────
exports.submitTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { taskId } = req.params;
    const { githubLink, message } = req.body;

    // Verify task belongs to student
    const task = await InternshipTask.findOne({
      _id: taskId,
      $or: [{ studentId: userId }, { student: userId }],
    });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check task is not locked
    if (task.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'This task is locked. Complete previous tasks first.',
      });
    }

    // Must provide at least one thing
    if (!message && !githubLink && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least a file, GitHub link, or message.',
      });
    }

    // Build the submission text for AI evaluation
    const submissionText = [
      message ? `Message: ${message}` : '',
      githubLink ? `GitHub: ${githubLink}` : '',
      req.file ? `File: ${req.file.originalname}` : '',
    ].filter(Boolean).join('\n');

    // Create Submission document
    const submission = await Submission.create({
      taskId:       task._id,
      studentId:    userId,
      internshipId: task.internshipId || task.enrollment,
      fileUrl:      req.file ? `/uploads/${req.file.filename}` : undefined,
      filePath:     req.file ? req.file.path : undefined,
      fileName:     req.file ? req.file.originalname : undefined,
      githubLink:   githubLink || undefined,
      message:      message || undefined,
      status:       'pending',
      submittedAt:  new Date(),
    });

    // Also update the task's inline submission for backward compat
    task.submission = {
      fileUrl:     submission.fileUrl,
      fileName:    submission.fileName,
      githubLink:  submission.githubLink,
      message:     submission.message,
      submittedAt: submission.submittedAt,
    };
    task.status = 'submitted';
    await task.save();

    // ── Trigger Groq AI Evaluation ──
    let evaluation;
    try {
      evaluation = await groqService.evaluateSubmission(
        task.title,
        task.description,
        submissionText
      );

      // Save to Submission model
      submission.aiScore          = evaluation.score;
      submission.plagiarismPercent = evaluation.plagiarismPercent;
      submission.aiFeedback       = evaluation.feedback;
      submission.aiImprovements   = evaluation.improvements;
      submission.status           = evaluation.status === 'PASS' ? 'approved' : 'rejected';
      await submission.save();

      // Also update task inline evaluation for backward compat
      task.evaluation = {
        score:            evaluation.score,
        plagiarism_percent: evaluation.plagiarismPercent,
        status:           evaluation.status,
        feedback:         evaluation.feedback,
        improvements:     evaluation.improvements,
        evaluatedAt:      new Date(),
      };

      if (evaluation.status === 'PASS') {
        task.status = 'approved';

        // Auto-unlock next task
        const nextTask = await InternshipTask.findOne({
          $or: [
            { internshipId: task.internshipId, orderNumber: task.orderNumber + 1 },
            { enrollment: task.enrollment, taskOrder: task.taskOrder + 1 },
          ],
          status: 'locked',
        });
        if (nextTask) {
          nextTask.status = 'unlocked';
          await nextTask.save();
        }
      } else {
        task.status = 'rejected';
      }

      await task.save();
    } catch (aiErr) {
      console.error('AI evaluation error:', aiErr.message);
      evaluation = {
        score: 0,
        plagiarismPercent: 0,
        status: 'PENDING',
        feedback: 'AI evaluation temporarily unavailable. Submission recorded.',
        improvements: [],
      };
    }

    res.status(200).json({
      success: true,
      message: evaluation.status === 'PASS'
        ? '🎉 Task approved! Next task unlocked.'
        : evaluation.status === 'FAIL'
          ? '❌ Needs improvement. Check feedback and resubmit.'
          : '📝 Submitted. Evaluation pending.',
      data: {
        submission: {
          _id:              submission._id,
          taskId:           submission.taskId,
          fileUrl:          submission.fileUrl,
          githubLink:       submission.githubLink,
          message:          submission.message,
          aiScore:          submission.aiScore,
          plagiarismPercent: submission.plagiarismPercent,
          aiFeedback:       submission.aiFeedback,
          aiImprovements:   submission.aiImprovements,
          status:           submission.status,
          submittedAt:      submission.submittedAt,
        },
        taskStatus: task.status,
      },
      evaluation,
    });
  } catch (error) {
    console.error('submitTask error:', error);
    res.status(500).json({
      success: false,
      message: 'Submission failed',
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/submissions/student
// Get all submissions of the logged-in student
// ──────────────────────────────────────────────────────────────
exports.getStudentSubmissions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const submissions = await Submission.find({ studentId: userId })
      .populate('taskId', 'title weekNumber orderNumber status')
      .sort({ submittedAt: -1 });

    res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions,
    });
  } catch (error) {
    console.error('getStudentSubmissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message,
    });
  }
};
