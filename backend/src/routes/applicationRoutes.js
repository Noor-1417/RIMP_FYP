const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

// Student submits application
router.post('/', protect, applicationController.createApplication);

// Admin endpoints
router.get('/', protect, authorize('admin'), applicationController.getApplications);
// Get by user (student or admin)
router.get('/user/:userId', protect, applicationController.getApplicationByUser);
router.get('/:id', protect, authorize('admin'), applicationController.getApplicationById);
router.put('/:id/status', protect, authorize('admin'), applicationController.updateApplicationStatus);
// Update application (owner or admin)
router.put('/:id', protect, applicationController.updateApplication);

module.exports = router;
