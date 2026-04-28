# Stripe Payment Integration Guide

## Overview

This guide explains how to integrate Stripe payment processing for subscription upgrades in your MERN application.

---

## 🔧 Setup Instructions

### Step 1: Install Stripe Packages

**Backend:**
```bash
cd backend
npm install stripe
npm list | grep stripe  # Verify installation
```

**Frontend:**
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
npm list | grep stripe  # Verify installation
```

### Step 2: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Sign up for a Stripe account (free)
3. Click "Developers" → "API Keys"
4. Copy both keys:
   - **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Set Environment Variables

**Backend** (`.env`):
```
STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**Frontend** (`.env.local`):
```
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
```

### Step 4: Add Routes to Your Router

**Frontend** - Add to your main router:

```javascript
// src/pages/Router.jsx or your main route file
import UpgradePlanPage from './pages/UpgradePlanPage';

const routes = [
  // ... existing routes
  {
    path: '/upgrade-plan',
    element: <UpgradePlanPage />,
  },
];

export default routes;
```

### Step 5: Add Payment Link to Your App

**Add Upgrade Button in Components:**

```javascript
// In your dashboard or any component
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

function DashboardHeader() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  if (!subscription?.isPremium) {
    return (
      <button
        onClick={() => navigate('/upgrade-plan')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Upgrade to Premium
      </button>
    );
  }
  return null;
}
```

---

## 📋 Backend API Reference

### 1. Create Payment Intent
```
POST /api/subscriptions/create-payment-intent
```

**Request:**
```javascript
{
  planDuration: 1  // 1, 2, or 3
}
```

**Response:**
```javascript
{
  success: true,
  clientSecret: "pi_test_..._secret_...",
  paymentIntentId: "pi_test_...",
  amount: 0.99,
  currency: "USD",
  planDuration: 1
}
```

### 2. Confirm Payment
```
POST /api/subscriptions/confirm-payment
```

**Request:**
```javascript
{
  paymentIntentId: "pi_test_..."
}
```

**Response:**
```javascript
{
  success: true,
  message: "Payment successful! Your subscription has been activated.",
  user: { /* user data */ },
  payment: { /* payment record */ },
  subscription: {
    isPremium: true,
    planDuration: 1,
    expiresAt: "2026-05-14T..."
  }
}
```

### 3. Get Stripe Public Key
```
GET /api/subscriptions/stripe-public-key
```

**Response:**
```javascript
{
  success: true,
  publicKey: "pk_test_..."
}
```

---

## 🎯 Frontend Components

### StripeProvider

Wraps your app with Stripe context:

```javascript
import StripeProvider from './components/common/StripeProvider';

<StripeProvider>
  <YourComponent />
</StripeProvider>
```

### PaymentForm

Standalone payment form component:

```javascript
import PaymentForm from './components/common/PaymentForm';

<PaymentForm
  planDuration={2}
  amount={1.80}
  onSuccess={(data) => console.log('Payment successful!', data)}
  onError={(error) => console.error('Payment failed:', error)}
/>
```

### UpgradePlanPage

Complete subscription upgrade page with plan selection:

```javascript
import UpgradePlanPage from './pages/UpgradePlanPage';

// Use in your router
<Route path="/upgrade-plan" element={<UpgradePlanPage />} />
```

---

## 🔄 Payment Flow Diagram

```
User Visits /upgrade-plan
         ↓
[UpgradePlanPage] displays available plans
         ↓
User selects plan and clicks "Pay"
         ↓
[PaymentForm] component rendered
         ↓
User enters card details
         ↓
Frontend calls Backend: POST /api/subscriptions/create-payment-intent
         ↓
Backend creates Stripe PaymentIntent, returns clientSecret
         ↓
Frontend confirms with Stripe using clientSecret
         ↓
Stripe processes payment
         ↓
If success: Frontend calls Backend: POST /api/subscriptions/confirm-payment
         ↓
Backend verifies payment, upgrades user, returns subscription info
         ↓
Success page shown, redirects to dashboard
```

---

## 💳 Test Payment Cards

Stripe provides test cards for development:

| Card Number | CVC | Expiry | Result |
|-------------|-----|--------|--------|
| `4242 4242 4242 4242` | Any | Any future date | ✅ Success |
| `4000 0000 0000 0002` | Any | Any future date | ❌ Declined |
| `4000 0025 0000 3155` | Any | Any future date | ⚠️ Requires authentication |

---

## 🛡️ Security Considerations

### 1. Never Expose Secret Keys
❌ Don't put `STRIPE_SECRET_KEY` in frontend code
✅ Only in backend `.env`

### 2. Validate on Backend
Always verify payment on the backend, not just the frontend:

```javascript
// ✅ Correct - Backend verification
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
if (paymentIntent.status !== 'succeeded') {
  throw Error('Payment not verified');
}

// ❌ Wrong - Frontend-only verification
if (frontendPaymentStatus === 'succeeded') { } // Not secure!
```

### 3. Use HTTPS in Production
Stripe requires HTTPS for production deployments.

