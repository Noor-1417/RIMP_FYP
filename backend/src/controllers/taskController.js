const Task = require('../models/Task');
const InternshipCategory = require('../models/InternshipCategory');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getAllTasks = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, status, priority } = req.query;

    let query = {};
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('category', 'name')
      .populate('assignedTo', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ dueDate: 1 });

    const total = await Task.countDocuments(query);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: page,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('category', 'name')
      .populate('assignedTo', 'firstName lastName email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin/Manager
exports.createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      dueDate,
      week,
      points,
      attachments,
      isAutoAssigned,
      autoAssignmentRule,
      relatedContent,
    } = req.body;

    // Check if category exists
    const categoryExists = await InternshipCategory.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const task = await Task.create({
      title,
      description,
      category,
      priority,
      dueDate,
      week,
      points,
      attachments,
      isAutoAssigned,
      autoAssignmentRule,
      relatedContent,
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private/Admin/Manager
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin/Manager
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndRemove(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Assign task to interns
// @route   POST /api/tasks/:id/assign
// @access  Private/Admin/Manager
exports.assignTask = async (req, res, next) => {
  try {
    const { internIds } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Add interns to assignedTo array
    task.assignedTo = [...new Set([...task.assignedTo, ...internIds])];
    await task.save();

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit task
// @route   POST /api/tasks/:id/submit
// @access  Private
exports.submitTask = async (req, res, next) => {
  try {
    const { contentUrl, files = [] } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Determine submission source
    const submission = {
      user: req.user.id,
      submittedAt: new Date(),
      contentUrl: contentUrl || (files.length > 0 ? files[0] : undefined),
      files: files,
      status: 'submitted',
    };

    task.submissions.push(submission);
    await task.save();

    // Trigger AI grading synchronously (best-effort) using the content URL
    try {
      const aiService = require('../services/aiService');
      const Certificate = require('../models/Certificate');
      const QRCode = require('qrcode');
      const User = require('../models/User');
      const categoryId = task.category;

      const latestSubmission = task.submissions[task.submissions.length - 1];
      const submissionSource = latestSubmission.contentUrl || (latestSubmission.files && latestSubmission.files[0]);

      const gradeResult = await aiService.gradeSubmission({ submissionUrl: submissionSource });

      latestSubmission.aiResult = gradeResult;
      latestSubmission.status = gradeResult.passed ? 'graded-passed' : 'graded-failed';
      latestSubmission.reviewedAt = new Date();

      await task.save();

      // If passed, auto-generate certificate
      if (gradeResult.passed) {
        try {
          const cert = await Certificate.create({
            intern: req.user.id,
            category: categoryId,
            grade: gradeResult.passed ? 'Pass' : 'Fail',
            score: gradeResult.score || 0,
            completionPercentage: 100,
            tasksCompleted: 1,
            totalTasks: task.totalSteps || 1,
            manager: req.user.id,
          });

          const internUser = await User.findById(req.user.id);
          const category = require('../models/InternshipCategory');
          const cat = await category.findById(categoryId);

          const qrCodeData = {
            certificateNumber: cert.certificateNumber,
            internName: `${internUser.firstName} ${internUser.lastName}`,
            category: cat ? cat.name : String(categoryId),
            issueDate: cert.issueDate,
            verificationUrl: `${process.env.FRONTEND_URL}/verify/${cert.certificateNumber}`,
          };

          cert.qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
          await cert.save();

          // Send certificate email (best-effort)
          try {
            const emailService = require('../services/emailService');
            const verificationUrl = `${process.env.FRONTEND_URL}/verify/${cert.certificateNumber}`;
            await emailService.sendCertificateIssuedEmail(internUser.email, cert, `${internUser.firstName} ${internUser.lastName}`, verificationUrl);
          } catch (emailErr) {
            console.error('Failed to send certificate email:', emailErr);
          }
        } catch (certErr) {
          console.error('Certificate generation error:', certErr);
        }
      }
    } catch (aiErr) {
      console.error('AI grading error:', aiErr);
    }

    res.status(200).json({
      success: true,
      message: 'Task submitted and queued for grading',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Review task submission
// @route   POST /api/tasks/:id/review
// @access  Private/Admin/Manager
exports.reviewSubmission = async (req, res, next) => {
  try {
    const { submissionId, status, feedback, pointsEarned } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    const submission = task.submissions.id(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    submission.status = status;
    submission.feedback = feedback;
    submission.pointsEarned = pointsEarned;
    submission.reviewedBy = req.user.id;
    submission.reviewedAt = new Date();

    await task.save();

    res.status(200).json({
      success: true,
      message: 'Submission reviewed successfully',
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
