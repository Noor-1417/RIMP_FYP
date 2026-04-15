/**
 * IMPLEMENTATION_CODE_SNIPPETS.md
 * 
 * Copy-paste ready code for common implementation scenarios
 */

# Implementation Code Snippets

## Backend Implementation

### 1. Update server.js

```javascript
const express = require('express');
const app = express();

// ... existing imports
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const authRoutes = require('./routes/authRoutes');

// ... middleware setup

// Routes
app.use('/api', authRoutes);
app.use('/api', subscriptionRoutes);  // ADD THIS LINE

// ... rest of your server setup
```

---

### 2. Example: Protect Certificate Route

Update your existing certificate routes file:

```javascript
// backend/src/routes/certificateRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPremiumAccess } = require('../middleware/subscription');
const certificateController = require('../controllers/certificateController');

// Certificate generation - ONLY for PAID premium (not trial)
router.post(
  '/generate',
  protect,
  checkPremiumAccess,  // This ensures user has paid premium
  certificateController.generateCertificate
);

// Certificate download - free for all authenticated users
router.get(
  '/:id',
  protect,
  certificateController.getCertificate
);

module.exports = router;
```

---

### 3. Example: Protect AI Features Route

```javascript
// backend/src/routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkTrialRestrictions } = require('../middleware/subscription');
const aiController = require('../controllers/aiController');

// AI project generation - Available for trial + premium
router.post(
  '/generate-project',
  protect,
  checkTrialRestrictions,  // Allows both trial and premium
  aiController.generateProject
);

// In your controller, check if trial user
router.post('/generate-project', protect, checkTrialRestrictions, async (req, res) => {
  try {
    // req.isTrialUser tells you if user is on trial
    if (req.isTrialUser) {
      const projectCount = await Project.countDocuments({ user: req.user.id });
      if (projectCount >= 1) {
        return res.status(403).json({
          success: false,
          message: 'Trial users can only create 1 project. Upgrade to premium for unlimited.',
        });
      }
    }

    // Generate project logic
    const project = await aiController.generateNewProject(req);
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
```

---

### 4. Example: Bulk Operations Route

```javascript
// backend/src/routes/gradeRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPremiumAccess } = require('../middleware/subscription');
const gradeController = require('../controllers/gradeController');

// Bulk grading - ONLY for premium users
router.post(
  '/bulk-grade',
  protect,
  checkPremiumAccess,  // Only premium
  gradeController.bulkGradeSubmissions
);

// Single grade submission - available for all authenticated
router.post(
  '/submit',
  protect,
  gradeController.submitGrade
);

module.exports = router;
```

---

### 5. Create Admin Check for Subscriptions

```javascript
// backend/src/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/auth');

// Admin only: Get all premium users
router.get(
  '/users/premium',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const premiumUsers = await User.find({
        isPremium: true,
        premiumExpiresAt: { $gt: new Date() }
      }).select('firstName lastName email isPremium planDuration premiumExpiresAt');

      res.json({
        success: true,
        data: premiumUsers,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// Admin only: Get expiring subscriptions (next 7 days)
router.get(
  '/subscriptions/expiring-soon',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const expiringUsers = await User.find({
        isPremium: true,
        premiumExpiresAt: {
          $gte: now,
          $lte: in7Days
        }
      }).select('firstName lastName email premiumExpiresAt');

      res.json({
        success: true,
        count: expiringUsers.length,
        data: expiringUsers,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;
```

---

## Frontend Implementation

### 1. Setup App.jsx with SubscriptionProvider

```javascript
// frontend/src/App.jsx
import React from 'react';
import { SubscriptionProvider } from './context/SubscriptionContext';
import Router from './pages/Router';

function App() {
  return (
    <SubscriptionProvider>
      <Router />
    </SubscriptionProvider>
  );
}

export default App;
```

---

### 2. Add Subscription Status to Dashboard

```javascript
// frontend/src/pages/StudentDashboard.jsx
import React from 'react';
import { SubscriptionStatus } from '../components/common/SubscriptionStatus';
import { useSubscription } from '../context/SubscriptionContext';

export const StudentDashboard = () => {
  const { subscription } = useSubscription();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Display subscription status prominently */}
      <div className="mb-8">
        <SubscriptionStatus />
      </div>

      {/* Show upgrade banner if trial is ending */}
      {subscription?.isTrialActive && subscription?.remainingDays <= 3 && (
        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
          <p className="text-yellow-800">
            ⏰ Your free trial ends in <strong>{subscription.remainingDays}</strong> days!
            <button className="ml-4 text-yellow-600 font-semibold hover:underline">
              Upgrade Now
            </button>
          </p>
        </div>
      )}

      {/* Rest of dashboard */}
    </div>
  );
};

export default StudentDashboard;
```

---

### 3. Protect Certificate Component

