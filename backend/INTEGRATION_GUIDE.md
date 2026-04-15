# Freemium + Paid Subscription System - Integration Guide

## Overview

This guide explains how to integrate the freemium + paid subscription system into your MERN application. The system includes:

- **Free Trial**: 7-day trial automatically started on registration
- **Premium Plans**: 1, 2, or 3-month subscription options
- **Access Control**: Middleware to protect premium routes
- **Feature Gating**: Different features available based on subscription status

---

## Backend Integration Steps

### 1. Update Your Main Server File

Add the subscription routes to your `server.js`:

```javascript
// In backend/src/server.js

const subscriptionRoutes = require('./routes/subscriptionRoutes');

// ... other routes
app.use('/api', authRoutes);
app.use('/api', subscriptionRoutes); // Add this line
app.use('/api', certificateRoutes);
// ... rest of routes
```

### 2. Protect Premium Routes

Update your existing routes to use the subscription middleware:

```javascript
// Example: Protect certificate generation route
const { protect } = require('../middleware/auth');
const { checkPremiumAccess, checkTrialRestrictions } = require('../middleware/subscription');

// Only for paid premium (not trial)
router.post('/generate-certificate',
  protect,
  checkPremiumAccess,
  certificateController.generateCertificate
);

// For trial + premium (with restrictions)
router.post('/generate-ai-project',
  protect,
  checkTrialRestrictions,
  aiController.generateProject
);
```

### 3. User Model Already Updated

The User model has been updated with these fields:

```javascript
{
  isPremium: Boolean (default: false)
  trialUsed: Boolean (default: false)
  planDuration: Number (1, 2, or 3 months, default: null)
  premiumExpiresAt: Date (default: null)
  subscriptionStatus: String (free|trial|active|expired|cancelled)
  trialStartedAt: Date
  trialEndsAt: Date
}
```

And these methods:

```javascript
user.hasActivePremium()
user.isOnActiveTrial()
user.startFreeTrial()
user.upgradeToPremium(planDuration)
user.downgradeToFree()
```

### 4. Available Middleware

**`checkPremiumAccess`**: Only allows users with active premium (paid)
```javascript
router.post('/advanced-feature', protect, checkPremiumAccess, handler);
```

**`checkTrialRestrictions`**: Allows trial + premium, attaches `req.isTrialUser`
```javascript
router.post('/feature', protect, checkTrialRestrictions, handler);
```

**`checkTrialProjectLimit(maxProjects)`**: Limit projects during trial
```javascript
router.post('/create-project', protect, checkTrialProjectLimit(1), handler);
```

---

## Backend API Endpoints

### 1. Start Free Trial
```
POST /api/subscriptions/start-trial
Headers: Authorization: Bearer {token}

Response:
{
  success: true,
  message: "Free trial started successfully",
  trialStartsAt: "2026-04-14T...",
  trialEndsAt: "2026-04-21T...",
  subscriptionStatus: "trial"
}
```

### 2. Get Available Plans
```
GET /api/subscriptions/plans

Response:
{
  success: true,
  plans: [
    {
      id: "1-month",
      name: "Premium - 1 Month",
      price: 99,
      currency: "USD",
      features: [...]
    },
    ...
  ]
}
```

### 3. Upgrade Plan (After Payment)
```
POST /api/subscriptions/upgrade-plan
Headers: Authorization: Bearer {token}
Body:
{
  planDuration: 1, // or 2, 3
  paymentMethod: "stripe",
  paymentIntentId: "pi_1234567890" // From Stripe
}

Response:
{
  success: true,
  subscription: {
    isPremium: true,
    planDuration: 1,
    expiresAt: "2026-05-14T..."
  }
}
```

