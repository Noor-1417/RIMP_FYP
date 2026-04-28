const Project = require('../models/Project');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const InternshipCategory = require('../models/InternshipCategory');
const aiService = require('../services/aiService');

/**
 * Generate AI project for user
 * POST /api/ai/generate-project
 * 
 * Input:
 * - userId: User ID
 * - skills: Array of skills
 * - field: User's field
 * - educationLevel: Education level
 * - enrollmentId: (optional) For existing enrollment
 */
exports.generateProject = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { skills, field, educationLevel, enrollmentId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required',
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get enrollment if provided, otherwise find the latest active enrollment
    let enrollment;
    if (enrollmentId) {
      enrollment = await Enrollment.findById(enrollmentId).populate('category');
    } else {
      enrollment = await Enrollment.findOne({
        intern: userId,
        status: 'active',
      })
        .populate('category')
        .sort({ enrollmentDate: -1 });
    }

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'No active enrollment found. Please enroll in a category first.',
      });
    }

    // Check if project already exists for this enrollment
    const existingProject = await Project.findOne({
      enrollmentId: enrollment._id,
      status: { $ne: 'failed' },
    });

    if (existingProject) {
      return res.status(200).json({
        success: true,
        message: 'Project already exists for this enrollment',
        project: existingProject,
        isNew: false,
      });
    }

    // Prepare CV data - use provided data or user profile data
    const cvData = {
      skills: skills || user.skills?.technical || [],
      field: field || user.field || 'General',
      interest: user.interest || '',
    };

    // Generate project using AI
    const projectData = await aiService.generateInternshipProject(
      cvData,
      enrollment.category?.name || 'General Internship'
    );

    // Create project in database
    const project = new Project({
      userId,
      enrollmentId: enrollment._id,
      categoryId: enrollment.category?._id,
      title: projectData.title,
      description: projectData.description,
      objectives: projectData.objectives,
      tools: projectData.tools,
      skills: projectData.skills,
      tasks: projectData.tasks,
      notes: projectData.notes,
      totalTasks: projectData.tasks.length,
      completedTasks: 0,
      progress: 0,
      status: 'active',
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'AI project generated successfully',
      project,
      isNew: true,
    });
  } catch (error) {
    console.error('Error generating AI project:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating AI project',
      error: error.message,
    });
  }
};

/**
 * Submit task for AI evaluation
 * POST /api/ai/submit-task
 * 
 * Input:
 * - userId: User ID
 * - enrollmentId: Enrollment ID
 * - taskId: Task ID to submit
 * - submissionText: Submission content
 */
exports.submitTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { enrollmentId, taskId, submissionText } = req.body;

    if (!enrollmentId || !taskId || !submissionText) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment ID, task ID, and submission text are required',
      });
    }

    // Find project
    const project = await Project.findOne({
      _id: { $exists: true },
      enrollmentId,
      userId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Find task
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in project',
      });
    }

    // Save submission
    task.submission = {
      text: submissionText,
      submittedAt: new Date(),
    };
    task.status = 'submitted';

    // Evaluate submission using AI
    const evaluation = await aiService.evaluateSubmission({
      submission: submissionText,
      taskDescription: task.description || task.title,
    });

    // Update task with evaluation
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
    } else {
      task.status = 'rejected';
    }

    // Recalculate progress
    const completedCount = project.tasks.filter(t => t.status === 'completed').length;
    project.completedTasks = completedCount;
    project.progress = aiService.calculateProgress(completedCount, project.totalTasks);

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Task submitted and evaluated successfully',
      evaluation,
      task: {
        _id: task._id,
        title: task.title,
        status: task.status,
        evaluation: task.evaluation,
      },
      projectProgress: {
        completedTasks: project.completedTasks,
        totalTasks: project.totalTasks,
        progress: project.progress,
      },
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
 * Get project progress and statistics
 * GET /api/ai/progress/:enrollmentId
 */