```javascript
// frontend/src/components/CertificateGenerator.jsx
import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import { PremiumFeature } from './common/PremiumFeature';
import UpgradePlanModal from './common/UpgradePlanModal';

export const CertificateGenerator = () => {
  const { subscription, isFeatureAvailable } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <PremiumFeature
      feature="certificateGeneration"
      restrictedMessage="Certificate generation is only available with a premium subscription. Upgrade to unlock this feature."
      fallback={
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-dashed border-purple-200">
          <div className="text-center">
            <h3 className="text-lg font-bold text-purple-900 mb-2">🏆 Generate Certificates</h3>
            <p className="text-purple-700 mb-6">
              {subscription?.isTrialActive
                ? 'Certificate generation is not available during trial. Upgrade to premium to generate certificates.'
                : 'Upgrade to premium to generate and issue certificates to your students.'}
            </p>
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Upgrade to Premium
            </button>
            <UpgradePlanModal
              isOpen={upgradeOpen}
              onClose={() => setUpgradeOpen(false)}
              onUpgradeSuccess={() => window.location.reload()}
            />
          </div>
        </div>
      }
    >
      {/* Certificate generation form shown only for premium users */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Generate Certificate</h3>
        {/* Your certificate form */}
      </div>
    </PremiumFeature>
  );
};

export default CertificateGenerator;
```

---

### 4. Protect AI Features with Trial Warning

```javascript
// frontend/src/components/AIProjectGenerator.jsx
import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import UpgradePlanModal from './common/UpgradePlanModal';

export const AIProjectGenerator = () => {
  const { subscription, isFeatureAvailable } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  if (!isFeatureAvailable('aiProjectGeneration')) {
    return (
      <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">🤖 AI Features Locked</h3>
        <p className="text-blue-800 text-sm mb-4">
          {subscription?.isTrialActive
            ? `AI features available during trial! You have ${subscription?.remainingDays} days remaining.`
            : 'Start your free 7-day trial to access AI features.'}
        </p>
        {!subscription?.isTrialActive && (
          <button
            onClick={() => setUpgradeOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Start Free Trial
          </button>
        )}
        <UpgradePlanModal isOpen={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {subscription?.isTrialActive && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
          ℹ️ <strong>Trial Limitation:</strong> You can create up to 1 project. Upgrade to premium for unlimited projects.
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">AI Project Generator</h3>
      {/* Your AI form */}
    </div>
  );
};

export default AIProjectGenerator;
```

---

### 5. Profile Page with Subscription Management

```javascript
// frontend/src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import UpgradePlanModal from '../components/common/UpgradePlanModal';

export const ProfilePage = () => {
  const { subscription, loading, cancelSubscription, checkAccess } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);

  if (loading) return <div>Loading...</div>;

  const handleCancel = async () => {
    if (window.confirm('Are you sure? You will lose all premium features.')) {
      await cancelSubscription();
      await checkAccess();
      setCancelConfirm(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Profile & Subscription</h1>

      {/* Subscription Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Subscription</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold capitalize">
              {subscription?.status}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              {subscription?.isTrialActive ? 'Trial Ends' : 'Expires'}
            </p>
            <p className="text-lg font-semibold">
              {subscription?.remainingDays} days
            </p>
          </div>

          {subscription?.isPremium && (
            <>
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Plan Duration</p>
                <p className="text-lg font-semibold">
                  {subscription?.planDuration} month
                  {subscription?.planDuration > 1 ? 's' : ''}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">Renewal Date</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription?.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!subscription?.isPremium && !subscription?.isTrialActive && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700"
            >
              Start Free Trial
            </button>
          )}

          {!subscription?.isPremium && subscription?.isTrialActive && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700"
            >
              Upgrade to Premium
            </button>
          )}

          {subscription?.isPremium && (
            <button
              onClick={handleCancel}
              className="px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Features Access */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Features Access</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(subscription?.features || {}).map(([feature, hasAccess]) => (
            <div
              key={feature}
              className={`p-3 rounded flex items-center ${
                hasAccess ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <span className={`mr-3 text-lg ${hasAccess ? 'text-green-600' : 'text-gray-400'}`}>
                {hasAccess ? '✓' : '✗'}
              </span>
              <span className={hasAccess ? 'text-gray-800' : 'text-gray-500'}>
                {formatFeatureName(feature)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <UpgradePlanModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgradeSuccess={() => window.location.reload()}
      />
    </div>
  );
};

const formatFeatureName = (name) => {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default ProfilePage;
```

---

### 6. Check Subscription in useEffect

```javascript
// Any component that needs subscription check
import React, { useEffect, useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';

export const MyComponent = () => {
  const { subscription, checkAccess } = useSubscription();
  const [data, setData] = useState(null);

  useEffect(() => {
    // Refresh subscription status when component mounts
    checkAccess();
  }, []);

  const handleUpgrade = () => {
    // After successful payment, refresh subscription
    checkAccess();
  };

  return (
    <div>
      {subscription?.isPremium && (
        <div>Premium feature content</div>
      )}
    </div>
  );
};

export default MyComponent;
```

---

## Testing Snippets

### Test in Browser Console

```javascript
// Check current subscription
fetch('/api/subscriptions/check-access', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log);

// Get available plans
fetch('/api/subscriptions/plans').then(r => r.json()).then(console.log);

// Start trial
fetch('/api/subscriptions/start-trial', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
}).then(r => r.json()).then(console.log);
```

---

## Environment Setup

Create `.env.local` in frontend:

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_your_key
```

Create `.env` in backend:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/rimp
JWT_SECRET=your_secret_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLIC_KEY=pk_test_your_key
```

---

## Deployment Notes

1. Update all hardcoded URLs to use environment variables
2. Use production Stripe keys in production
3. Add rate limiting to subscription endpoints
4. Enable CORS for your frontend domain
5. Add logging/monitoring for subscription events
6. Set up email notifications for trial/expiry
7. Regular backups of payment data

---

Ready to implement! Copy and paste these snippets into your code. 🚀
