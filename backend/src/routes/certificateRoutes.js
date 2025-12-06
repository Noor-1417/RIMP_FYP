const express = require('express');
const router = express.Router();
const {
  getCertificates,
  getCertificate,
  createCertificate,
  verifyCertificate,
  downloadCertificate,
  deleteCertificate,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Public route for verification
router.get('/verify/:certificateNumber', verifyCertificate);

// Protected routes
router.get('/', protect, getCertificates);
router.get('/:id', protect, getCertificate);
router.get('/:id/download', protect, downloadCertificate);

// Admin/Manager routes
router.post('/', protect, authorize('admin', 'manager'), createCertificate);
router.delete('/:id', protect, authorize('admin'), deleteCertificate);

module.exports = router;
