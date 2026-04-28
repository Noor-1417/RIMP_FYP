const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  submitTask,
  reviewSubmission,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getAllTasks);
router.get('/:id', protect, getTask);
router.post('/:id/submit', protect, authorize('intern'), submitTask);

// Admin/Manager routes
router.post('/', protect, authorize('admin', 'manager'), createTask);
router.put('/:id', protect, authorize('admin', 'manager'), updateTask);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteTask);
router.post('/:id/assign', protect, authorize('admin', 'manager'), assignTask);
router.post('/:id/review', protect, authorize('admin', 'manager'), reviewSubmission);

module.exports = router;