### 4. Implement Webhook Verification
Verify webhook signatures to ensure they're from Stripe:

```javascript
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

### 5. Store Minimal Card Data
Never store full card details yourself. Stripe handles this securely.

---

## 🔔 Webhook Setup

### 1. Get Webhook Endpoint URL
Your webhook endpoint should be:
```
https://yourdomain.com/api/payments/webhook
```

### 2. Add Webhook in Stripe Dashboard
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the signing secret (whsec_...)

### 3. Add to Environment
```
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
```

---

## 🐛 Troubleshooting

### Issue: "Stripe is not defined"
**Solution:** Make sure Stripe script is loaded and public key is correct
```javascript
const publicKey = process.env.REACT_APP_STRIPE_PUBLIC_KEY;
if (!publicKey) {
  console.error('Stripe public key not found in environment');
}
```

### Issue: "Payment intent creation failed"
**Solution:** Check:
- Backend is running
- API URL is correct (`REACT_APP_API_URL`)
- User is authenticated (token in storage)
- Stripe secret key is valid

### Issue: "Stripe webhook not working"
**Solution:**
- Verify webhook secret is correct in `.env`
- Check endpoint URL is publicly accessible
- Use Stripe CLI to test locally:
  ```bash
  stripe listen --forward-to localhost:5000/api/payments/webhook
  stripe trigger payment_intent.succeeded
  ```

### Issue: Card payment declined
**Solution:** Use Stripe test cards. Check:
- Card number is correct (use test cards from table above)
- Expiry date is in future
- CVC can be any 3 digits
- Billing zip can be any 5 digits

---

## 📱 Testing Locally

### Option 1: Use Stripe CLI

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Listen for webhooks
stripe listen --forward-to localhost:5000/api/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded

# Check logs
stripe logs tail
```

### Option 2: Test in Browser

```javascript
// Open browser console and test
fetch('http://localhost:5000/api/subscriptions/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ planDuration: 1 })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 📊 Pricing Configuration

Update pricing in `subscriptionController.js`:

```javascript
const planPricing = {
  1: 0.99,   // 1 month - $0.99
  2: 1.80,   // 2 months - $1.80
  3: 2.50,   // 3 months - $2.50
};
```

**Note:** Prices are in dollars. Stripe converts to cents automatically.

---

## 🚀 Production Deployment

### Before Going Live

1. **Switch to Live Keys**
   - Get live keys from Stripe dashboard
   - Update `.env` with live keys
   - Update `STRIPE_WEBHOOK_SECRET`

2. **Enable HTTPS**
   - Your domain requires valid SSL certificate
   - Update `FRONTEND_URL` in backend `.env`

3. **Update Webhook URL**
   - Add production webhook endpoint to Stripe dashboard
   - Example: `https://yourdomain.com/api/payments/webhook`

4. **Test Payment Flow**
   - Use real test card: `4242 4242 4242 4242`
   - Verify emails are sent
   - Check payment appears in Stripe dashboard

5. **Monitor & Log**
   ```javascript
   // Add logging
   console.log('Payment intent created:', paymentIntent.id);
   logger.info('User upgraded to premium', { userId, planDuration });
   ```

### Security Checklist
- [ ] Environment variables set correctly
- [ ] Secret keys not exposed in code
- [ ] HTTPS enabled
- [ ] Webhook secret verified
- [ ] Error handling implemented
- [ ] Payment validation on backend
- [ ] Rate limiting on payment endpoints
- [ ] Logging for audit trail

---

## 💰 Monitoring & Analytics

### Get Payment Metrics

```javascript
// In backend
const payments = await Payment.find({
  type: 'subscription',
  status: 'completed'
}).select('amount planDuration createdAt');

const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
const averageValue = totalRevenue / payments.length;
```

### View in Stripe Dashboard
- Revenue Analytics
- Payment Success Rate
- Refunds
- Customer Disputes

---

## 📞 Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Docs](https://stripe.com/docs/stripe-js/react)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Email Support](https://support.stripe.com)

---

## 🎓 Quick Reference

### Environment Variables
```bash
# Backend
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Frontend
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
```

### API Endpoints
```
POST   /api/subscriptions/create-payment-intent
POST   /api/subscriptions/confirm-payment
GET    /api/subscriptions/stripe-public-key
POST   /api/payments/webhook (Stripe only)
```

### React Components
```
StripeProvider    - Wrapper component
PaymentForm       - Card input & submission
UpgradePlanPage   - Complete upgrade flow
```

### Payment Status Flow
```
Pending → Processing → Succeeded (or Failed/Declined)
```

---

## ✅ Checklist

- [ ] Stripe packages installed
- [ ] API keys obtained
- [ ] Environment variables configured
- [ ] Backend routes added
- [ ] Frontend components integrated
- [ ] Router updated
- [ ] Test payment successful
- [ ] Webhook verified working
- [ ] Error handling tested
- [ ] Production keys ready (if deploying)

---

You're ready to accept payments! 🎉
