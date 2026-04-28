const Certificate    = require('../models/Certificate');
const QRCode         = require('qrcode');
const User           = require('../models/User');
const InternshipCategory = require('../models/InternshipCategory');
const Enrollment     = require('../models/Enrollment');
const InternshipTask = require('../models/InternshipTask');

// @desc    Get all certificates
// @route   GET /api/certificates
// @access  Private
exports.getCertificates = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    let query = { intern: req.user.id };
    if (req.user.role === 'admin') {
      query = {};
    }

    const certificates = await Certificate.find(query)
      .populate('intern', 'firstName lastName email')
      .populate('category', 'name')
      .populate('manager', 'firstName lastName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ issueDate: -1 });

    const total = await Certificate.countDocuments(query);

    res.status(200).json({
      success: true,
      data: certificates,
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

// @desc    Get single certificate
// @route   GET /api/certificates/:id
// @access  Private
exports.getCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('intern', 'firstName lastName email')
      .populate('category', 'name')
      .populate('manager', 'firstName lastName');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Check authorization
    if (
      req.user.role === 'intern' &&
      certificate.intern._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this certificate',
      });
    }

    res.status(200).json({
      success: true,
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create certificate
// @route   POST /api/certificates
// @access  Private/Admin/Manager
exports.createCertificate = async (req, res, next) => {
  try {
    const {
      intern,
      category,
      grade,
      score,
      completionPercentage,
      skills,
      tasksCompleted,
      totalTasks,
      metadata,
    } = req.body;

    // Verify intern exists
    const internUser = await User.findById(intern);
    if (!internUser) {
      return res.status(404).json({
        success: false,
        message: 'Intern not found',
      });
    }

    // Verify category exists
    const categoryData = await InternshipCategory.findById(category);
    if (!categoryData) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Create certificate
    const certificate = await Certificate.create({
      intern,
      category,
      grade,
      score,
      completionPercentage,
      skills,
      tasksCompleted,
      totalTasks,
      manager: req.user.id,
      metadata,
    });

    // Generate QR Code
    const qrCodeData = {
      certificateNumber: certificate.certificateNumber,
      internName: `${internUser.firstName} ${internUser.lastName}`,
      category: categoryData.name,
      issueDate: certificate.issueDate,
      verificationUrl: `${process.env.FRONTEND_URL}/verify/${certificate.certificateNumber}`,
    };

    try {
      certificate.qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
      certificate.qrCodeUrl = `/api/certificates/${certificate._id}/qr`;
      await certificate.save();
    } catch (qrError) {
      console.error('QR Code generation error:', qrError);
    }

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify certificate
// @route   GET /api/certificates/verify/:certificateNumber
// @access  Public
exports.verifyCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findOne({
      certificateNumber: req.params.certificateNumber,
    })
      .populate('intern', 'firstName lastName')
      .populate('category', 'name')
      .populate('manager', 'firstName lastName');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate is valid',
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Download certificate
// @route   GET /api/certificates/:id/download
// @access  Private
exports.downloadCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    // Check authorization
    if (
      req.user.role === 'intern' &&
      certificate.intern.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to download this certificate',
      });
    }

    // Update download status
    certificate.isDownloaded = true;
    certificate.downloadedAt = new Date();
    await certificate.save();

    // Return certificate data (Frontend will handle PDF generation)
    res.status(200).json({
      success: true,
      message: 'Certificate download initiated',
      data: certificate,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private/Admin
exports.deleteCertificate = async (req, res, next) => {
  try {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get MY certificates (student — with enrollment info)
// @route   GET /api/certificates/mine
// @access  Private/Intern
exports.getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ intern: req.user.id })
      .populate('category', 'name icon color')
      .populate('intern', 'firstName lastName email')
      .sort({ issueDate: -1 });

    const enriched = await Promise.all(certs.map(async (c) => {
      const obj = c.toObject();
      const enrollment = await Enrollment.findOne({ intern: req.user.id, category: c.category?._id })
        .select('selectedDuration enrolledAt').lean();
      obj.enrollment = enrollment;
      return obj;
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Auto-generate certificate when all tasks are approved
// @route   POST /api/certificates/generate/:enrollmentId
// @access  Private/Intern
exports.generateForEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findById(enrollmentId).populate('category', 'name icon color topics');
    if (!enrollment) return res.status(404).json({ success: false, message: 'Enrollment not found' });
    if (enrollment.intern.toString() !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Prevent duplicate
    const existing = await Certificate.findOne({ intern: userId, category: enrollment.category._id });
    if (existing) return res.status(400).json({ success: false, message: 'Certificate already issued for this course', data: existing });

    // Get all tasks
    const tasks = await InternshipTask.find({
      $or: [
        { enrollment: enrollmentId, student: userId },
        { internshipId: enrollmentId, studentId: userId },
      ],
    }).lean();

    if (tasks.length === 0) return res.status(400).json({ success: false, message: 'No tasks found for this enrollment' });

    const unapproved = tasks.filter(t => t.status !== 'approved');
    if (unapproved.length > 0) {
      return res.status(400).json({
        success: false,
        message: `${unapproved.length} task(s) not yet approved. Complete all ${tasks.length} tasks first.`,
        pending: unapproved.length,
        total: tasks.length,
        approved: tasks.length - unapproved.length,
      });
    }

    // Calculate score & grade
    const scores = tasks.map(t => t.evaluation?.score || 0).filter(s => s > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 80;
    let grade = 'D';
    if (avgScore >= 90) grade = 'A';
    else if (avgScore >= 75) grade = 'B';
    else if (avgScore >= 60) grade = 'C';

    const internUser = await User.findById(userId).select('firstName lastName email');

    const certificate = await Certificate.create({
      intern:               userId,
      category:             enrollment.category._id,
      grade,
      score:                avgScore,
      completionPercentage: 100,
      tasksCompleted:       tasks.length,
      totalTasks:           tasks.length,
      skills:               enrollment.category?.topics || [],
      metadata: {
        internshipDuration: enrollment.selectedDuration,
        startDate:          enrollment.startDate || enrollment.enrolledAt,
        endDate:            new Date(),
        companyName:        'RIMP',
        managerName:        'RIMP AI Platform',
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${certificate.certificateNumber}`;
    try {
      certificate.qrCode = await QRCode.toDataURL(JSON.stringify({
        cert:    certificate.certificateNumber,
        student: `${internUser.firstName} ${internUser.lastName}`,
        verify:  verifyUrl,
      }));
      certificate.verificationUrl = verifyUrl;
      await certificate.save();
    } catch (_) {}

    const populated = await Certificate.findById(certificate._id)
      .populate('intern',    'firstName lastName email')
      .populate('category',  'name icon color');

    res.status(201).json({ success: true, message: '🎓 Certificate generated successfully!', data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

