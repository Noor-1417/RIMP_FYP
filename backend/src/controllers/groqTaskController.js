/**
 * Task Controller — handles AI task generation and retrieval.
 * Uses groqService.js for all AI calls.
 *
 * Routes handled:
 *   POST /api/tasks/generate         → generateTasks
 *   GET  /api/tasks/student          → getStudentTasks
 *   GET  /api/tasks/:taskId          → getTaskById
 */

const InternshipTask = require('../models/InternshipTask');
const Enrollment = require('../models/Enrollment');
const InternshipCategory = require('../models/InternshipCategory');
const groqService = require('../services/groqService');

// ──────────────────────────────────────────────────────────────
// POST /api/tasks/generate
// Generate AI tasks after enrollment is confirmed
// Body: { enrollmentId }
// ──────────────────────────────────────────────────────────────
exports.generateTasks = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { enrollmentId } = req.body;

    if (!enrollmentId) {
      return res.status(400).json({ success: false, message: 'enrollmentId is required' });
    }

    // Verify enrollment belongs to user and is active
    const enrollment = await Enrollment.findOne({
      _id: enrollmentId,
      intern: userId,
      status: 'active',
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found or not active',
      });
    }

    // Check if tasks already exist for this enrollment
    const existingTasks = await InternshipTask.countDocuments({ internshipId: enrollmentId });
    if (existingTasks > 0) {
      return res.status(400).json({
        success: false,
        message: `Tasks already generated for this enrollment (${existingTasks} tasks exist)`,
      });
    }

    // Get category details
    const category = await InternshipCategory.findById(enrollment.category);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Internship category not found' });
    }

    const durationWeeks = enrollment.durationWeeks || enrollment.selectedDuration || 4;
    const difficulty = category.difficulty || 'intermediate';

    // Call Groq AI to generate tasks
    const taskDataArray = await groqService.generateInternshipTasks(
      category.name,
      durationWeeks,
      difficulty
    );

    const startDate = enrollment.startDate || new Date();

    // Build task documents
    const taskDocs = taskDataArray.map((t) => {
      const deadlineDate = new Date(startDate);
      deadlineDate.setDate(deadlineDate.getDate() + t.weekNumber * 7);

      return {
        internshipId: enrollment._id,
        studentId:    userId,
        categoryId:   category._id,
        enrollment:   enrollment._id,
        student:      userId,
        category:     category._id,
        title:        t.title,
        description:  t.description,
        requirements: t.requirements,
        weekNumber:   t.weekNumber,
        deadline:     deadlineDate,
        deadlineDate: deadlineDate,
        orderNumber:  t.orderNumber,
        taskOrder:    t.orderNumber,
        status:       t.orderNumber === 1 ? 'unlocked' : 'locked', // First task unlocked
      };
    });

    const createdTasks = await InternshipTask.insertMany(taskDocs);

    console.log(`✅ Generated ${createdTasks.length} AI tasks for enrollment ${enrollmentId}`);

    res.status(201).json({
      success: true,
      message: `Generated ${createdTasks.length} tasks successfully`,
      data: createdTasks,
    });
  } catch (error) {
    console.error('generateTasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate tasks',
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/tasks/student
// Get all tasks of the logged-in student (across all enrollments)
// ──────────────────────────────────────────────────────────────
exports.getStudentTasks = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const tasks = await InternshipTask.find({ studentId: userId })
      .populate('categoryId', 'name icon color')
      .populate('internshipId', 'selectedDuration startDate endDate')
      .sort({ internshipId: 1, orderNumber: 1 });

    // Dynamically compute unlock status
    const grouped = {};
    for (const task of tasks) {
      const enrollId = task.internshipId?._id?.toString() || task.internshipId?.toString();
      if (!grouped[enrollId]) grouped[enrollId] = [];
      grouped[enrollId].push(task);
    }

    const updatedTasks = [];
    for (const enrollId of Object.keys(grouped)) {
      const enrollmentTasks = grouped[enrollId].sort((a, b) => a.orderNumber - b.orderNumber);
      for (let i = 0; i < enrollmentTasks.length; i++) {
        const task = enrollmentTasks[i];
        const taskObj = task.toObject();

        // First task always unlocked
        if (taskObj.orderNumber === 1 && taskObj.status === 'locked') {
          taskObj.status = 'unlocked';
          await InternshipTask.findByIdAndUpdate(task._id, { status: 'unlocked' });
        }

        // Unlock if previous approved
        if (taskObj.orderNumber > 1 && taskObj.status === 'locked') {
          const prev = enrollmentTasks[i - 1];
          if (prev && (prev.status === 'approved' || prev.status === 'completed')) {
            taskObj.status = 'unlocked';
            await InternshipTask.findByIdAndUpdate(task._id, { status: 'unlocked' });
          }
        }

        taskObj.isLocked = taskObj.status === 'locked';
        updatedTasks.push(taskObj);
      }
    }

    res.status(200).json({
      success: true,
      count: updatedTasks.length,
      data: updatedTasks,
    });
  } catch (error) {
    console.error('getStudentTasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/tasks/:taskId
// Get a single task by ID (only if it belongs to the student)
// ──────────────────────────────────────────────────────────────
exports.getTaskById = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { taskId } = req.params;

    const task = await InternshipTask.findOne({
      _id: taskId,
      studentId: userId,
    })
      .populate('categoryId', 'name icon color')
      .populate('internshipId', 'selectedDuration startDate endDate');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('getTaskById error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────
// INTERNAL: generateTasksForEnrollment
// Called from categoryController after enrollment creation
// (kept for backward compatibility with auto-generation flow)
// ──────────────────────────────────────────────────────────────
exports.generateTasksForEnrollment = async (enrollment, category) => {
  try {
    const durationWeeks = enrollment.durationWeeks || enrollment.selectedDuration || category.duration || 4;
    const difficulty = category.difficulty || 'intermediate';

    const taskDataArray = await groqService.generateInternshipTasks(
      category.name,
      durationWeeks,
      difficulty
    );

    const startDate = enrollment.startDate || new Date();

    const taskDocs = taskDataArray.map((t) => {
      const deadlineDate = new Date(startDate);
      deadlineDate.setDate(deadlineDate.getDate() + t.weekNumber * 7);

      return {
        internshipId: enrollment._id,
        studentId:    enrollment.intern,
        categoryId:   category._id,
        enrollment:   enrollment._id,
        student:      enrollment.intern,
        category:     category._id,
        title:        t.title,
        description:  t.description,
        requirements: t.requirements,
        weekNumber:   t.weekNumber,
        deadline:     deadlineDate,
        deadlineDate: deadlineDate,
        orderNumber:  t.orderNumber,
        taskOrder:    t.orderNumber,
        status:       t.orderNumber === 1 ? 'unlocked' : 'locked',
      };
    });

    const created = await InternshipTask.insertMany(taskDocs);
    console.log(`✅ Generated ${created.length} AI tasks for enrollment ${enrollment._id}`);
    return created;
  } catch (err) {
    console.error('❌ generateTasksForEnrollment error:', err.message);
    return [];
  }
};
