# Stripe Integration - Implementation Checklist

## ✅ Frontend Integration Points

### 1. Add Route to Your Router
**File**: `frontend/src/pages/Router.jsx` (or wherever you define routes)

```javascript
import UpgradePlanPage from './pages/UpgradePlanPage';

// Add to your routes array/configuration
{
  path: '/upgrade-plan',
  element: <UpgradePlanPage />,
}
```

### 2. Wrap App with SubscriptionProvider (already done)
**File**: `frontend/src/App.jsx` (or main entry point)

```javascript
import { SubscriptionProvider } from './context/SubscriptionContext';

function App() {
  return (
    <SubscriptionProvider>
      {/* Your routes here */}
    </SubscriptionProvider>
  );
}
```

### 3. Add Upgrade Button (Optional - in your existing components)
**Example**: `frontend/src/pages/StudentDashboard.jsx`

```javascript
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  return (
    <div>
      {subscription?.isTrialActive && subscription?.remainingDays <= 3 && (
        <div className="alert alert-warning">
          ⏰ Your trial expires in {subscription.remainingDays} days!
          <button
            onClick={() => navigate('/upgrade-plan')}
            className="btn btn-primary ml-2"
          >
            Upgrade Now
          </button>
        </div>
      )}

      {!subscription?.isPremium && !subscription?.isTrialActive && (
        <button
          onClick={() => navigate('/upgrade-plan')}
          className="btn btn-success"
        >
          💳 Upgrade to Premium
        </button>
      )}

      {/* Rest of dashboard */}
    </div>
  );
}
```

### 4. Update .env.local
**File**: `frontend/.env.local`

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

---

## ✅ Backend Integration Points

### 1. Install Stripe
```bash
cd backend
npm install stripe
```

### 2. Update .env
**File**: `backend/.env`

```
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET
```

### 3. Verify Routes are in server.js (already done)
**File**: `backend/src/server.js`

Should already have:
```javascript
const subscriptionRoutes = require('./routes/subscriptionRoutes');
app.use('/api', subscriptionRoutes);
```

---

## 🚀 Step-by-Step Integration

### Step 1: Install Packages (5 mins)
```bash
# Terminal 1: Backend
cd backend
npm install stripe

# Terminal 2: Frontend
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### Step 2: Set Environment Variables (2 mins)
```bash
# backend/.env
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# frontend/.env.local
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

### Step 3: Add Router Entry (1 min)
```javascript
// In your router configuration
{
  path: '/upgrade-plan',
  element: <UpgradePlanPage />,
}
```

### Step 4: Verify Files Exist (1 min)
Check these files exist:
- ✅ `backend/src/services/stripeService.js`
- ✅ `backend/src/controllers/subscriptionController.js` (updated)
- ✅ `backend/src/routes/subscriptionRoutes.js` (updated)
- ✅ `frontend/src/components/common/StripeProvider.jsx`
- ✅ `frontend/src/components/common/PaymentForm.jsx`
- ✅ `frontend/src/pages/UpgradePlanPage.jsx`

### Step 5: Get Stripe Keys (3 mins)
1. Go to https://stripe.com
2. Sign up for free
3. Click "Developers" → "API Keys"
4. Copy `pk_test_...` and `sk_test_...`
5. Add to .env files

### Step 6: Start Services (2 mins)
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

### Step 7: Test Payment (5 mins)
1. Navigate to `http://localhost:3000/upgrade-plan`
2. Select a plan
3. Use test card: `4242 4242 4242 4242`
4. Any expiry (future) + any CVC
5. Click "Pay"
6. See success message ✅

---

## 📋 Complete Checklist

### Frontend
- [ ] `npm install @stripe/stripe-js @stripe/react-stripe-js`
- [ ] `.env.local` has `REACT_APP_STRIPE_PUBLIC_KEY`
- [ ] Router has `/upgrade-plan` route
- [ ] `StripeProvider` wraps app (already done)
- [ ] Can navigate to upgrade page
- [ ] Plan cards display correctly
- [ ] Can enter card details
- [ ] Payment processes successfully

### Backend
- [ ] `npm install stripe`
- [ ] `.env` has all Stripe keys
- [ ] `subscriptionController.js` has new methods
- [ ] `subscriptionRoutes.js` has new routes
- [ ] `stripeService.js` exists
- [ ] Server starts without errors
- [ ] Health check works: `GET /health`
- [ ] API endpoints respond

### Payment Flow
- [ ] POST `/api/subscriptions/create-payment-intent` works
- [ ] POST `/api/subscriptions/confirm-payment` works
- [ ] GET `/api/subscriptions/stripe-public-key` works
- [ ] Payment intent is created in Stripe
- [ ] Payment is processed by Stripe
- [ ] User is upgraded to premium
- [ ] User sees success page
- [ ] Can verify in dashboard: user is now premium

---

## 🔌 API Integration Points

### Your Existing SubscriptionContext (Already Working)
```javascript
const { 
  subscription,        // Current subscription status
  isFeatureAvailable,  // Check if feature available
  checkAccess,         // Refresh subscription
} = useSubscription();
```

