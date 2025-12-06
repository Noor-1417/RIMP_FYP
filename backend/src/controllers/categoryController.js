const InternshipCategory = require('../models/InternshipCategory');
const Enrollment = require('../models/Enrollment');

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getAllCategories = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, difficulty, industry } = req.query;

    let query = { isActive: true };

    if (difficulty) query.difficulty = difficulty;
    if (industry) query.industry = industry;

    const categories = await InternshipCategory.find(query)
      .populate('manager', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await InternshipCategory.countDocuments(query);

    res.status(200).json({
      success: true,
      data: categories,
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

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res, next) => {
  try {
    const category = await InternshipCategory.findById(req.params.id).populate(
      'manager',
      'firstName lastName email'
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create category (Admin only)
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res, next) => {
  try {
    const {
      name,
      description,
      icon,
      color,
      image,
      industry,
      duration,
      difficulty,
      price,
      capacity,
      prerequisites,
      learningOutcomes,
      topics,
      dripContentEnabled,
      dripFrequency,
    } = req.body;

    const category = await InternshipCategory.create({
      name,
      description,
      icon,
      color,
      image,
      industry,
      duration,
      difficulty,
      price,
      capacity,
      prerequisites,
      learningOutcomes,
      topics,
      dripContentEnabled,
      dripFrequency,
      manager: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update category (Admin only)
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res, next) => {
  try {
    let category = await InternshipCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    category = await InternshipCategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete category (Admin only)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await InternshipCategory.findByIdAndRemove(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Enroll in category
// @route   POST /api/categories/:id/enroll
// @access  Private
exports.enrollCategory = async (req, res, next) => {
  try {
    const category = await InternshipCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      intern: req.user.id,
      category: req.params.id,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this internship',
      });
    }

    // Check capacity
    if (category.enrolledCount >= category.capacity) {
      return res.status(400).json({
        success: false,
        message: 'This internship is at full capacity',
      });
    }

    const enrollment = await Enrollment.create({
      intern: req.user.id,
      category: req.params.id,
      status: 'active',
      startDate: new Date(),
    });

    // Update enrolled count
    category.enrolledCount += 1;
    await category.save();
    
    // Auto-assign tasks for this category if tasks are marked for auto-assignment
    try {
      const Task = require('../models/Task');
      const autoTasks = await Task.find({ category: req.params.id, isAutoAssigned: true });
      for (const t of autoTasks) {
        // avoid duplicates
        t.assignedTo = Array.from(new Set([...(t.assignedTo || []), req.user.id]));
        await t.save();
      }
    } catch (autoErr) {
      console.error('Auto-assignment error:', autoErr.message || autoErr);
    }

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      data: enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
