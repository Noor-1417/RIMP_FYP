const express = require('express');
const router  = express.Router();
const {
  getCertificates,
  getCertificate,
  createCertificate,
  verifyCertificate,
  downloadCertificate,
  deleteCertificate,
  getMyCertificates,
  generateForEnrollment,
} = require('../controllers/certificateController');
const { protect, authorize } = require('../middleware/auth');

// Public — QR verification
router.get('/verify/:certificateNumber', verifyCertificate);

// Student — get own certificates (must be before /:id)
router.get('/mine', protect, getMyCertificates);

// Student — auto-generate when all tasks approved
router.post('/generate/:enrollmentId', protect, generateForEnrollment);

// General protected
router.get('/',              protect, getCertificates);
router.get('/:id',           protect, getCertificate);
router.get('/:id/download',  protect, downloadCertificate);

// Admin/Manager only
router.post('/',    protect, authorize('admin', 'manager'), createCertificate);
router.delete('/:id', protect, authorize('admin'), deleteCertificate);

module.exports = router;