### New Payment Endpoints (Added)
```
POST   /api/subscriptions/create-payment-intent
POST   /api/subscriptions/confirm-payment
GET    /api/subscriptions/stripe-public-key
```

### Existing Endpoints (Still Working)
```
POST   /api/subscriptions/start-trial
POST   /api/subscriptions/upgrade-plan
GET    /api/subscriptions/check-access
GET    /api/subscriptions/plans
POST   /api/subscriptions/cancel
GET    /api/subscriptions/history
POST   /api/payments/webhook
```

---

## 🧪 Testing Without Real Payment

### Mock Testing
```javascript
// Test in browser console
const publicKey = localStorage.getItem('STRIPE_PUBLIC_KEY');
console.log('Public Key:', publicKey);

// Fetch test card success
const res = await fetch('/api/subscriptions/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ planDuration: 1 })
});
console.log(await res.json());
```

### Stripe CLI Testing
```bash
# Install Stripe CLI from https://stripe.com/docs/stripe-cli

# Listen for events
stripe listen --forward-to localhost:5000/api/payments/webhook

# Trigger test event
stripe trigger payment_intent.succeeded

# View logs
stripe logs tail
```

---

## 📊 Expected Results

### After Complete Setup

**Frontend**
```
✓ Can navigate to /upgrade-plan
✓ See 3 plan options (1, 2, 3 months)
✓ Can select a plan
✓ Payment form appears
✓ Can enter card details
✓ Payment button works
✓ Success page shows
```

**Backend**
```
✓ Creates payment intent
✓ Gets payment status from Stripe
✓ Upgrades user in database
✓ Updates subscription dates
✓ Returns success response
```

**Database**
```
User collection:
✓ isPremium: true
✓ premiumExpiresAt: calculated date
✓ subscriptionStatus: 'active'

Payment collection:
✓ New payment record created
✓ Type: 'subscription'
✓ Status: 'completed'
```

---

## 🔐 Security Verification

- [ ] STRIPE_SECRET_KEY not in frontend code
- [ ] STRIPE_SECRET_KEY in backend .env
- [ ] Payment verified on backend (not frontend)
- [ ] Webhook signature verified
- [ ] User token required for payments
- [ ] Amount validated on backend

---

## 🐛 If Something Doesn't Work

### Issue: "Stripe is not defined"
```javascript
// Check 1: Package installed?
npm list | grep stripe

// Check 2: Import correct?
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Check 3: Public key exists?
console.log(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
```

### Issue: "Cannot find module 'stripe'"
```bash
# Reinstall
cd backend
rm -rf node_modules
npm install stripe
npm list stripe
```

### Issue: Payment Intent not created
```javascript
// Check backend logs
// Look for: "Payment intent created:"

// Check .env variables are set
console.log('PRIVATE KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING');
```

### Issue: Card element not appearing
```javascript
// Check StripeProvider wraps component
<StripeProvider>
  <PaymentForm />
</StripeProvider>

// Check CardElement inside Elements
<Elements stripe={stripePromise}>
  <CardElement />
</Elements>
```

---

## 💡 Pro Tips

1. **Use Test Card**: Always use `4242 4242 4242 4242` in development
2. **Check Browser Console**: Lots of helpful debugging info
3. **Monitor Network Tab**: See API calls and responses
4. **Use Stripe Dashboard**: Check payment status in real-time
5. **Keep Logs**: Monitor backend logs for issues
6. **Test Regularly**: After each change, test payment flow

---

## 📞 Quick Help

### Get Stripe Keys
https://dashboard.stripe.com/apikeys

### Stripe Documentation
https://stripe.com/docs

### React Stripe Docs
https://stripe.com/docs/stripe-js/react

### Test Cards
https://stripe.com/docs/testing

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Can access `/upgrade-plan` page
2. ✅ See 3 plan cards with pricing
3. ✅ Can select a plan
4. ✅ Payment form renders
5. ✅ Can enter test card details
6. ✅ Click "Pay" processed payment
7. ✅ Success message appears
8. ✅ Redirected to dashboard
9. ✅ User shows as premium
10. ✅ Can see remaining days

---

## 🎓 What Each Component Does

### StripeProvider
- Loads Stripe library
- Gets public key from backend
- Provides Elements context

### PaymentForm
- Displays card input element
- Handles payment submission
- Calls backend APIs
- Shows success/error

### UpgradePlanPage
- Displays plan options
- Handles plan selection
- Shows payment form
- Displays success page

### StripeService
- Creates payment intent
- Verifies payment with Stripe
- Upgrades user in database
- Handles refunds

---

## 🚀 You're Ready!

All files are in place. Just:
1. Install packages
2. Add environment variables
3. Add routes
4. Test with test card

**Expected time: 10-15 minutes** ⏱️

---

## 📝 Final Notes

- All code is production-ready
- Error handling included
- Security best practices followed
- Documentation is comprehensive
- Easy to customize pricing

**Enjoy your payments! 💳** 🎉