### 4. Check Access
```
GET /api/subscriptions/check-access
Headers: Authorization: Bearer {token}

Response:
{
  success: true,
  subscription: {
    status: "trial",
    isPremium: false,
    isTrialActive: true,
    remainingDays: 5
  },
  features: {
    aiProjectGeneration: true,
    aiEvaluation: true,
    certificateGeneration: false,
    quizzes: true,
    unlimitedProjects: false
  }
}
```

### 5. Cancel Subscription
```
POST /api/subscriptions/cancel
Headers: Authorization: Bearer {token}

Response:
{
  success: true,
  subscriptionStatus: "cancelled"
}
```

---

## Frontend Integration Steps

### 1. Wrap App with SubscriptionProvider

```javascript
// In frontend/src/App.jsx or index.jsx

import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <SubscriptionProvider>
      {/* Your app components */}
    </SubscriptionProvider>
  );
}
```

### 2. Use Subscription Hook

```javascript
import { useSubscription } from '../context/SubscriptionContext';

function MyComponent() {
  const {
    subscription,
    loading,
    startTrial,
    upgradePlan,
    isFeatureAvailable,
    checkAccess
  } = useSubscription();

  // subscription object contains:
  // - status: 'free', 'trial', 'active', 'expired'
  // - isPremium: boolean
  // - isTrialActive: boolean
  // - remainingDays: number
  // - features: { feature_name: boolean, ... }
}
```

### 3. Display Subscription Status

```javascript
import { SubscriptionStatus } from '../components/common/SubscriptionStatus';

function Dashboard() {
  return (
    <>
      <SubscriptionStatus />
      {/* Rest of dashboard */}
    </>
  );
}
```

### 4. Protect Premium Features

```javascript
import { PremiumFeature } from '../components/common/PremiumFeature';

function CertificateGenerator() {
  return (
    <PremiumFeature
      feature="certificateGeneration"
      restrictedMessage="Certificate generation is only available with premium"
    >
      {/* Your certificate generation UI */}
    </PremiumFeature>
  );
}
```

### 5. Handle Upgrade Flow

```javascript
import { UpgradePlanModal } from '../components/common/UpgradePlanModal';

function UpgradeButton() {
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  return (
    <>
      <button onClick={() => setUpgradeOpen(true)}>
        Upgrade to Premium
      </button>

      <UpgradePlanModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgradeSuccess={() => {
          // Refresh page or update subscription context
          window.location.reload();
        }}
      />
    </>
  );
}
```

---

## Feature Access Matrix

| Feature | Free | Trial | Premium |
|---------|------|-------|---------|
| Quizzes | ✓ | ✓ | ✓ |
| Upload Documents | ✓ | ✓ | ✓ |
| AI Project Generation | ✗ | ✓* | ✓ |
| AI Evaluation | ✗ | ✓* | ✓ |
| Certificate Generation | ✗ | ✗ | ✓ |
| Create Projects | ✗ | 1 max | Unlimited |
| Bulk Operations | ✗ | ✗ | ✓ |
| Advanced Analytics | ✗ | ✗ | ✓ |

*Trial has limitations (e.g., max 1 project)

---

## Payment Integration (Stripe)

### Setup Stripe Webhook

1. Add to your `server.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe webhook handler
app.post('/api/webhooks/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    // Payment successful - user will upgrade via upgrade-plan endpoint
    console.log('Payment succeeded:', event.data.object);
  }

  res.json({received: true});
});
```

2. Add to `.env`:
```
STRIPE_PUBLIC_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Frontend Stripe Integration

```javascript
// Install: npm install @stripe/react-stripe-js @stripe/js

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from './PaymentForm';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

function CheckoutPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  );
}
```

---

## Database Queries

### Find all trial users about to expire
```javascript
const User = require('./models/User');

const expiringTrials = await User.find({
  subscriptionStatus: 'trial',
  trialEndsAt: {
    $gte: new Date(),
    $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
  }
});
```

### Find expired premium subscriptions
```javascript
const expiredPremium = await User.find({
  isPremium: true,
  premiumExpiresAt: { $lt: new Date() }
});

