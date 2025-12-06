const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPaymentIntent,
  confirmPayment,
  getPayment,
  refundPayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getPayments);
router.get('/:id', protect, getPayment);
router.post('/create-intent', protect, createPaymentIntent);
router.post('/confirm', protect, confirmPayment);

// Admin routes
router.post('/:id/refund', protect, authorize('admin', 'manager'), refundPayment);

module.exports = router;