exports.getProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { enrollmentId } = req.params;

    if (!userId || !enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'User and enrollment information required',
      });
    }

    // Find project
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

    // Get task statistics
    const taskStats = aiService.getTaskStatistics(project.tasks);

    // Calculate progress
    const progress = aiService.calculateProgress(
      project.completedTasks,
      project.totalTasks
    );

    // Get task details
    const tasksDetail = project.tasks.map(task => ({
      _id: task._id,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      status: task.status,
      order: task.order,
      submission: task.submission ? {
        submittedAt: task.submission.submittedAt,
      } : null,
      evaluation: task.evaluation ? {
        score: task.evaluation.score,
        passed: task.evaluation.passed,
        feedback: task.evaluation.feedback,
        plagiarismScore: task.evaluation.plagiarismScore,
        evaluatedAt: task.evaluation.evaluatedAt,
      } : null,
    }));

    res.status(200).json({
      success: true,
      progress: {
        overall: progress,
        completed: project.completedTasks,
        total: project.totalTasks,
      },
      statistics: taskStats,
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        status: project.status,
        startDate: project.startDate,
        estimatedEndDate: project.estimatedEndDate,
      },
      tasks: tasksDetail,
    });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching progress',
      error: error.message,
    });
  }
};

/**
 * Regenerate project (for same enrollment with different parameters)
 * POST /api/ai/regenerate-project
 */
exports.regenerateProject = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { enrollmentId, skills, field } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment ID is required',
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find enrollment
    const enrollment = await Enrollment.findById(enrollmentId).populate('category');
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found',
      });
    }

    // Find existing project
    const existingProject = await Project.findOne({
      enrollmentId,
      userId,
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'No project found for this enrollment',
      });
    }

    // Generate new project data
    const cvData = {
      skills: skills || user.skills?.technical || [],
      field: field || user.field || 'General',
      interest: user.interest || '',
    };

    const projectData = await aiService.generateInternshipProject(
      cvData,
      enrollment.category?.name || 'General Internship'
    );

    // Update existing project
    existingProject.title = projectData.title;
    existingProject.description = projectData.description;
    existingProject.objectives = projectData.objectives;
    existingProject.tools = projectData.tools;
    existingProject.skills = projectData.skills;
    existingProject.tasks = projectData.tasks;
    existingProject.notes = projectData.notes;
    existingProject.totalTasks = projectData.tasks.length;
    existingProject.completedTasks = 0;
    existingProject.progress = 0;
    existingProject.status = 'active';

    await existingProject.save();

    res.status(200).json({
      success: true,
      message: 'Project regenerated successfully',
      project: existingProject,
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

/**
 * Get task details with AI insights
 * GET /api/ai/task/:enrollmentId/:taskId
 */
exports.getTaskDetails = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { enrollmentId, taskId } = req.params;

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

    res.status(200).json({
      success: true,
      task: {
        _id: task._id,
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status,
        order: task.order,
        submission: task.submission,
        evaluation: task.evaluation,
      },
    });
  } catch (error) {
    console.error('Error fetching task details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task details',
      error: error.message,
    });
  }
};

/**
 * Start internship with AI chatbot flow
 * POST /api/ai/start-internship
 * 
 * Input:
 * - userId: User ID
 * - enrollmentId: Enrollment ID
 */
