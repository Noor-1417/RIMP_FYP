const InternshipCategory = require('../models/InternshipCategory');
const Enrollment = require('../models/Enrollment');
const StripeService = require('../services/stripeService');

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
    const category = await InternshipCategory.findByIdAndDelete(req.params.id);

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

    // ✅ Check if category is PAID - require Stripe Checkout
    if (category.price && category.price > 0) {
      try {
        // Create Stripe Checkout session for paid enrollment
        const session = await StripeService.createCheckoutSession(
          req.user.id,
          category._id,
          category.name,
          category.price
        );

        // Return checkout URL to redirect user to Stripe Checkout
        return res.status(200).json({
          success: true,
          message: 'Checkout session created',
          checkoutUrl: session.url,
          sessionId: session.id,
        });
      } catch (stripeError) {
        return res.status(500).json({
          success: false,
          message: `Failed to create checkout session: ${stripeError.message}`,
        });
      }
    }

    // ✅ FREE Enrollment - create enrollment immediately
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

// @desc    Verify Stripe payment and create enrollment
// @route   POST /api/categories/verify-payment
// @access  Private
exports.verifyPayment = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Verify payment with Stripe
    const paymentData = await StripeService.handleCheckoutSessionCompleted(sessionId);

    if (!paymentData.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    const { userId, categoryId, amount, currency } = paymentData;

    // Fetch category details
    const category = await InternshipCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Check if already enrolled (double-check)
    const existingEnrollment = await Enrollment.findOne({
      intern: userId,
      category: categoryId,
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this internship',
      });
    }

    // Create enrollment record
    const enrollment = await Enrollment.create({
      intern: userId,
      category: categoryId,
      status: 'active',
      startDate: new Date(),
      paymentStatus: 'completed',
      sessionId: sessionId,
    });

    // Update enrolled count
    category.enrolledCount += 1;
    await category.save();

    // Auto-assign tasks for this category if marked for auto-assignment
    try {
      const Task = require('../models/Task');
      const autoTasks = await Task.find({ category: categoryId, isAutoAssigned: true });
      for (const t of autoTasks) {
        // avoid duplicates
        t.assignedTo = Array.from(new Set([...(t.assignedTo || []), userId]));
        await t.save();
      }
    } catch (autoErr) {
      console.error('Auto-assignment error:', autoErr.message || autoErr);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and enrollment created',
      data: {
        categoryName: category.name,
        amount: amount,
        currency: currency,
        sessionId: sessionId,
        enrollment: enrollment,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
};
