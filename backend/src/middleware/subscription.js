const User = require('../models/User');

/**
 * Middleware to check if user has access to premium features
 * Downgrade user if premium has expired
 */
const checkPremiumAccess = async (req, res, next) => {
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
        // Downgrade user to free
        await user.downgradeToFree();
        await user.save();
      }
    }

    // Check if user has active premium or active trial
    const hasPremiumAccess = user.hasActivePremium() || user.isOnActiveTrial();

    if (!hasPremiumAccess) {
      return res.status(403).json({
        success: false,
        message: 'Premium access required. Please upgrade your plan or start a free trial.',
        requiresUpgrade: true,
        subscriptionStatus: user.subscriptionStatus,
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Middleware to check if user has active trial
 * Used to restrict features like certificate generation during trial
 */
const checkTrialRestrictions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user is on trial, certain features are restricted
    if (user.isOnActiveTrial() && !user.isPremium) {
      // Attach trial status to request
      req.isTrialUser = true;
      req.trialEndsAt = user.trialEndsAt;
    } else {
      req.isTrialUser = false;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Helper function to check if operation is allowed for trial users
 * Returns false if trial user tries to perform premium operation
 */
const canPerformPremiumOperation = (user, operationType) => {
  const restrictedOperationsForTrial = ['generate-certificate', 'advanced-ai-features', 'bulk-operations'];

  const isTrialUser = user.isOnActiveTrial() && !user.isPremium;
  const isPremiumExpired = user.isPremium && user.premiumExpiresAt && new Date() > new Date(user.premiumExpiresAt);

  if (isTrialUser && restrictedOperationsForTrial.includes(operationType)) {
    return false;
  }

  if (isPremiumExpired) {
    return false;
  }

  return true;
};

/**
 * Middleware to check if trial user has reached project limits (1 project max during trial)
 */
const checkTrialProjectLimit = (maxProjects = 1) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (user.isOnActiveTrial() && !user.isPremium) {
        // You might need to adjust this based on your Project model
        // This is an example implementation
        // const projectCount = await Project.countDocuments({ user: user._id });

        // if (projectCount >= maxProjects) {
        //   return res.status(403).json({
        //     success: false,
        //     message: `Trial users can only create ${maxProjects} project(s). Please upgrade to premium.`,
        //     upgradePlans: [
        //       { duration: 1, price: 99 },  // example prices
        //       { duration: 2, price: 180 },
        //       { duration: 3, price: 250 },
        //     ],
        //   });
        // }
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

module.exports = {
  checkPremiumAccess,
  checkTrialRestrictions,
  canPerformPremiumOperation,
  checkTrialProjectLimit,
};