// Downgrade them
for (let user of expiredPremium) {
  user.downgradeToFree();
  await user.save();
}
```

---

## Common Implementation Patterns

### Pattern 1: Route with Feature Check
```javascript
router.post('/protected-feature', protect, async (req, res) => {
  const user = req.user;
  
  if (!user.hasActivePremium() && !user.isOnActiveTrial()) {
    return res.status(403).json({
      success: false,
      message: 'This feature requires a subscription'
    });
  }
  
  // Feature logic
});
```

### Pattern 2: Frontend Feature Gate
```javascript
const { isFeatureAvailable } = useSubscription();

if (!isFeatureAvailable('certificateGeneration')) {
  return <UpgradeCTA />;
}

return <Feature />;
```

### Pattern 3: Time-based Messaging
```javascript
const { subscription } = useSubscription();

if (subscription?.isTrialActive && subscription?.remainingDays <= 3) {
  return <UpgradeReminderBanner />;
}
```

---

## Testing Checklist

- [ ] User registers → trial starts automatically
- [ ] Trial user can access trial features
- [ ] Trial user cannot generate certificates
- [ ] Trial user limited to 1 project
- [ ] After payment → premium status updated
- [ ] Premium user can access all features
- [ ] Expired premium → automatically downgraded
- [ ] Can cancel subscription
- [ ] Trial user sees upgrade CTAs
- [ ] Premium features show time remaining
- [ ] Check-access endpoint returns correct features

---

## Troubleshooting

### Trial not starting on register
- Check User model `startFreeTrial()` is called in auth controller
- Verify `subscriptionStatus` field exists in schema

### Premium check not working
- Ensure `protect` middleware runs before subscription checks
- Verify `premiumExpiresAt` is set correctly after payment
- Check timezone handling if expiry times are off

### Features still accessible after downgrade
- Call `checkAccess` endpoint to refresh frontend subscription state
- Verify middleware checks `hasActivePremium()` not just `isPremium` flag

---

## Security Notes

1. **Always validate on backend** - Don't trust frontend subscription status
2. **Verify Stripe payments** - Always verify with Stripe, not just client-side
3. **Add rate limiting** - Prevent upgrade endpoint spam
4. **Audit logs** - Log all subscription changes
5. **Webhook security** - Verify Stripe signature on webhooks
6. **JWT expiry** - Token claims should include subscription info

---

## Next Steps

1. Set up Stripe account and add credentials to `.env`
2. Implement payment form component (see Stripe docs)
3. Add webhook handler for payment completion
4. Test entire flow with Stripe test cards
5. Add analytics/logging for subscription events
6. Set up cron job to check expired subscriptions daily
7. Create admin dashboard to manage subscriptions
8. Add email notifications for trial ending

---

## Files Created/Modified

### Backend Files
- ✅ `models/User.js` - Updated with subscription fields and methods
- ✅ `middleware/subscription.js` - New file with access control
- ✅ `controllers/subscriptionController.js` - New controller
- ✅ `routes/subscriptionRoutes.js` - New routes
- ✅ `controllers/authController.js` - Updated register to start trial
- 📄 `routes/ROUTE_PROTECTION_EXAMPLES.js` - Examples

### Frontend Files
- ✅ `context/SubscriptionContext.jsx` - Global subscription state
- ✅ `components/common/SubscriptionStatus.jsx` - Status display
- ✅ `components/common/UpgradePlanModal.jsx` - Upgrade modal
- ✅ `components/common/PremiumFeature.jsx` - Feature gating
- 📄 `FRONTEND_USAGE_EXAMPLES.jsx` - Usage examples

### Documentation
- 📄 `INTEGRATION_GUIDE.md` - This file

---

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [React Context API](https://react.dev/reference/react/useContext)
- [MongoDB Date Queries](https://www.mongodb.com/docs/manual/reference/operator/query/gte/)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)
