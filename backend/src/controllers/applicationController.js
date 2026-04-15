const StudentApplication = require('../models/StudentApplication');
const User = require('../models/User');

// @desc Create new student application
// @route POST /api/applications
// @access Private (student)
exports.createApplication = async (req, res, next) => {
  try {
    const payload = {
      user: req.user ? req.user._id : undefined,
      fullName: req.body.fullName || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim(),
      email: req.body.email || req.user?.email,
      phone: req.body.phone,
      address: req.body.address,
      title: req.body.title,
      summary: req.body.summary,
      education: req.body.education || [],
      experience: req.body.experience || [],
      projects: req.body.projects || [],
      certifications: req.body.certifications || [],
      skills: req.body.skills || {},
      downloadLink: req.body.downloadLink,
    };

    const app = await StudentApplication.create(payload);

    res.status(201).json({ success: true, data: app, message: 'Application submitted' });
  } catch (error) {
    next(error);
  }
};

// @desc Get all applications (admin)
// @route GET /api/applications
// @access Private/Admin
exports.getApplications = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const apps = await StudentApplication.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await StudentApplication.countDocuments();

    res.status(200).json({ success: true, data: apps, pagination: { total, page: Number(page), pageSize: Number(limit) } });
  } catch (error) {
    next(error);
  }
};

// @desc Get single application by id (admin)
// @route GET /api/applications/:id
// @access Private/Admin
exports.getApplicationById = async (req, res, next) => {
  try {
    const app = await StudentApplication.findById(req.params.id).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.status(200).json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
};

// @desc Get application by user id (student or admin)
// @route GET /api/applications/user/:userId
// @access Private (student can access own, admin can access any)
exports.getApplicationByUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;

    // allow access if admin or the requesting user
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const app = await StudentApplication.findOne({ user: userId }).lean();
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    res.status(200).json({ success: true, data: app });
  } catch (error) {
    next(error);
  }
};

// @desc Update application status (admin)
// @route PUT /api/applications/:id/status
// @access Private/Admin
exports.updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const app = await StudentApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    app.status = status;
    await app.save();

    res.status(200).json({ success: true, data: app, message: 'Status updated' });
  } catch (error) {
    next(error);
  }
};

// @desc Update application (owner or admin)
// @route PUT /api/applications/:id
// @access Private (owner or admin)
exports.updateApplication = async (req, res, next) => {
  try {
    const app = await StudentApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

    // Only admin or the owner can update
    if (req.user.role !== 'admin' && app.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const fields = ['fullName','email','phone','address','title','summary','education','experience','projects','certifications','skills','downloadLink'];
    fields.forEach(f => { if (req.body[f] !== undefined) app[f] = req.body[f]; });

    await app.save();
    res.status(200).json({ success: true, data: app, message: 'Application updated' });
  } catch (error) {
    next(error);
  }
};
