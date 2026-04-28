const express = require('express');
const router = express.Router();
const {
  getNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  adminSendNotification,
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getNotifications);
router.get('/:id', protect, getNotification);
router.put('/:id/read', protect, markAsRead);
router.put('/mark-all-read', protect, markAllAsRead);
router.delete('/:id', protect, deleteNotification);

// Admin routes
router.post('/admin-send', protect, authorize('admin'), adminSendNotification);

module.exports = router;
