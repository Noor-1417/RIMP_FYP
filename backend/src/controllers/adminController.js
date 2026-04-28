// =========================
// Imports
// =========================
const User = require('../models/User');
const Task = require('../models/Task');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const InternshipCategory = require('../models/InternshipCategory');
const Settings = require('../models/Settings');
const InternshipTask = require('../models/InternshipTask');
const { createNotificationForStudents } = require('./notificationController');

// ===============================================================
// 1. ADMIN DASHBOARD STATS  (Main Stats Overview)
// ===============================================================

// @desc Admin Dashboard Stats
// @route GET /api/admin/stats
// @access Private/Admin
exports.getDashboardStats = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'intern' });
    const activeEnrollments = await Enrollment.countDocuments({ status: 'active' });
    const completedEnrollments = await Enrollment.countDocuments({ status: 'completed' });
    const totalCategories = await InternshipCategory.countDocuments();

    const pendingSubmissionsAgg = await Task.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.status': 'submitted' } },
      { $count: 'count' },
    ]);

    const certificatesGeneratedAgg = await Task.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.status': 'graded-passed' } },
      { $count: 'count' },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        activeEnrollments,
        completedEnrollments,
        totalCategories,
        pendingSubmissions: pendingSubmissionsAgg[0]?.count || 0,
        certificatesGenerated: certificatesGeneratedAgg[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ===============================================================
// 2. BASIC STUDENT LIST + SIMPLE STATS
// ===============================================================

// @desc Get simplified student list for admin
// @route GET /api/admin/students/basic
// @access Private/Admin
exports.getStudentsBasic = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { role: 'intern' };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const studentIds = students.map((s) => s._id);

    const enrollCounts = await Task.aggregate([
      { $match: { assignedTo: { $in: studentIds } } },
      { $unwind: '$assignedTo' },
      { $match: { assignedTo: { $in: studentIds } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
    ]);

    const enrollMap = {};
    enrollCounts.forEach((e) => {
      enrollMap[e._id.toString()] = e.count;
    });

    const studentsData = students.map((s) => ({
      ...s,
      totalEnrollments: enrollMap[s._id.toString()] || 0,
      activeEnrollments: (s.subscriptionMonths || 0) > 0 ? 1 : 0,
    }));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: studentsData,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ===============================================================
// 3. ADVANCED STUDENT LIST (WITH ENROLLMENTS)
// ===============================================================

// @desc Get students with full enrollment + progress data (advanced search + filters)
// @route GET /api/admin/students
// @access Private/Admin
exports.getAllStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, status: enrollStatus } = req.query;

    const query = { role: 'intern' };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const students = await User.find(query)
      .select('firstName lastName email stats enrollmentDate isActive createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const studentsWithEnrollments = await Promise.all(
      students.map(async (student) => {
        let enrollments = await Enrollment.find({ intern: student._id })
          .populate('category', 'name duration');

        if (category) {
          enrollments = enrollments.filter(e => e.category._id.toString() === category);
        }

        if (enrollStatus) {
          enrollments = enrollments.filter(e => e.status === enrollStatus);
        }

        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          stats: student.stats,
          enrollmentDate: student.enrollmentDate,
          createdAt: student.createdAt,
          isActive: student.isActive,
          enrollments,
          totalEnrollments: enrollments.length,
          activeEnrollments: enrollments.filter(e => e.status === 'active').length,
        };
      })
    );

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: studentsWithEnrollments,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single student detail
// @route GET /api/admin/students/:id
// @access Private/Admin
exports.getStudentDetail = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id)
      .select('firstName lastName email stats enrollmentDate isActive')
      .lean();

    if (!student || student.role !== 'intern') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const enrollments = await Enrollment.find({ intern: student._id })
      .populate('category', 'name duration')
      .lean();

    res.status(200).json({
      success: true,
      data: { ...student, enrollments },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get full student report — enrollments + AI tasks per enrollment
// @route GET /api/admin/students/:id/report
// @access Private/Admin
exports.getStudentReport = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id)
      .select('firstName lastName email isActive enrollmentDate stats role')
      .lean();

    if (!student || student.role !== 'intern') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const enrollments = await Enrollment.find({ intern: student._id })
      .populate('category', 'name icon color duration description')
      .lean();

    // For each enrollment, fetch AI tasks
    const enrichedEnrollments = await Promise.all(
      enrollments.map(async (enrollment) => {
        const tasks = await InternshipTask.find({
          $or: [
            { internshipId: enrollment._id },
            { enrollment: enrollment._id },
          ],
        })
          .select('title weekNumber taskOrder orderNumber status evaluation deadline deadlineDate')
          .sort({ taskOrder: 1, orderNumber: 1, weekNumber: 1 })
          .lean();

        const totalTasks = tasks.length;
        const approvedTasks = tasks.filter((t) => t.status === 'approved').length;
        const progressPct = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

        return {
          _id: enrollment._id,
          status: enrollment.status,
          selectedDuration: enrollment.selectedDuration,
          enrolledAt: enrollment.enrolledAt || enrollment.createdAt,
          paymentStatus: enrollment.paymentStatus,
          category: enrollment.category,
          taskSummary: {
            total: totalTasks,
            approved: approvedTasks,
            submitted: tasks.filter((t) => t.status === 'submitted').length,
            rejected: tasks.filter((t) => t.status === 'rejected').length,
            pending: tasks.filter((t) => ['locked', 'unlocked', 'in-progress'].includes(t.status)).length,
            progressPct,
          },
          tasks: tasks.map((t) => ({
            _id: t._id,
            title: t.title,
            weekNumber: t.weekNumber || t.taskOrder || t.orderNumber,
            status: t.status,
            deadline: t.deadline || t.deadlineDate,
            score: t.evaluation?.score ?? null,
            evaluationStatus: t.evaluation?.status ?? null,
            feedback: t.evaluation?.feedback ?? null,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        student: {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          isActive: student.isActive,
          enrollmentDate: student.enrollmentDate,
          stats: student.stats,
        },
        enrollments: enrichedEnrollments,
        summary: {
          totalEnrollments: enrichedEnrollments.length,
          totalTasks: enrichedEnrollments.reduce((a, e) => a + e.taskSummary.total, 0),
          totalApproved: enrichedEnrollments.reduce((a, e) => a + e.taskSummary.approved, 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};



// @desc Update student info (admin only)
// @route PUT /api/admin/students/:id
// @access Private/Admin
exports.updateStudent = async (req, res, next) => {
  try {
    const { firstName, lastName, email } = req.body;

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'intern') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    if (email && email !== student.email) {
      const existing = await User.findOne({ email, _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    Object.assign(student, {
      firstName: firstName || student.firstName,
      lastName: lastName || student.lastName,
      email: email || student.email,
    });

    await student.save();

    res.status(200).json({ success: true, data: student, message: 'Student updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Change student category/enrollment
// @route POST /api/admin/students/:id/change-category
// @access Private/Admin
exports.changeStudentCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'intern') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const enrollment = await Enrollment.findOne({ intern: student._id });
    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'No active enrollment found' });
    }

    enrollment.category = categoryId;
    await enrollment.save();

    await createNotificationForStudents(
      'Course Updated',
      'You have been assigned to a new course.',
      'course-assigned',
      { resourceType: 'course', resourceId: categoryId },
      [student._id]
    );

    res.status(200).json({ success: true, data: enrollment, message: 'Student category changed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Suspend student account
// @route POST /api/admin/students/:id/suspend
// @access Private/Admin
exports.suspendStudent = async (req, res, next) => {
  try {
    const { reason, until } = req.body;

    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'intern') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.isActive = false;
    student.suspensionReason = reason;
    student.suspendedUntil = until;

    await student.save();

    res.status(200).json({ success: true, data: student, message: 'Student suspended successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Reactivate student account
// @route POST /api/admin/students/:id/reactivate
// @access Private/Admin
exports.reactivateStudent = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'intern') {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    student.isActive = true;
    student.suspensionReason = undefined;
    student.suspendedUntil = undefined;

    await student.save();

    res.status(200).json({ success: true, data: student, message: 'Student reactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Delete student
// @route DELETE /api/admin/students/:id
// @access Private/Admin
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await User.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Clean up enrollments
    await Enrollment.deleteMany({ intern: student._id });

    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===============================================================
// 4. RECENT SUBMISSIONS (FLATTENED)
// ===============================================================

// @desc Recent submissions (simple)
// @route GET /api/admin/submissions/basic
// @access Private/Admin
exports.getSubmissionsFlat = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const agg = await Task.aggregate([
      { $unwind: '$submissions' },
      { $sort: { 'submissions.submittedAt': -1 } },
      {
        $project: {
          taskId: '$_id',
          taskTitle: '$title',
          submission: '$submissions',
        },
      },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
    ]);

    const results = await Promise.all(
      agg.map(async (item) => {
        const student = await User.findById(item.submission.user).lean();

        return {
          _id: `${item.taskId}_${item.submission._id}`,
          student: student
            ? {
                firstName: student.firstName,
                lastName: student.lastName,
                email: student.email,
                _id: student._id,
              }
            : null,
          task: { _id: item.taskId, title: item.taskTitle },
          contentUrl: item.submission.contentUrl,
          aiResult: item.submission.aiResult || null,
          status: item.submission.status,
          submittedAt: item.submission.submittedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        currentPage: Number(page),
        pageSize: Number(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Detailed recent task submissions (Task model + InternshipTask model)
// @route GET /api/admin/submissions
// @access Private/Admin
exports.getRecentSubmissions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum  = Number(page);
    const limitNum = Number(limit);
    let allSubmissions = [];

    // ── A. Old Task model submissions (embedded) ──
    try {
      const tasks = await Task.find({ 'submissions.0': { $exists: true } })
        .populate('category', 'name icon')
        .lean();

      tasks.forEach((task) => {
        (task.submissions || []).forEach((sub) => {
          if (status && sub.status !== status) return;
          allSubmissions.push({
            _id:         sub._id,
            source:      'task',
            task:        { _id: task._id, title: task.title },
            category:    task.category,
            student:     sub.user || null,
            submittedAt: sub.submittedAt || sub.createdAt,
            status:      sub.status,
            contentUrl:  sub.contentUrl,
            files:       sub.files || [],
            aiResult:    sub.aiResult || null,
          });
        });
      });
    } catch (_) {}

    // ── B. InternshipTask model (AI-generated tasks with inline submission) ──
    try {
      const itQuery = {
        status: { $in: ['submitted', 'approved', 'rejected'] },
        'submission.submittedAt': { $exists: true },
      };
      if (status) {
        const map = { submitted: 'submitted', 'graded-passed': 'approved', 'graded-failed': 'rejected' };
        itQuery.status = map[status] || status;
      }

      const aiTasks = await InternshipTask.find(itQuery)
        .populate({ path: 'student',    select: 'firstName lastName email', model: 'User' })
        .populate({ path: 'studentId',  select: 'firstName lastName email', model: 'User' })
        .populate({ path: 'enrollment', select: 'category', populate: { path: 'category', select: 'name icon' } })
        .sort({ 'submission.submittedAt': -1 })
        .lean();

      aiTasks.forEach((t) => {
        const sub    = t.submission || {};
        const stud   = t.student || t.studentId || null;
        const catObj = t.enrollment?.category || null;

        // Map InternshipTask status → SubmissionsTable expected status
        const statusMap = { submitted:'submitted', approved:'graded-passed', rejected:'graded-failed' };

        allSubmissions.push({
          _id:         t._id,
          source:      'ai-task',
          task:        { _id: t._id, title: t.title },
          category:    catObj,
          student:     stud,
          submittedAt: sub.submittedAt || t.updatedAt,
          status:      statusMap[t.status] || t.status,
          contentUrl:  sub.githubLink || sub.fileUrl || null,
          message:     sub.message || '',
          aiResult: t.evaluation ? {
            score:      t.evaluation.score,
            feedback:   t.evaluation.feedback,
            status:     t.evaluation.status,
            plagiarism: t.evaluation.plagiarism_percent,
          } : null,
        });
      });
    } catch (_) {}

    // ── Sort, paginate ──
    allSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Populate student objects for old-Task submissions that only have user ID
    allSubmissions = await Promise.all(allSubmissions.map(async (s) => {
      if (s.source === 'task' && s.student && !s.student.firstName) {
        try {
          const u = await User.findById(s.student).select('firstName lastName email').lean();
          s.student = u;
        } catch (_) {}
      }
      return s;
    }));

    const total = allSubmissions.length;
    const paged = allSubmissions.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      data: paged,
      pagination: {
        total,
        pages: Math.ceil(total / limitNum),
        currentPage: pageNum,
      },
    });
  } catch (error) {
    next(error);
  }
};


  // ===============================================================
  // 6. CATEGORIES CRUD
  // ===============================================================

  // @desc Get all internship categories with pagination and search
  // @route GET /api/admin/categories
  // @access Private/Admin
  exports.getCategories = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search } = req.query;
      let query = { isActive: true };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { industry: { $regex: search, $options: 'i' } },
        ];
      }

      const categories = await InternshipCategory.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .lean();

      const total = await InternshipCategory.countDocuments(query);

      res.status(200).json({
        success: true,
        data: categories,
        pagination: { total, pages: Math.ceil(total / limit), currentPage: Number(page) },
      });
    } catch (error) {
      next(error);
    }
  };

  // @desc Get single category by ID
  // @route GET /api/admin/categories/:id
  // @access Private/Admin
  exports.getCategoryDetail = async (req, res, next) => {
    try {
      const category = await InternshipCategory.findById(req.params.id)
        .populate('manager', 'firstName lastName email')
        .lean();

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      res.status(200).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  };

  // @desc Create new category
  // @route POST /api/admin/categories
  // @access Private/Admin
  exports.createCategory = async (req, res, next) => {
    try {
      const { name, description, duration, difficulty, price, capacity, icon, color, industry, prerequisites, learningOutcomes, topics } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      const existing = await InternshipCategory.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Category with this name already exists' });
      }

      const category = new InternshipCategory({
        name,
        description,
        duration: duration || 8,
        difficulty: difficulty || 'intermediate',
        price: price || 0,
        capacity: capacity || 100,
        icon,
        color,
        industry,
        prerequisites: prerequisites || [],
        learningOutcomes: learningOutcomes || [],
        topics: topics || [],
        manager: req.user._id,
        isActive: true,
      });

      await category.save();

      await createNotificationForStudents(
        'New Course Available',
        `A new course "${category.name}" is now available. Check it out!`,
        'new-course',
        { resourceType: 'course', resourceId: category._id }
      );

      res.status(201).json({ success: true, data: category, message: 'Category created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Update category
  // @route PUT /api/admin/categories/:id
  // @access Private/Admin
  exports.updateCategory = async (req, res, next) => {
    try {
      const { name, description, duration, difficulty, price, capacity, icon, color, industry, prerequisites, learningOutcomes, topics, isActive } = req.body;

      const category = await InternshipCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Check for duplicate name
      if (name && name !== category.name) {
        const existing = await InternshipCategory.findOne({ name: new RegExp(`^${name}$`, 'i'), _id: { $ne: req.params.id } });
        if (existing) {
          return res.status(409).json({ success: false, message: 'Another category with this name already exists' });
        }
      }

      Object.assign(category, {
        name: name || category.name,
        description: description !== undefined ? description : category.description,
        duration: duration || category.duration,
        difficulty: difficulty || category.difficulty,
        price: price !== undefined ? price : category.price,
        capacity: capacity || category.capacity,
        icon: icon || category.icon,
        color: color || category.color,
        industry: industry || category.industry,
        prerequisites: prerequisites || category.prerequisites,
        learningOutcomes: learningOutcomes || category.learningOutcomes,
        topics: topics || category.topics,
        isActive: isActive !== undefined ? isActive : category.isActive,
      });

      await category.save();

      res.status(200).json({ success: true, data: category, message: 'Category updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Delete category (soft delete)
  // @route DELETE /api/admin/categories/:id
  // @access Private/Admin
  exports.deleteCategory = async (req, res, next) => {
    try {
      const category = await InternshipCategory.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Soft delete: mark as inactive
      category.isActive = false;
      await category.save();

      res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ===============================================================
  // 7. TASKS CRUD
  // ===============================================================

  // @desc Get tasks list with pagination, search, and filtering
  // @route GET /api/admin/tasks
  // @access Private/Admin
  exports.getAllTasks = async (req, res, next) => {
    try {
      const { page = 1, limit = 50, search, category, status } = req.query;
      let query = {};

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (category) query.category = category;
      if (status) query.status = status;

      const tasks = await Task.find(query)
        .populate('category', 'name')
        .populate('assignedTo', 'firstName lastName email')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 })
        .lean();

      const total = await Task.countDocuments(query);

      res.status(200).json({
        success: true,
        data: tasks,
        pagination: { total, pages: Math.ceil(total / limit), currentPage: Number(page) },
      });
    } catch (error) {
      next(error);
    }
  };

  // @desc Get single task with submissions
  // @route GET /api/admin/tasks/:id
  // @access Private/Admin
  exports.getTaskDetail = async (req, res, next) => {
    try {
      const task = await Task.findById(req.params.id)
        .populate('category', 'name')
        .populate('assignedTo', 'firstName lastName email')
        .populate('submissions.user', 'firstName lastName email')
        .lean();

      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      res.status(200).json({ success: true, data: task });
    } catch (error) {
      next(error);
    }
  };

  // @desc Create new task
  // @route POST /api/admin/tasks
  // @access Private/Admin
  exports.createTask = async (req, res, next) => {
    try {
      const { title, description, categoryId, assignedTo, dueDate, priority, week, points } = req.body;

      if (!title || !description || !categoryId) {
        return res.status(400).json({ success: false, message: 'Title, description, and category are required' });
      }

      const task = new Task({
        title,
        description,
        category: categoryId,
        assignedTo: assignedTo || [],
        dueDate,
        priority: priority || 'medium',
        week: week || 1,
        points: points || 10,
      });

      await task.save();
      await task.populate('category', 'name');

      res.status(201).json({ success: true, data: task, message: 'Task created successfully' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Update task
  // @route PUT /api/admin/tasks/:id
  // @access Private/Admin
  exports.updateTask = async (req, res, next) => {
    try {
      const { title, description, categoryId, assignedTo, dueDate, priority, status, week, points } = req.body;

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      Object.assign(task, {
        title: title || task.title,
        description: description || task.description,
        category: categoryId || task.category,
        assignedTo: assignedTo !== undefined ? assignedTo : task.assignedTo,
        dueDate: dueDate || task.dueDate,
        priority: priority || task.priority,
        status: status || task.status,
        week: week !== undefined ? week : task.week,
        points: points !== undefined ? points : task.points,
      });

      await task.save();
      await task.populate('category', 'name');

      res.status(200).json({ success: true, data: task, message: 'Task updated successfully' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Delete task
  // @route DELETE /api/admin/tasks/:id
  // @access Private/Admin
  exports.deleteTask = async (req, res, next) => {
    try {
      const task = await Task.findByIdAndDelete(req.params.id);
      if (!task) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }

      res.status(200).json({ success: true, message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Grade / review a submission
  // @route POST /api/admin/submissions/:submissionId/grade
  // @access Private/Admin
  exports.gradeSubmission = async (req, res, next) => {
    try {
      const { status, score, notes } = req.body;
      const { submissionId } = req.params;

      if (!['grading', 'graded-passed', 'graded-failed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      const task = await Task.findOne({ 'submissions._id': submissionId });
      if (!task) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
      }

      const submission = task.submissions.id(submissionId);
      submission.status = status;
      if (score !== undefined) submission.aiResult = submission.aiResult || {};
      if (score !== undefined) submission.aiResult.score = score;
      if (notes !== undefined) submission.aiResult = submission.aiResult || {};
      if (notes !== undefined) submission.aiResult.feedback = notes;

      await task.save();

      res.status(200).json({ success: true, data: submission, message: 'Submission graded successfully' });
    } catch (error) {
      next(error);
    }
  };

  // ===============================================================
  // 8. ANALYTICS / REPORTS
  // ===============================================================

  // @desc Simple analytics summary for admin
  // @route GET /api/admin/analytics
  // @access Private/Admin
  exports.getAnalytics = async (req, res, next) => {
    try {
      const totalTasks = await Task.countDocuments();
      const totalCategories = await InternshipCategory.countDocuments();
      const totalStudents = await User.countDocuments({ role: 'intern' });

      const totalSubmissionsAgg = await Task.aggregate([
        { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
        { $count: 'count' },
      ]);

      const submissionsByStatus = await Task.aggregate([
        { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$submissions.status', count: { $sum: 1 } } },
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalTasks,
          totalCategories,
          totalStudents,
          totalSubmissions: totalSubmissionsAgg[0]?.count || 0,
          submissionsByStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ===============================================================
  // Advanced Analytics Endpoints (time-series and breakdowns)
  // ===============================================================

  // @desc Submissions over time (daily counts)
  // @route GET /api/admin/analytics/submissions-over-time
  // @access Private/Admin
  exports.getSubmissionsOverTime = async (req, res, next) => {
    try {
      const { days = 30, category } = req.query;
      const since = new Date();
      since.setDate(since.getDate() - Number(days));

      const matchTask = {};
      if (category) matchTask.categoryId = require('mongoose').Types.ObjectId(category);

      const pipeline = [
        { $match: matchTask },
        { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
        { $match: { 'submissions.submittedAt': { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissions.submittedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const rows = await Task.aggregate(pipeline);

      // Fill missing dates with zero counts
      const results = [];
      for (let i = Number(days) - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const found = rows.find(r => r._id === key);
        results.push({ date: key, count: found ? found.count : 0 });
      }

      res.status(200).json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  };

  // @desc Task completion rates - grouped by category or task
  // @route GET /api/admin/analytics/task-completion
  // @access Private/Admin
  exports.getTaskCompletionRates = async (req, res, next) => {
    try {
      const mongoose = require('mongoose');
      const { groupBy = 'category', category } = req.query; // groupBy: 'category' | 'task'

      if (groupBy === 'task') {
        const pipeline = [
          { $project: { title: 1, submissions: 1, categoryId: 1 } },
          { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
          {
            $group: {
              _id: '$_id',
              title: { $first: '$title' },
              total: { $sum: 1 },
              passed: { $sum: { $cond: [{ $in: ['$submissions.status', ['graded-passed']] }, 1, 0] } },
            },
          },
          { $project: { title: 1, total: 1, passed: 1, rate: { $cond: [{ $eq: ['$total', 0] }, 0, { $multiply: [{ $divide: ['$passed', '$total'] }, 100] }] } } },
          { $sort: { rate: -1 } },
        ];

        const data = await Task.aggregate(pipeline);
        return res.status(200).json({ success: true, data });
      }

      // grouping by category
      const match = {};
      if (category) match._id = require('mongoose').Types.ObjectId(category);

      const pipeline = [
        { $lookup: { from: 'tasks', localField: '_id', foreignField: 'categoryId', as: 'tasks' } },
        { $unwind: { path: '$tasks', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$tasks.submissions', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$_id',
            categoryName: { $first: '$name' },
            totalSubmissions: { $sum: { $cond: [{ $ifNull: ['$tasks.submissions', false] }, 1, 0] } },
            passed: { $sum: { $cond: [{ $eq: ['$tasks.submissions.status', 'graded-passed'] }, 1, 0] } },
            tasksCount: { $addToSet: '$tasks._id' },
          },
        },
        {
          $project: {
            categoryName: 1,
            totalSubmissions: 1,
            passed: 1,
            tasksCount: { $size: '$tasksCount' },
            completionRate: { $cond: [{ $eq: ['$totalSubmissions', 0] }, 0, { $multiply: [{ $divide: ['$passed', '$totalSubmissions'] }, 100] }] },
          },
        },
        { $sort: { completionRate: -1 } },
      ];

      const data = await InternshipCategory.aggregate(pipeline).allowDiskUse(true);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // @desc Category performance metrics (students, tasks, avg score)
  // @route GET /api/admin/analytics/category-performance
  // @access Private/Admin
  exports.getCategoryPerformance = async (req, res, next) => {
    try {
      const pipeline = [
        {
          $lookup: {
            from: 'tasks',
            localField: '_id',
            foreignField: 'categoryId',
            as: 'tasks',
          },
        },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'category',
            as: 'enrollments',
          },
        },
        {
          $addFields: {
            tasksCount: { $size: '$tasks' },
            studentsCount: { $size: '$enrollments' },
            avgTaskScore: {
              $avg: {
                $map: {
                  input: '$tasks',
                  as: 't',
                  in: { $avg: '$$t.submissions.aiResult.score' },
                },
              },
            },
          },
        },
        {
          $project: {
            name: 1,
            tasksCount: 1,
            studentsCount: 1,
            avgTaskScore: { $ifNull: ['$avgTaskScore', 0] },
          },
        },
      ];

      const data = await InternshipCategory.aggregate(pipeline).allowDiskUse(true);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // @desc Student progress metrics
  // @route GET /api/admin/analytics/student-progress
  // @access Private/Admin
  exports.getStudentProgress = async (req, res, next) => {
    try {
      const mongoose = require('mongoose');
      const { studentId } = req.query;
      if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

      // total submissions, passed, average score
      const tasksWithSubmissions = await Task.aggregate([
        { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
        { $match: { 'submissions.student': mongoose.Types.ObjectId(studentId) } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            passed: { $sum: { $cond: [{ $eq: ['$submissions.status', 'graded-passed'] }, 1, 0] } },
            avgScore: { $avg: '$submissions.aiResult.score' },
          },
        },
      ]);

      const progress = tasksWithSubmissions[0] || { total: 0, passed: 0, avgScore: 0 };

      // submissions over time for this student (last 60 days)
      const since = new Date();
      since.setDate(since.getDate() - 60);
      const overTime = await Task.aggregate([
        { $unwind: { path: '$submissions', preserveNullAndEmptyArrays: false } },
        { $match: { 'submissions.student': mongoose.Types.ObjectId(studentId), 'submissions.submittedAt': { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$submissions.submittedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalSubmissions: progress.total,
          passed: progress.passed,
          avgScore: progress.avgScore || 0,
          submissionsOverTime: overTime,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // ===============================================================
  // 9. SETTINGS (BASIC / READONLY)
  // ===============================================================

  // @desc Return admin settings / feature flags (DB-backed)
  // @route GET /api/admin/settings
  // @access Private/Admin
  exports.getSettings = async (req, res, next) => {
    try {
      let settings = await Settings.findOne().lean();
      if (!settings) {
        // create default settings if none exist
        const defaultSettings = {
          siteName: 'RIMP',
          maintenanceMode: false,
          version: '1.0',
          contactEmail: '',
          supportUrl: '',
          features: { exports: true, announcements: true, dripScheduling: false },
        };
        const created = await Settings.create(defaultSettings);
        settings = created.toObject();
      }

      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      next(error);
    }
  };

  // @desc Create settings (if none exist)
  // @route POST /api/admin/settings
  // @access Private/Admin
  exports.createSettings = async (req, res, next) => {
    try {
      const existing = await Settings.findOne();
      if (existing) {
        return res.status(409).json({ success: false, message: 'Settings already exist' });
      }

      const payload = req.body || {};
      const settings = await Settings.create({ ...payload, updatedBy: req.user?._id });
      res.status(201).json({ success: true, data: settings, message: 'Settings created' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Update settings (by id or single doc)
  // @route PUT /api/admin/settings/:id
  // @access Private/Admin
  exports.updateSettings = async (req, res, next) => {
    try {
      const { id } = req.params;
      let settings;
      if (id) {
        settings = await Settings.findById(id);
      } else {
        settings = await Settings.findOne();
      }

      if (!settings) return res.status(404).json({ success: false, message: 'Settings not found' });

      Object.assign(settings, { ...req.body, updatedBy: req.user?._id });
      await settings.save();

      res.status(200).json({ success: true, data: settings, message: 'Settings updated' });
    } catch (error) {
      next(error);
    }
  };

  // @desc Delete settings
  // @route DELETE /api/admin/settings/:id
  // @access Private/Admin
  exports.deleteSettings = async (req, res, next) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, message: 'Settings id is required' });

      const removed = await Settings.findByIdAndDelete(id);
      if (!removed) return res.status(404).json({ success: false, message: 'Settings not found' });

      res.status(200).json({ success: true, message: 'Settings deleted' });
    } catch (error) {
      next(error);
    }
  };

// ===============================================================
// 10. ANNOUNCEMENTS (CREATE, READ, DELETE)
// ===============================================================

// @desc Get all announcements
// @route GET /api/admin/announcements
// @access Private/Admin
exports.getAnnouncements = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    // Get Announcement collection (create if needed)
    const Announcement = require('../models/Announcement');

    const announcements = await Announcement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: announcements,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single announcement
// @route GET /api/admin/announcements/:id
// @access Private/Admin
exports.getAnnouncementDetail = async (req, res, next) => {
  try {
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findById(req.params.id).lean();

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

// @desc Create new announcement
// @route POST /api/admin/announcements
// @access Private/Admin
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, body, target = 'all', targetCategories = [], targetStudents = [] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, message: 'Body is required' });
    }
    if (!['all', 'category', 'students'].includes(target)) {
      return res.status(400).json({ success: false, message: 'Invalid target type' });
    }

    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.create({
      title: title.trim(),
      body: body.trim(),
      target,
      targetCategories: target === 'category' ? targetCategories : [],
      targetStudents: target === 'students' ? targetStudents : [],
      createdBy: req.user._id,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update announcement
// @route PUT /api/admin/announcements/:id
// @access Private/Admin
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const { title, body, target, targetCategories = [], targetStudents = [] } = req.body;

    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (title) announcement.title = title.trim();
    if (body) announcement.body = body.trim();
    if (target) {
      if (!['all', 'category', 'students'].includes(target)) {
        return res.status(400).json({ success: false, message: 'Invalid target type' });
      }
      announcement.target = target;
    }
    if (target === 'category' && targetCategories.length > 0) {
      announcement.targetCategories = targetCategories;
    }
    if (target === 'students' && targetStudents.length > 0) {
      announcement.targetStudents = targetStudents;
    }

    await announcement.save();

    res.status(200).json({
      success: true,
      data: announcement,
      message: 'Announcement updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete announcement
// @route DELETE /api/admin/announcements/:id
// @access Private/Admin
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const Announcement = require('../models/Announcement');
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ===============================================================
// 11. EXPORTS (CSV GENERATION & DOWNLOAD)
// ===============================================================

// @desc Export users as CSV
// @route GET /api/admin/exports/users
// @access Private/Admin
exports.exportUsers = async (req, res, next) => {
  try {
    const { category } = req.query;

    let query = { role: 'intern' };
    if (category) {
      const enrollments = await Enrollment.find({ category }).select('intern');
      const userIds = enrollments.map(e => e.intern);
      query._id = { $in: userIds };
    }

    const users = await User.find(query)
      .select('firstName lastName email enrollmentDate isActive stats')
      .lean();

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No users to export',
        data: [],
      });
    }

    // Generate CSV headers and rows
    const headers = ['First Name', 'Last Name', 'Email', 'Enrollment Date', 'Status', 'Tasks Completed', 'Average Score'];
    const rows = users.map(user => [
      user.firstName,
      user.lastName,
      user.email,
      new Date(user.enrollmentDate).toLocaleDateString(),
      user.isActive ? 'Active' : 'Inactive',
      user.stats?.tasksCompleted || 0,
      (user.stats?.averageScore || 0).toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.status(200).json({
      success: true,
      data: csv,
      message: 'Users exported successfully',
      filename: `users_${new Date().toISOString().split('T')[0]}.csv`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Export submissions as CSV
// @route GET /api/admin/exports/submissions
// @access Private/Admin
exports.exportSubmissions = async (req, res, next) => {
  try {
    const { status, category } = req.query;

    let categoryFilter = {};
    if (category) {
      categoryFilter = { categoryId: category };
    }

    const tasks = await Task.find(categoryFilter)
      .populate('categoryId', 'name')
      .select('title categoryId submissions')
      .lean();

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No submissions to export',
        data: [],
      });
    }

    // Flatten submissions from all tasks
    let submissions = [];
    for (const task of tasks) {
      if (task.submissions && task.submissions.length > 0) {
        for (const sub of task.submissions) {
          if (!status || sub.status === status) {
            submissions.push({
              taskTitle: task.title,
              category: task.categoryId?.name || 'N/A',
              studentId: sub.student,
              submissionDate: sub.submittedAt,
              status: sub.status,
              score: sub.aiResult?.score || 'N/A',
              feedback: sub.aiResult?.feedback || '',
            });
          }
        }
      }
    }

    // Enrich with student info
    const studentIds = [...new Set(submissions.map(s => s.studentId))];
    const students = await User.find({ _id: { $in: studentIds } })
      .select('firstName lastName email')
      .lean();
    const studentMap = {};
    students.forEach(s => {
      studentMap[s._id.toString()] = `${s.firstName} ${s.lastName}`;
    });

    const headers = ['Task Title', 'Category', 'Student Name', 'Student ID', 'Submission Date', 'Status', 'Score', 'Feedback'];
    const rows = submissions.map(sub => [
      sub.taskTitle,
      sub.category,
      studentMap[sub.studentId.toString()] || 'Unknown',
      sub.studentId.toString(),
      new Date(sub.submissionDate).toLocaleDateString(),
      sub.status,
      sub.score,
      `"${sub.feedback}"`,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.status(200).json({
      success: true,
      data: csv,
      message: 'Submissions exported successfully',
      filename: `submissions_${new Date().toISOString().split('T')[0]}.csv`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Export tasks as CSV
// @route GET /api/admin/exports/tasks
// @access Private/Admin
exports.exportTasks = async (req, res, next) => {
  try {
    const { category, priority } = req.query;

    let query = {};
    if (category) query.categoryId = category;
    if (priority) query.priority = priority;

    const tasks = await Task.find(query)
      .populate('categoryId', 'name')
      .select('title description priority week points dueDate categoryId submissions')
      .lean();

    if (tasks.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No tasks to export',
        data: [],
      });
    }

    const headers = ['Task Title', 'Category', 'Description', 'Priority', 'Week', 'Points', 'Due Date', 'Submissions Count'];
    const rows = tasks.map(task => [
      task.title,
      task.categoryId?.name || 'N/A',
      task.description.substring(0, 50),
      task.priority,
      task.week,
      task.points,
      new Date(task.dueDate).toLocaleDateString(),
      task.submissions?.length || 0,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    res.status(200).json({
      success: true,
      data: csv,
      message: 'Tasks exported successfully',
      filename: `tasks_${new Date().toISOString().split('T')[0]}.csv`,
    });
  } catch (error) {
    next(error);
  }
};
