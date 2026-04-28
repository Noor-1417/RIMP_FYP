const express = require('express');
const router = express.Router();
const {
  getPayments,
  createPaymentIntent,
  createCheckoutSession,
  verifySession,
  confirmPayment,
  getPayment,
  refundPayment,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/', protect, getPayments);
router.post('/create-intent', protect, createPaymentIntent);
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/verify-session', protect, verifySession);
router.post('/confirm', protect, confirmPayment);
router.get('/:id', protect, getPayment);

// Admin routes
router.post('/:id/refund', protect, authorize('admin', 'manager'), refundPayment);

module.exports = router;
