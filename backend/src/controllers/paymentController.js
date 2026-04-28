const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const InternshipCategory = require('../models/InternshipCategory');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Project = require('../models/Project');
const aiService = require('../services/aiService');
const StripeService = require('../services/stripeService');

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
    console.error('getPayments error:', error.message);
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
    console.error('createPaymentIntent error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create Stripe Checkout session for internship enrollment
// @route   POST /api/payments/create-checkout-session
// @access  Private
exports.createCheckoutSession = async (req, res, next) => {
  try {
    const { internshipId, duration, studentId } = req.body;

    if (!internshipId || !duration) {
      return res.status(400).json({
        success: false,
        message: 'internshipId and duration are required',
      });
    }

    const category = await InternshipCategory.findById(internshipId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Internship category not found',
      });
    }

    const userId = studentId || req.user.id;
    const freeWeeks = category.freeDurationWeeks || 2;
    const pricePerWeek = category.pricePerWeek || 5;
    const extraWeeks = Math.max(0, duration - freeWeeks);
    const totalPrice = extraWeeks * pricePerWeek;

    if (totalPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This duration is free. Use the enrollment endpoint directly.',
      });
    }

    console.log(`💳 Creating checkout session: internship=${category.name}, duration=${duration}wks, price=$${totalPrice}`);

    const session = await StripeService.createCheckoutSession(
      userId,
      category._id,
      category.name,
      totalPrice,
      duration
    );

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify Stripe Checkout session and return status
// @route   POST /api/payments/verify-session
// @access  Private
exports.verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    console.log(`🔍 Verifying session: ${sessionId}`);

    const paymentData = await StripeService.handleCheckoutSessionCompleted(sessionId);

    if (!paymentData.success) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }

    res.status(200).json({
      success: true,
      data: paymentData,
    });
  } catch (error) {
    console.error('verifySession error:', error.message);
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
      isActive: true,
      paymentStatus: 'paid',
      enrolledAt: new Date(),
      startDate: new Date(),
    });

    // Trigger automatic AI project generation after enrollment
    try {
      const user = await User.findById(payment.user);
      if (user && enrollment) {
        const projectData = await aiService.generateInternshipProject(
          {
            skills: user.skills?.technical || [],
            field: user.field || 'General',
            interest: user.interest || '',
          },
          'General Internship'
        );

        // Create project in database
        const project = new Project({
          userId: payment.user,
          enrollmentId: enrollment._id,
          categoryId: payment.category,
          title: projectData.title,
          description: projectData.description,
          objectives: projectData.objectives,
          tools: projectData.tools,
          skills: projectData.skills,
          tasks: projectData.tasks,
          notes: projectData.notes,
          totalTasks: projectData.tasks.length,
          completedTasks: 0,
          progress: 0,
          status: 'active',
        });

        await project.save();
        console.log(`✓ AI Project auto-generated for user ${payment.user}`);
      }
    } catch (aiError) {
      console.error('Error auto-generating AI project:', aiError);
      // Don't fail payment if project generation fails
    }

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
      data: payment,
      enrollment,
    });
  } catch (error) {
    console.error('confirmPayment error:', error.message);
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
    console.error('getPayment error:', error.message);
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
    console.error('refundPayment error:', error.message);
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  // If webhook secret is configured, verify signature
  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      return res.status(400).json({
        success: false,
        message: `Webhook Error: ${err.message}`,
      });
    }
  } else {
    // No webhook secret configured — parse event from body (development only)
    console.warn('⚠️ STRIPE_WEBHOOK_SECRET not set — skipping signature verification (OK for local dev)');
    try {
      event = JSON.parse(req.body.toString());
    } catch (err) {
      console.error('Webhook parse error:', err.message);
      return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
    }
  }

  console.log(`📩 Webhook event received: ${event.type}`);

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log(`✅ Checkout session completed via webhook: ${session.id}`);

        if (session.payment_status === 'paid') {
          const { userId, categoryId, selectedDuration } = session.metadata || {};

          if (userId && categoryId) {
            // Check if enrollment already exists (created by verify-payment endpoint)
            const existingEnrollment = await Enrollment.findOne({
              intern: userId,
              category: categoryId,
            });

            if (!existingEnrollment) {
              const category = await InternshipCategory.findById(categoryId);
              const duration = parseInt(selectedDuration) || 4;
              const startDate = new Date();
              const endDate = new Date(startDate);
              endDate.setDate(endDate.getDate() + duration * 7);

              await Enrollment.create({
                intern: userId,
                category: categoryId,
                status: 'active',
                isActive: true,
                paymentStatus: 'paid',
                stripeSessionId: session.id,
                enrolledAt: new Date(),
                startDate,
                endDate,
                selectedDuration: duration,
                pricePaid: (session.amount_total || 0) / 100,
              });

              if (category) {
                category.enrolledCount += 1;
                await category.save();
              }

              console.log(`✅ Enrollment created via webhook for user ${userId}`);
            } else {
              console.log(`ℹ️ Enrollment already exists for user ${userId} in category ${categoryId}`);
            }
          }
        }
        break;
      }

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
            const enrollment = await Enrollment.create({
              intern: payment.user,
              category: payment.category,
              paymentId: payment._id,
              status: 'active',
              isActive: true,
              paymentStatus: 'paid',
              enrolledAt: new Date(),
              startDate: new Date(),
            });

            // Trigger automatic AI project generation after enrollment
            try {
              const user = await User.findById(payment.user);
              if (user && enrollment) {
                const projectData = await aiService.generateInternshipProject(
                  {
                    skills: user.skills?.technical || [],
                    field: user.field || 'General',
                    interest: user.interest || '',
                  },
                  'General Internship'
                );

                // Create project in database
                const project = new Project({
                  userId: payment.user,
                  enrollmentId: enrollment._id,
                  categoryId: payment.category,
                  title: projectData.title,
                  description: projectData.description,
                  objectives: projectData.objectives,
                  tools: projectData.tools,
                  skills: projectData.skills,
                  tasks: projectData.tasks,
                  notes: projectData.notes,
                  totalTasks: projectData.tasks.length,
                  completedTasks: 0,
                  progress: 0,
                  status: 'active',
                });

                await project.save();
                console.log(`✓ Payment confirmed and AI Project auto-generated: ${paymentIntent.id}`);
              }
            } catch (aiError) {
              console.error('Error auto-generating AI project:', aiError);
              // Log error but don't fail webhook
            }
          }
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
