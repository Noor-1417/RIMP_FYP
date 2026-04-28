const Project = require('../models/Project');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const aiService = require('../services/aiService');
const InternshipCategory = require('../models/InternshipCategory');

/**
 * Generate personalized internship project based on user's CV
 * POST /api/projects/generate-internship
 */
exports.generateInternshipProject = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { enrollmentId } = req.body;

    if (!userId || !enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and enrollment ID are required',
      });
    }

    // Check if project already exists for this enrollment
    const existingProject = await Project.findOne({
      enrollmentId,
      status: { $ne: 'failed' },
    });

    if (existingProject) {
      return res.status(200).json({
        success: true,
        message: 'Project already exists for this enrollment',
        project: existingProject,
      });
    }

    // Get user data including CV information
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get enrollment with category info
    const enrollment = await Enrollment.findById(enrollmentId).populate('category');
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Generate project using AI based on CV data
    const projectData = await aiService.generateInternshipProject(
      {
        skills: user.skills?.technical,
        field: user.field,
        interest: user.interest,
      },
      enrollment.category?.name || 'General'
    );

    // Create project in database
    const project = new Project({
      userId,
      enrollmentId,
      categoryId: enrollment.category?._id,
      title: projectData.title,
      description: projectData.description,
      objectives: projectData.objectives,
      tools: projectData.tools,
      skills: projectData.skills,
      tasks: projectData.tasks,
      notes: projectData.notes,
      totalTasks: projectData.tasks.length,
      cvData: {
        skills: user.skills?.technical,
        field: user.field,
        interest: user.interest,
      },
      status: 'active',
    });

    await project.save();

    // Update user stats
    user.stats.tasksCompleted = 0;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Internship project generated successfully',
      project,
    });
  } catch (error) {
    console.error('Error generating internship project:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating internship project',
      error: error.message,
    });
  }
};

/**
 * Get user's internship project
 * GET /api/projects/:enrollmentId
 */
exports.getProject = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findOne({
      enrollmentId,
      userId,
    }).populate('categoryId', 'name');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message,
    });
  }
};

/**
 * Submit a task for evaluation
 * POST /api/projects/:enrollmentId/submit-task
 */
exports.submitTask = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { taskId, submissionText } = req.body;
    const userId = req.user?.id;

    if (!taskId || !submissionText) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and submission text are required',
      });
    }

    // Find the project
    const project = await Project.findOne({
      enrollmentId,
      userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Find the task within the project
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Update task with submission
    task.submission = {
      text: submissionText,
      submittedAt: new Date(),
    };
    task.status = 'submitted';

    // Evaluate submission using AI
    const evaluation = await aiService.evaluateSubmission({
      submission: submissionText,
      taskDescription: task.description,
    });

    task.evaluation = {
      score: evaluation.score,
      passed: evaluation.passed,
      feedback: evaluation.feedback,
      plagiarismScore: evaluation.plagiarismScore,
      evaluatedAt: new Date(),
    };

    // Update task status based on evaluation
    if (evaluation.passed) {
      task.status = 'completed';
      // Update completed tasks count
      const completedCount = project.tasks.filter((t) => t.status === 'completed').length;
      project.completedTasks = completedCount;
    } else {
      task.status = 'rejected';
    }

    await project.save();

    // Check if all tasks are completed
    if (project.completedTasks === project.totalTasks && !project.certificateGenerated) {
      // Auto-generate certificate
      await generateCompletionCertificate(userId, project._id);
    }

    res.status(200).json({
      success: true,
      message: 'Task submitted and evaluated',
      evaluation,
      progress: project.progress,
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

/**
 * Update task status
 * PUT /api/projects/:enrollmentId/tasks/:taskId/status
 */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { enrollmentId, taskId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    const validStatuses = ['pending', 'in-progress', 'submitted', 'completed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const project = await Project.findOne({
      enrollmentId,
      userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    task.status = status;
    if (status === 'in-progress') {
      task.status = 'in-progress';
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Task status updated',
      task,
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message,
    });
  }
};

/**
 * Get project progress and tasks
 * GET /api/projects/:enrollmentId/progress
 */
exports.getProjectProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user?.id;

    const project = await Project.findOne({
      enrollmentId,
      userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const taskStats = {
      total: project.totalTasks,
      completed: project.completedTasks,
      pending: project.tasks.filter((t) => t.status === 'pending').length,
      inProgress: project.tasks.filter((t) => t.status === 'in-progress').length,
      submitted: project.tasks.filter((t) => t.status === 'submitted').length,
      rejected: project.tasks.filter((t) => t.status === 'rejected').length,
    };

    const taskDetails = project.tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      status: task.status,
      order: task.order,
      submission: task.submission,
      evaluation: task.evaluation,
    }));

    res.status(200).json({
      success: true,
      progress: project.progress,
      taskStats,
      tasks: taskDetails,
      certificateGenerated: project.certificateGenerated,
    });
  } catch (error) {
    console.error('Error fetching project progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project progress',
      error: error.message,
    });
  }
};

/**
 * Generate certificate upon project completion
 */
async function generateCompletionCertificate(userId, projectId) {
  try {
    const user = await User.findById(userId);
    const project = await Project.findById(projectId);

    if (!user || !project) return;

    // Create or get existing certificate
    let certificate = await Certificate.findOne({
      userId,
      projectId,
    });

    if (!certificate) {
      certificate = new Certificate({
        userId,
        enrollmentId: project.enrollmentId,
        projectId,
        courseTitle: project.title,
        issueDate: new Date(),
        completionDate: new Date(),
        certificateType: 'AI-Powered Project Completion',
      });

      await certificate.save();

      // Update project
      project.certificateGenerated = true;
      project.certificateId = certificate._id;
      project.status = 'completed';
      project.actualEndDate = new Date();
      await project.save();

      // Update user stats
      user.stats.certificatesEarned += 1;
      await user.save();
    }

    return certificate;
  } catch (error) {
    console.error('Error generating certificate:', error);
  }
}

/**
 * Regenerate project (create new project for the same enrollment)
 * POST /api/projects/:enrollmentId/regenerate
 */
exports.regenerateProject = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user?.id;

    // Archive old project
    const oldProject = await Project.findOneAndUpdate(
      { enrollmentId, userId },
      { status: 'paused' },
      { new: true }
    );

    if (!oldProject) {
      return res.status(404).json({
        success: false,
        message: 'No project found to regenerate',
      });
    }

    // Generate new project
    const user = await User.findById(userId);
    const enrollment = await Enrollment.findById(enrollmentId).populate('category');

    const projectData = await aiService.generateInternshipProject(
      {
        skills: user.skills?.technical,
        field: user.field,
        interest: user.interest,
      },
      enrollment.category?.name || 'General'
    );

    const newProject = new Project({
      userId,
      enrollmentId,
      categoryId: enrollment.category?._id,
      title: projectData.title,
      description: projectData.description,
      objectives: projectData.objectives,
      tools: projectData.tools,
      skills: projectData.skills,
      tasks: projectData.tasks,
      notes: projectData.notes,
      totalTasks: projectData.tasks.length,
      cvData: {
        skills: user.skills?.technical,
        field: user.field,
        interest: user.interest,
      },
      status: 'active',
    });

    await newProject.save();

    res.status(201).json({
      success: true,
      message: 'Project regenerated successfully',
      project: newProject,
    });
  } catch (error) {
    console.error('Error regenerating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating project',
      error: error.message,
    });
  }
};