exports.startInternship = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { enrollmentId } = req.body;

    if (!userId || !enrollmentId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and enrollment ID are required',
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find enrollment
    const enrollment = await Enrollment.findById(enrollmentId).populate('category');
    if (!enrollment || enrollment.intern.toString() !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found or unauthorized',
      });
    }

    // Check if project already exists
    let existingProject = await Project.findOne({
      enrollmentId,
      userId,
      status: { $ne: 'failed' },
    });

    if (existingProject) {
      // Return existing project
      return res.status(200).json({
        success: true,
        message: 'Project already exists',
        project: {
          _id: existingProject._id,
          title: existingProject.title,
          description: existingProject.description,
          tasks: existingProject.tasks.map(t => ({
            _id: t._id,
            title: t.title,
            deadline: t.deadline,
            order: t.order,
          })),
          totalTasks: existingProject.totalTasks,
          status: existingProject.status,
        },
        isNew: false,
      });
    }

    // Generate new project
    const cvData = {
      skills: user.skills?.technical || [],
      field: user.field || 'General',
      interest: user.interest || '',
    };

    const projectData = await aiService.generateInternshipProject(
      cvData,
      enrollment.category?.name || 'General Internship'
    );

    // Create project
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
      completedTasks: 0,
      progress: 0,
      status: 'active',
    });

    await newProject.save();

    res.status(201).json({
      success: true,
      message: 'Internship started successfully',
      project: {
        _id: newProject._id,
        title: newProject.title,
        description: newProject.description,
        tasks: newProject.tasks.map(t => ({
          _id: t._id,
          title: t.title,
          deadline: t.deadline,
          order: t.order,
        })),
        totalTasks: newProject.totalTasks,
        status: newProject.status,
      },
      isNew: true,
    });
  } catch (error) {
    console.error('Error starting internship:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting internship',
      error: error.message,
    });
  }
};

/**
 * Evaluate task submission
 * POST /api/ai/evaluate-task
 * 
 * Input:
 * - userId: User ID
 * - enrollmentId: Enrollment ID
 * - taskId: Task ID
 * - submissionText: Submission text
 */
exports.evaluateTask = async (req, res) => {
  try {
    const userId = req.user?.id || req.body.userId;
    const { enrollmentId, taskId, submissionText } = req.body;

    if (!enrollmentId || !taskId || !submissionText) {
      return res.status(400).json({
        success: false,
        message: 'Enrollment ID, task ID, and submission text are required',
      });
    }

    // Find project
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

    // Find task
    const task = project.tasks.id(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Save submission
    task.submission = {
      text: submissionText,
      submittedAt: new Date(),
    };
    task.status = 'submitted';

    // Evaluate submission
    const evaluation = await aiService.evaluateSubmission({
      submission: submissionText,
      taskDescription: task.description || task.title,
    });

    // Update evaluation
    task.evaluation = {
      score: evaluation.score,
      passed: evaluation.passed,
      feedback: evaluation.feedback,
      plagiarismScore: evaluation.plagiarismScore,
      evaluatedAt: new Date(),
    };

    // Update task status
    task.status = evaluation.passed ? 'completed' : 'rejected';

    // Update progress
    const completedCount = project.tasks.filter(t => t.status === 'completed').length;
    project.completedTasks = completedCount;
    project.progress = aiService.calculateProgress(completedCount, project.totalTasks);

    await project.save();

    res.status(200).json({
      success: true,
      message: 'Task evaluated successfully',
      evaluation: {
        score: evaluation.score,
        passed: evaluation.passed,
        feedback: evaluation.feedback,
        plagiarismScore: evaluation.plagiarismScore,
      },
      taskStatus: task.status,
      projectProgress: {
        completed: project.completedTasks,
        total: project.totalTasks,
        percentage: project.progress,
      },
    });
  } catch (error) {
    console.error('Error evaluating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error evaluating task',
      error: error.message,
    });
  }
};

/**
 * Get user's current project by userId
 * GET /api/ai/my-project
 */
exports.getMyProject = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      });
    }

    // Find latest active project for user
    const project = await Project.findOne({
      userId,
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .populate('enrollmentId');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'No active project found',
      });
    }

    res.status(200).json({
      success: true,
      project: {
        _id: project._id,
        title: project.title,
        description: project.description,
        enrollmentId: project.enrollmentId?._id,
        tasks: project.tasks.map(t => ({
          _id: t._id,
          title: t.title,
          description: t.description,
          deadline: t.deadline,
          status: t.status,
          order: t.order,
          evaluation: t.evaluation,
        })),
        totalTasks: project.totalTasks,
        completedTasks: project.completedTasks,
        progress: project.progress,
      },
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
