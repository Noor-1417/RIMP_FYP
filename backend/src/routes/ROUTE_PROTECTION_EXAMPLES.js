/**
 * EXAMPLE: How to use subscription middleware in your backend routes
 * 
 * This file shows example implementations for protecting premium routes
 */

// ============================================
// Example 1: Certificate Generation Route
// ============================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPremiumAccess, checkTrialRestrictions, canPerformPremiumOperation } = require('../middleware/subscription');

/**
 * Certificate generation should be protected - only for paid premium users
 * NOT available during trial
 */
router.post(
  '/generate-certificate',
  protect,
  checkTrialRestrictions,
  async (req, res) => {
    try {
      const user = req.user;

      // Check if user is on trial
      if (req.isTrialUser) {
        return res.status(403).json({
          success: false,
          message: 'Certificate generation is not available during free trial.',
          requiresUpgrade: true,
          upgradeMessage: 'Upgrade to premium to generate certificates',
          trialEndsAt: req.trialEndsAt,
        });
      }

      // Check if user has active premium
      if (!user.hasActivePremium()) {
        return res.status(403).json({
          success: false,
          message: 'Premium subscription required for certificate generation',
          requiresUpgrade: true,
        });
      }

      // Proceed with certificate generation
      // ... your certificate generation logic here ...

      res.status(200).json({
        success: true,
        message: 'Certificate generated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ============================================
// Example 2: AI Project Generation Route
// ============================================

/**
 * AI features available for both trial and premium
 * But with limitations during trial (e.g., 1 project max)
 */
router.post(
  '/generate-ai-project',
  protect,
  checkTrialRestrictions,
  async (req, res) => {
    try {
      const user = req.user;

      // Check if user has access to premium features (trial or paid)
      const hasAccess = user.hasActivePremium() || user.isOnActiveTrial();
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Please start a free trial or upgrade to premium',
          requiresUpgrade: true,
        });
      }

      // Additional check for trial users - limit to 1 project
      if (req.isTrialUser) {
        // Count user's projects
        // const projectCount = await Project.countDocuments({ user: user._id });
        // if (projectCount >= 1) {
        //   return res.status(403).json({
        //     success: false,
        //     message: 'Trial users can only create 1 project. Upgrade to premium for unlimited projects.',
        //   });
        // }
      }

      // Proceed with AI project generation
      // ... your AI project logic here ...

      res.status(200).json({
        success: true,
        message: 'AI project created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ============================================
// Example 3: Bulk Operations Route
// ============================================

/**
 * Bulk operations only for paid premium users
 * NOT available during trial
 */
router.post(
  '/bulk-grade-submissions',
  protect,
  checkPremiumAccess,
  async (req, res) => {
    try {
      // checkPremiumAccess middleware ensures user has active premium

      // Proceed with bulk operations
      // ... your bulk grading logic here ...

      res.status(200).json({
        success: true,
        message: 'Bulk grading completed',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ============================================
// Example 4: Quiz Access
// ============================================

/**
 * Quizzes available for all users (free, trial, premium)
 */
router.post(
  '/submit-quiz',
  protect,
  async (req, res) => {
    try {
      const user = req.user;

      // Quizzes are available for everyone
      // No premium check needed

      // Proceed with quiz submission
      // ... your quiz logic here ...

      res.status(200).json({
        success: true,
        message: 'Quiz submitted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// ============================================
// Example 5: Basic Usage - Check Feature Access
// ============================================

/**
 * Generic helper to check if feature is accessible
 */
const isFeatureAllowed = (user, featureName) => {
  const features = {
    certificateGeneration: user.hasActivePremium(), // Only paid premium
    aiProjectGeneration: user.hasActivePremium() || user.isOnActiveTrial(), // Trial + Paid
    aiEvaluation: user.hasActivePremium() || user.isOnActiveTrial(), // Trial + Paid
    quizzes: true, // Everyone
    bulkOperations: user.hasActivePremium(), // Only paid premium
    advancedAnalytics: user.hasActivePremium(), // Only paid premium
  };

  return features[featureName] || false;
};

// ============================================
// Usage Examples in Routes
// ============================================

/**
 * Example: Feature-gated route using helper
 */
router.get('/advanced-analytics', protect, async (req, res) => {
  try {
    if (!isFeatureAllowed(req.user, 'advancedAnalytics')) {
      return res.status(403).json({
        success: false,
        message: 'Advanced analytics requires premium subscription',
        requiresUpgrade: true,
      });
    }

    // Proceed with serving analytics
    res.status(200).json({
      success: true,
      analytics: {
        /* your analytics data */
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = {
  isFeatureAllowed,
  examples: 'See this file for route protection examples',
};
