const InternshipTask = require('../models/InternshipTask');
const Enrollment = require('../models/Enrollment');
const InternshipCategory = require('../models/InternshipCategory');
const aiService = require('../services/aiService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createNotificationForAdmins, createNotificationForStudents } = require('./notificationController');

// ============================================================
// MULTER CONFIG — file upload for task submissions
// ============================================================
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `submission-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ];
  if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(pdf|zip)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and ZIP files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
});

exports.uploadMiddleware = upload.single('file');

// ============================================================
// GENERATE TASKS — Called after enrollment confirmation
// ============================================================

/**
 * Generate AI tasks for a new enrollment
 * This is called internally from categoryController after enrollment
 */
exports.generateTasksForEnrollment = async (enrollment, category) => {
  try {
    const durationWeeks = enrollment.selectedDuration || category.duration || 4;
    const studentLevel = category.difficulty || 'intermediate';

    // Generate tasks using Groq AI
    const taskDataArray = await aiService.generateInternshipTasks({
      categoryName: category.name,
      durationWeeks,
      studentLevel,
      topics: category.topics || [],
    });

    const startDate = enrollment.startDate || new Date();

    // Create task documents
    const taskDocs = taskDataArray.map((taskData, idx) => {
      const deadlineDate = new Date(startDate);
      deadlineDate.setDate(deadlineDate.getDate() + taskData.weekNumber * 7);

      return {
        enrollment: enrollment._id,
        student: enrollment.intern,
        category: category._id,
        title: taskData.title,
        description: taskData.description,
        requirements: taskData.requirements,
        weekNumber: taskData.weekNumber,
        deadlineDate,
        taskOrder: taskData.taskOrder,
        status: taskData.taskOrder === 1 ? 'unlocked' : 'locked', // Only first task unlocked
      };
    });

    const createdTasks = await InternshipTask.insertMany(taskDocs);
    console.log(`✅ Generated ${createdTasks.length} AI tasks for enrollment ${enrollment._id}`);
    return createdTasks;
  } catch (err) {
    console.error('❌ Error generating tasks for enrollment:', err.message);
    return [];
  }
};

// ============================================================
// GET MY TASKS — Get all tasks for an enrollment with lock status
// ============================================================

/**
 * GET /api/internship-tasks/:enrollmentId
 * Get all tasks for a given enrollment
 */
exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { enrollmentId } = req.params;

    // Verify enrollment belongs to user
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      intern: userId,
    }).populate('category', 'name');

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found or unauthorized',
      });
    }

    const tasks = await InternshipTask.find({
      $or: [
        { enrollment: enrollmentId, student: userId },
        { internshipId: enrollmentId, studentId: userId },
      ],
    }).sort({ taskOrder: 1, orderNumber: 1 });

    // Compute lock status dynamically (handles both taskOrder and orderNumber aliases)
    const tasksWithLockStatus = tasks.map((task, idx) => {
      const taskObj = task.toObject();
      // Normalize order field
      const order = taskObj.taskOrder || taskObj.orderNumber || (idx + 1);
      taskObj._order = order;

      // Task 1 is always unlocked
      if (order === 1 && taskObj.status === 'locked') {
        taskObj.status = 'unlocked';
      }

      // For subsequent tasks: unlock only if previous task is approved/completed
      if (order > 1 && taskObj.status === 'locked') {
        const prevTask = tasks.find(t => {
          const prevOrder = t.taskOrder || t.orderNumber;
          return prevOrder === order - 1;
        });
        if (prevTask && ['approved', 'completed'].includes(prevTask.status)) {
          taskObj.status = 'unlocked';
        }
      }

      taskObj.isLocked = taskObj.status === 'locked';
      return taskObj;
    });

    // Update any status changes in DB
    for (const task of tasksWithLockStatus) {
      const original = tasks.find(t => t._id.toString() === task._id.toString());
      if (original && original.status !== task.status) {
        await InternshipTask.findByIdAndUpdate(task._id, { status: task.status });
      }
    }

    res.status(200).json({
      success: true,
      enrollment: {
        _id: enrollment._id,
        categoryName: enrollment.category?.name,
        selectedDuration: enrollment.selectedDuration,
        startDate: enrollment.startDate,
        endDate: enrollment.endDate,
      },
      tasks: tasksWithLockStatus,
      total: tasksWithLockStatus.length,
      completed: tasksWithLockStatus.filter(t => t.status === 'approved').length,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message,
    });
  }
};

// ============================================================
// GET TASK DETAIL
// ============================================================

/**
 * GET /api/internship-tasks/detail/:taskId
 */
exports.getTaskDetail = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { taskId } = req.params;

    const task = await InternshipTask.findOne({
      _id: taskId,
      student: userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    if (task.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'This task is locked. Complete previous tasks first.',
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    console.error('Error fetching task detail:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task detail',
      error: error.message,
    });
  }
};

// ============================================================
// SUBMIT TASK — File upload + GitHub link + message
// ============================================================

/**
 * POST /api/internship-tasks/:taskId/submit
 */
exports.submitTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { taskId } = req.params;
    const { githubLink, message } = req.body;

    const task = await InternshipTask.findOne({
      _id: taskId,
      student: userId,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Check if task is locked
    if (task.status === 'locked') {
      return res.status(403).json({
        success: false,
        message: 'This task is locked. Complete previous tasks first.',
      });
    }

    // Check: must provide at least a message or file or github link
    if (!message && !githubLink && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least a message, file upload, or GitHub link.',
      });
    }

    // Save submission data
    task.submission = {
      fileUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
      fileName: req.file ? req.file.originalname : undefined,
      githubLink: githubLink || undefined,
      message: message || undefined,
      submittedAt: new Date(),
    };
    task.status = 'submitted';
    await task.save();

    // Notify admins of new submission
    try {
      const studentObj = await require('../models/User').findById(userId).select('firstName lastName');
      await createNotificationForAdmins(
        'New Submission',
        `${studentObj?.firstName || 'A student'} submitted task: ${task.title}`,
        'new-submission',
        { resourceType: 'submission', resourceId: task._id }
      );
    } catch (notifErr) {
      console.error('Notification error:', notifErr);
    }

    // ── Trigger Groq AI Evaluation ──
    let evaluation;
    try {
      evaluation = await aiService.evaluateTaskSubmission({
        taskTitle: task.title,
        taskDescription: task.description,
        taskRequirements: task.requirements,
        submissionMessage: message || '',
        githubLink: githubLink || '',
      });

      task.evaluation = {
        score: evaluation.score,
        plagiarism_percent: evaluation.plagiarism_percent,
        status: evaluation.status,
        feedback: evaluation.feedback,
        improvements: evaluation.improvements,
        evaluatedAt: new Date(),
      };

      // Update status based on evaluation
      if (evaluation.status === 'PASS') {
        task.status = 'approved';

        // Auto-unlock next task
        const nextTask = await InternshipTask.findOne({
          enrollment: task.enrollment,
          taskOrder: task.taskOrder + 1,
          status: 'locked',
        });

        if (nextTask) {
          nextTask.status = 'unlocked';
          await nextTask.save();

          try {
            await createNotificationForStudents(
              'New Task Unlocked',
              `"${nextTask.title}" is now unlocked. Deadline: ${new Date(nextTask.deadlineDate).toLocaleDateString()}`,
              'task-assigned',
              { resourceType: 'task', resourceId: nextTask._id },
              [userId]
            );
          } catch (notifErr) {
            console.error('Notification error:', notifErr);
          }
        }
      } else {
        task.status = 'rejected';
      }

      await task.save();
    } catch (aiErr) {
      console.error('AI evaluation error:', aiErr.message);
      evaluation = {
        score: 0,
        plagiarism_percent: 0,
        status: 'PENDING',
        feedback: 'AI evaluation is temporarily unavailable. Your submission has been recorded.',
        improvements: [],
      };
    }

    res.status(200).json({
      success: true,
      message: evaluation.status === 'PASS'
        ? '🎉 Task approved! Next task unlocked.'
        : evaluation.status === 'FAIL'
          ? '❌ Task needs improvement. Please review feedback and resubmit.'
          : '📝 Task submitted. Evaluation pending.',
      task: {
        _id: task._id,
        title: task.title,
        status: task.status,
        submission: task.submission,
        evaluation: task.evaluation,
      },
      evaluation,
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting task',
      error: error.message,
    });
  }
};

// ============================================================
// MENTOR CHATBOT
// ============================================================

/**
 * POST /api/internship-tasks/chat
 */
exports.mentorChat = async (req, res) => {
  try {
    const { message, taskId, conversationHistory } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Get task context if taskId provided
    let taskTitle = '';
    let taskDescription = '';
    if (taskId) {
      const task = await InternshipTask.findById(taskId);
      if (task) {
        taskTitle = task.title;
        taskDescription = task.description;
      }
    }

    const reply = await aiService.mentorChat({
      studentMessage: message,
      taskTitle,
      taskDescription,
      conversationHistory,
    });

    res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot error',
      error: error.message,
    });
  }
};

// ============================================================
// WEEKLY PROGRESS ANALYTICS
// ============================================================

/**
 * GET /api/student/weekly-progress
 */
exports.getWeeklyProgress = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    // Get all tasks for the student
    const allTasks = await InternshipTask.find({ student: userId }).sort({ taskOrder: 1 });

    if (!allTasks || allTasks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          approvedTasks: 0,
          rejectedTasks: 0,
          averageScore: 0,
          weeklyProgress: [],
        },
      });
    }

    const totalTasks = allTasks.length;
    const approvedTasks = allTasks.filter(t => t.status === 'approved').length;
    const rejectedTasks = allTasks.filter(t => t.status === 'rejected').length;
    const completedTasks = approvedTasks; // approved = completed
    const submittedTasks = allTasks.filter(t => t.status === 'submitted').length;
    const pendingTasks = allTasks.filter(t => ['locked', 'unlocked', 'in-progress'].includes(t.status)).length;

    // Calculate average score from evaluated tasks
    const evaluatedTasks = allTasks.filter(t => t.evaluation && t.evaluation.score != null);
    const averageScore = evaluatedTasks.length > 0
      ? Math.round(evaluatedTasks.reduce((sum, t) => sum + t.evaluation.score, 0) / evaluatedTasks.length)
      : 0;

    // Build weekly progress data
    const weekMap = {};
    for (const task of allTasks) {
      const week = task.weekNumber || 1;
      if (!weekMap[week]) {
        weekMap[week] = {
          week: `Week ${week}`,
          weekNumber: week,
          total: 0,
          completed: 0,
          pending: 0,
          averageScore: 0,
          scores: [],
        };
      }
      weekMap[week].total += 1;

      if (task.status === 'approved') {
        weekMap[week].completed += 1;
      } else if (['locked', 'unlocked', 'in-progress'].includes(task.status)) {
        weekMap[week].pending += 1;
      }

      if (task.evaluation?.score != null) {
        weekMap[week].scores.push(task.evaluation.score);
      }
    }

    const weeklyProgress = Object.values(weekMap)
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map(w => ({
        week: w.week,
        weekNumber: w.weekNumber,
        total: w.total,
        completed: w.completed,
        pending: w.pending,
        averageScore: w.scores.length > 0
          ? Math.round(w.scores.reduce((s, v) => s + v, 0) / w.scores.length)
          : 0,
      }));

    res.status(200).json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        pendingTasks,
        submittedTasks,
        approvedTasks,
        rejectedTasks,
        averageScore,
        weeklyProgress,
      },
    });
  } catch (error) {
    console.error('Error fetching weekly progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly progress',
      error: error.message,
    });
  }
};

// ============================================================
// GET MY ENROLLMENTS — List enrollments for task navigation
// ============================================================

/**
 * GET /api/internship-tasks/my-enrollments
 */
exports.getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const enrollments = await Enrollment.find({
      intern: userId,
      status: 'active',
      paymentStatus: { $in: ['paid', 'free'] },
    })
      .populate('category', 'name description icon color difficulty')
      .sort({ enrolledAt: -1 });

    // For each enrollment, get task progress
    const enriched = await Promise.all(
      enrollments.map(async (enrollment) => {
        const tasks = await InternshipTask.find({ enrollment: enrollment._id });
        const total = tasks.length;
        const approved = tasks.filter(t => t.status === 'approved').length;

        return {
          _id: enrollment._id,
          category: enrollment.category,
          selectedDuration: enrollment.selectedDuration,
          startDate: enrollment.startDate,
          endDate: enrollment.endDate,
          enrolledAt: enrollment.enrolledAt,
          taskProgress: {
            total,
            approved,
            percentage: total > 0 ? Math.round((approved / total) * 100) : 0,
          },
        };
      })
    );

    res.status(200).json({
      success: true,
      enrollments: enriched,
    });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching enrollments',
      error: error.message,
    });
  }
};
