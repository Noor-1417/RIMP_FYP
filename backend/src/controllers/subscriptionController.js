const User = require('../models/User');
const Payment = require('../models/Payment');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key');

/**
 * @desc    Start free trial for user
 * @route   POST /api/subscriptions/start-trial
 * @access  Private
 */
exports.startTrial = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user already used trial
    if (user.trialUsed) {
      return res.status(400).json({
        success: false,
        message: 'You have already used your free trial',
        requiresUpgrade: true,
      });
    }

    // Check if user is already on trial
    if (user.isOnActiveTrial()) {
      return res.status(400).json({
        success: false,
        message: 'You are already on active trial',
        trialEndsAt: user.trialEndsAt,
      });
    }

    // Check if user has active premium
    if (user.hasActivePremium()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active premium subscription',
      });
    }

    // Start trial
    user.startFreeTrial();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Free trial started successfully',
      trialStartsAt: user.trialStartedAt,
      trialEndsAt: user.trialEndsAt,
      trialDays: 7,
      subscriptionStatus: user.subscriptionStatus,
      features: {
        allowedProjects: 1,
        allowsCertificateGeneration: false,
        allowsAIEvaluation: true,
        allowsQuizzes: true,
        description: 'Limited access to premium features',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Upgrade user plan (after payment)
 * @route   POST /api/subscriptions/upgrade-plan
 * @access  Private
 */
exports.upgradePlan = async (req, res, next) => {
  try {
    const { planDuration, paymentMethod, paymentIntentId } = req.body;

    // Validate plan duration
    if (![1, 2, 3].includes(planDuration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan duration. Choose 1, 2, or 3 months',
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Verify payment status from Stripe
    let paymentStatus = 'pending';
    if (paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        paymentStatus = paymentIntent.status;
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    }

    // Only upgrade if payment is successful
    if (paymentStatus !== 'succeeded' && paymentStatus !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Payment not confirmed. Please complete payment before upgrading.',
      });
    }

    // Define plan pricing
    const planPricing = {
      1: { price: 99, currency: 'USD' }, // $0.99 for 1 month (test price)
      2: { price: 180, currency: 'USD' }, // $1.80 for 2 months
      3: { price: 250, currency: 'USD' }, // $2.50 for 3 months
    };

    // Upgrade to premium
    user.upgradeToPremium(planDuration);
    await user.save();

    // Create payment record
    const payment = await Payment.create({
      user: user._id,
      type: 'subscription',
      planDuration,
      amount: planPricing[planDuration].price,
      currency: planPricing[planDuration].currency,
      status: paymentStatus === 'processing' ? 'pending' : 'completed',
      paymentMethod,
      paymentIntentId,
      expiresAt: user.premiumExpiresAt,
    });

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to premium for ${planDuration} month(s)`,
      subscription: {
        isPremium: user.isPremium,
        planDuration: user.planDuration,
        expiresAt: user.premiumExpiresAt,
        subscriptionStatus: user.subscriptionStatus,
      },
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
      },
      features: {
        allowedProjects: 'Unlimited',
        allowsCertificateGeneration: true,
        allowsAIEvaluation: true,
        allowsQuizzes: true,
        description: 'Full access to all premium features',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Check user subscription status and access rights
 * @route   GET /api/subscriptions/check-access
 * @access  Private
 */
exports.checkAccess = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if premium has expired
    if (user.isPremium && user.premiumExpiresAt) {
      const now = new Date();
      if (now > new Date(user.premiumExpiresAt)) {
        await user.downgradeToFree();
        await user.save();
      }
    }

    const hasActivePremium = user.hasActivePremium();
    const isOnActiveTrial = user.isOnActiveTrial();
    const canAccessPremium = hasActivePremium || isOnActiveTrial;

    // Calculate remaining trial/premium days
    let remainingDays = 0;
    if (isOnActiveTrial) {
      const now = new Date();
      remainingDays = Math.ceil((user.trialEndsAt - now) / (1000 * 60 * 60 * 24));
    } else if (hasActivePremium) {
      const now = new Date();
      remainingDays = Math.ceil((user.premiumExpiresAt - now) / (1000 * 60 * 60 * 24));
    }

    // Define features access based on subscription status
    const features = {
      aiProjectGeneration: canAccessPremium,
      aiEvaluation: canAccessPremium,
      certificateGeneration: hasActivePremium, // Only for paid premium, NOT trial
      quizzes: true, // Always available
      uploadDocuments: true, // Always available
      unlimitedProjects: hasActivePremium, // Only for paid premium
      bulkOperations: hasActivePremium, // Only for paid premium
      advancedAnalytics: hasActivePremium, // Only for paid premium
    };

    res.status(200).json({
      success: true,
      subscription: {
        status: user.subscriptionStatus,
        isPremium: user.isPremium,
        isTrialActive: isOnActiveTrial,
        trialUsed: user.trialUsed,
        canAccessPremium,
        remainingDays: remainingDays > 0 ? remainingDays : 0,
      },
      account: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      subscription_details: {
        type: isOnActiveTrial ? 'trial' : hasActivePremium ? 'premium' : 'free',
        planDuration: user.planDuration,
        startDate: isOnActiveTrial ? user.trialStartedAt : user.premiumExpiresAt,
        expiryDate: isOnActiveTrial ? user.trialEndsAt : user.premiumExpiresAt,
      },
      features,
      upgrade: !canAccessPremium ? {
        available: true,
        message: user.trialUsed ? 'Upgrade to premium to continue using premium features' : 'Start free trial or upgrade to premium',
        plans: [
          { duration: 1, durationLabel: '1 Month', price: 99, priceLabel: '$0.99' },
          { duration: 2, durationLabel: '2 Months', price: 180, priceLabel: '$1.80', recommended: true },
          { duration: 3, durationLabel: '3 Months', price: 250, priceLabel: '$2.50' },
        ],
      } : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get subscription plans available
 * @route   GET /api/subscriptions/plans
 * @access  Public
 */
exports.getPlans = async (req, res, next) => {
  try {
    const plans = [
      {
        id: 'trial',
        name: 'Free Trial',
        duration: 7,
        durationUnit: 'days',
        price: 0,
        currency: 'USD',
        description: 'Limited access to premium features',
        features: [
          'Create up to 1 project',
          'Access to AI features',
          'Take quizzes',
          'No certificate generation',
          '7-day trial period',
        ],
        restrictions: ['Certificate generation', 'Bulk operations', 'Advanced analytics'],
        recommended: false,
      },
      {
        id: '1-month',
        name: 'Premium - 1 Month',
        duration: 1,
        durationUnit: 'month',
        price: 99,
        currency: 'USD',
        priceLabel: '$0.99',
        description: 'Full access to all features for 1 month',
        features: [
          'Unlimited projects',
          'Full AI features access',
          'Certificate generation',
          'Bulk operations',
          'Advanced analytics',
          'Email support',
        ],
        recommended: false,
      },
      {
        id: '2-months',
        name: 'Premium - 2 Months',
        duration: 2,
        durationUnit: 'months',
        price: 180,
        currency: 'USD',
        priceLabel: '$1.80',
        description: 'Full access to all features for 2 months (10% savings)',
        features: [
          'Unlimited projects',
          'Full AI features access',
          'Certificate generation',
          'Bulk operations',
          'Advanced analytics',
          'Email support',
          'Priority support',
        ],
        recommended: true,
        savingsLabel: '10% off',
      },
      {
        id: '3-months',
        name: 'Premium - 3 Months',
        duration: 3,
        durationUnit: 'months',
        price: 250,
        currency: 'USD',
        priceLabel: '$2.50',
        description: 'Full access to all features for 3 months (17% savings)',
        features: [
          'Unlimited projects',
          'Full AI features access',
          'Certificate generation',
          'Bulk operations',
          'Advanced analytics',
          'Email support',
          'Priority support',
          'Advanced reporting',
        ],
        recommended: false,
        savingsLabel: '17% off',
      },
    ];

    res.status(200).json({
      success: true,
      plans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cancel subscription
 * @route   POST /api/subscriptions/cancel
 * @access  Private
 */
exports.cancelSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isPremium) {
      return res.status(400).json({
        success: false,
        message: 'No active premium subscription to cancel',
      });
    }

    // Downgrade user
    user.downgradeToFree();
    user.subscriptionStatus = 'cancelled';
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscriptionStatus: user.subscriptionStatus,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user subscription history
 * @route   GET /api/subscriptions/history
 * @access  Private
 */
exports.getSubscriptionHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get payment history
    const payments = await Payment.find({
      user: req.user.id,
      type: 'subscription',
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      currentSubscription: {
        status: user.subscriptionStatus,
        isPremium: user.isPremium,
        isTrialActive: user.isOnActiveTrial(),
        trialUsed: user.trialUsed,
        planDuration: user.planDuration,
        startDate: user.isPremium ? user.createdAt : user.trialStartedAt,
        expiryDate: user.isPremium ? user.premiumExpiresAt : user.trialEndsAt,
      },
      paymentHistory: payments.map((payment) => ({
        id: payment._id,
        date: payment.createdAt,
        amount: payment.amount,
        currency: payment.currency,
        planDuration: payment.planDuration,
        status: payment.status,
        expiresAt: payment.expiresAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Create payment intent for subscription
 * @route   POST /api/subscriptions/create-payment-intent
 * @access  Private
 */
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { planDuration } = req.body;
    const stripeService = require('../services/stripeService');

    // Validate plan duration
    if (![1, 2, 3].includes(planDuration)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan duration. Choose 1, 2, or 3 months',
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Define pricing
    const planPricing = {
      1: 0.99, // $0.99 for 1 month (test price)
      2: 1.80, // $1.80 for 2 months
      3: 2.50, // $2.50 for 3 months
    };

    const amount = planPricing[planDuration];

    // Create payment intent using Stripe service
    const paymentIntent = await stripeService.createSubscriptionPaymentIntent(
      req.user.id,
      planDuration,
      amount
    );

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      currency: 'USD',
      planDuration: planDuration,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Confirm subscription payment
 * @route   POST /api/subscriptions/confirm-payment
 * @access  Private
 */
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const stripeService = require('../services/stripeService');

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'Payment Intent ID is required',
      });
    }

    // Confirm payment and upgrade user
    const result = await stripeService.confirmSubscriptionPayment(
      paymentIntentId,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: 'Payment successful! Your subscription has been activated.',
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get Stripe public key
 * @route   GET /api/subscriptions/stripe-public-key
 * @access  Public
 */
exports.getStripePublicKey = async (req, res, next) => {
  try {
    const stripeService = require('../services/stripeService');
    const publicKey = stripeService.getPublicKey();

    res.status(200).json({
      success: true,
      publicKey: publicKey,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
