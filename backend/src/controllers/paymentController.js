const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');
const InternshipCategory = require('../models/InternshipCategory');
const Enrollment = require('../models/Enrollment');

// @desc    Get user payments
// @route   GET /api/payments
// @access  Private
exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let query = { user: req.user.id };
    if (status) query.status = status;

    if (req.user.role === 'admin') {
      query = {};
      if (status) query.status = status;
    }

    const payments = await Payment.find(query)
      .populate('user', 'firstName lastName email')
      .populate('category', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
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

// @desc    Create payment intent
// @route   POST /api/payments/create-intent
// @access  Private
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { categoryId, amount } = req.body;

    if (!categoryId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Category ID and amount are required',
      });
    }

    const category = await InternshipCategory.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.user.id,
        categoryId: categoryId,
      },
    });

    // Create payment record in database
    const payment = await Payment.create({
      user: req.user.id,
      category: categoryId,
      amount,
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      description: `Payment for ${category.name}`,
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Confirm payment
// @route   POST /api/payments/confirm
// @access  Private
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required',
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        message: 'Payment not successful',
        status: paymentIntent.status,
      });
    }

    // Update payment record
    const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    payment.status = 'completed';
    payment.paidAt = new Date();
    await payment.save();

    // Create enrollment
    const enrollment = await Enrollment.create({
      intern: payment.user,
      category: payment.category,
      paymentId: payment._id,
      status: 'active',
      startDate: new Date(),
    });

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: payment,
      enrollment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
exports.getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('category', 'name');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Check authorization
    if (req.user.role === 'intern' && payment.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this payment',
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Refund payment
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
exports.refundPayment = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Only completed payments can be refunded',
      });
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntentId,
      reason: 'requested_by_customer',
    });

    // Update payment record
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    payment.refundAmount = payment.amount;
    payment.refundReason = reason;
    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Handle Stripe webhooks
// @route   POST /api/payments/webhook
// @access  Public (Stripe only)
exports.handleStripeWebhook = async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';

  let event;
  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

        if (payment) {
          payment.status = 'completed';
          payment.paidAt = new Date();
          await payment.save();

          // Create enrollment
          const existing = await Enrollment.findOne({ paymentId: payment._id });
          if (!existing) {
            await Enrollment.create({
              intern: payment.user,
              category: payment.category,
              paymentId: payment._id,
              status: 'active',
              startDate: new Date(),
            });
          }

          console.log(`✓ Payment confirmed: ${paymentIntent.id}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id });

        if (payment) {
          payment.status = 'failed';
          await payment.save();
          console.log(`✗ Payment failed: ${paymentIntent.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.status(500).json({ error: err.message });
  }
};
