const Certificate = require('../models/Certificate');
const QRCode = require('qrcode');
const User = require('../models/User');
const InternshipCategory = require('../models/InternshipCategory');

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
    const certificate = await Certificate.findByIdAndRemove(req.params.id);

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
