const express = require('express');
const router = express.Router();
const {
  startTrial,
  upgradePlan,
  checkAccess,
  getPlans,
  cancelSubscription,
  getSubscriptionHistory,
  createPaymentIntent,
  confirmPayment,
  getStripePublicKey,
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/plans', getPlans);
router.get('/stripe-public-key', getStripePublicKey);

// Protected routes (require authentication)
router.post('/start-trial', protect, startTrial);
router.post('/upgrade-plan', protect, upgradePlan);
router.get('/check-access', protect, checkAccess);
router.post('/cancel', protect, cancelSubscription);
router.get('/history', protect, getSubscriptionHistory);

// Payment routes
router.post('/create-payment-intent', protect, createPaymentIntent);
router.post('/confirm-payment', protect, confirmPayment);

module.exports = router;
