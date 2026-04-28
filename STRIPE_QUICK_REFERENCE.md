# Stripe Integration - Quick Reference & Code Snippets

## 🚀 Quick Start (5 minutes)

### 1. Install Packages
```bash
# Backend
cd backend && npm install stripe

# Frontend
cd frontend && npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Set Environment Variables
```bash
# backend/.env
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET

# frontend/.env.local
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
```

### 3. Add Route to Router
```javascript
// src/App.jsx or router.jsx
import UpgradePlanPage from './pages/UpgradePlanPage';

<Route path="/upgrade-plan" element={<UpgradePlanPage />} />
```

### 4. Add Upgrade Button
```javascript
// Any component
<button onClick={() => navigate('/upgrade-plan')}>
  Upgrade to Premium
</button>
```

### 5. Test
- Navigate to `http://localhost:3000/upgrade-plan`
- Select a plan
- Use test card: `4242 4242 4242 4242`
- Complete payment

---

## 📋 API Reference

### Backend Endpoints

```javascript
// 1. Create Payment Intent
POST /api/subscriptions/create-payment-intent
Header: Authorization: Bearer {token}
Body: { planDuration: 1 }
Response: { clientSecret, paymentIntentId, amount, currency }

// 2. Confirm Payment
POST /api/subscriptions/confirm-payment
Header: Authorization: Bearer {token}
Body: { paymentIntentId }
Response: { success, user, subscription }

// 3. Get Public Key
GET /api/subscriptions/stripe-public-key
Response: { publicKey }
```

---

## 🎯 Frontend Components

### Wrap App with StripeProvider
```javascript
import StripeProvider from './components/common/StripeProvider';

function App() {
  return (
    <StripeProvider>
      <YourRoutes />
    </StripeProvider>
  );
}
```

### Use Payment Form Directly
```javascript
import PaymentForm from './components/common/PaymentForm';

<PaymentForm
  planDuration={2}
  amount={1.80}
  onSuccess={(data) => {
    console.log('Payment successful!', data);
    navigate('/dashboard');
  }}
  onError={(error) => {
    console.error('Payment failed:', error);
  }}
/>
```

### Use Complete Upgrade Page
```javascript
import UpgradePlanPage from './pages/UpgradePlanPage';

// Add to router or render directly
<UpgradePlanPage />
```

---

## 💳 Payment Form from Scratch

If you want to build your own payment form:

```javascript
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { api } from '../services/api';

function CustomPaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create payment intent
      const intentRes = await api.post(
        '/api/subscriptions/create-payment-intent',
        { planDuration: 2 }
      );

      const { clientSecret } = intentRes.data;

      // Step 2: Confirm with Stripe
      const confirmRes = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (confirmRes.error) throw new Error(confirmRes.error.message);

      // Step 3: Confirm with backend
      const confirmRes2 = await api.post(
        '/api/subscriptions/confirm-payment',
        { paymentIntentId: confirmRes.paymentIntent.id }
      );

      console.log('Payment successful!', confirmRes2.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay'}
      </button>
    </form>
  );
}
```

---

## 🔧 Backend Stripe Service Usage

### Create Stripe Instance
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create payment intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 180, // in cents
  currency: 'usd',
  metadata: {
    userId: 'user123',
    planDuration: 2,
  },
});
```

### Verify Payment
```javascript
const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

if (paymentIntent.status === 'succeeded') {
  // Payment is confirmed
} else {
  // Payment failed or pending
}
```

### Refund Payment
```javascript
const refund = await stripe.refunds.create({
  payment_intent: paymentIntentId,
});
```

---

## 🧨 Error Handling

```javascript
try {
  // Payment API call
} catch (error) {
  // Stripe API errors
  if (error.type === 'StripeCardError') {
    console.error('Card error:', error.message);
    // E.g., "Your card's expiration year is invalid"
  } else if (error.type === 'StripeRateLimitError') {
    console.error('Rate limit reached');
  } else if (error.type === 'StripeInvalidRequestError') {
    console.error('Invalid parameters sent to Stripe API');
  } else if (error.type === 'StripeAuthenticationError') {
    console.error('Authentication with Stripe failed');
  } else {
    console.error('Network error:', error.message);
  }
}
```

---

## 📊 Monitor Payments

```javascript
// Get all payments for user
const payments = await Payment.find({
  user: userId,
  type: 'subscription'
}).sort({ createdAt: -1 });

// Get payment stats
const stats = await Payment.aggregate([
  { $match: { type: 'subscription', status: 'completed' } },
  {
    $group: {
      _id: null,
      total: { $sum: '$amount' },
      count: { $sum: 1 },
      average: { $avg: '$amount' },
    },
  },
]);

console.log(`Total Revenue: $${stats[0].total}`);
console.log(`Transactions: ${stats[0].count}`);
console.log(`Average: $${stats[0].average.toFixed(2)}`);
```

---

## 🔐 Webhook Handling

```javascript
// Handle Stripe webhook in your backend
const sig = req.headers['stripe-signature'];
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

try {
  const event = stripe.webhooks.constructEvent(
    req.body,
    sig,
    webhookSecret
  );

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('✓ Payment succeeded:', paymentIntent.id);
      // Handle successful payment
      break;

    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      console.log('✗ Payment failed:', failedIntent.id);
      // Handle failed payment
      break;

    case 'charge.refunded':
      console.log('↩️ Charge refunded');
      // Handle refund
      break;
  }

  res.json({ received: true });
} catch (err) {
  res.status(400).send(`Webhook Error: ${err.message}`);
}
```

---

## 🧪 Testing Snippets

### Test in Browser Console
```javascript
// Get public key
fetch('/api/subscriptions/stripe-public-key')
  .then(r => r.json())
  .then(d => console.log('Public key:', d.publicKey));

// Create payment intent
fetch('/api/subscriptions/create-payment-intent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  },
  body: JSON.stringify({ planDuration: 1 })
})
  .then(r => r.json())
  .then(d => console.log('Payment intent:', d));
```

### Test with cURL
```bash
# Get public key
curl http://localhost:5000/api/subscriptions/stripe-public-key

# Create payment intent
curl -X POST http://localhost:5000/api/subscriptions/create-payment-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"planDuration": 2}'

# Confirm payment
curl -X POST http://localhost:5000/api/subscriptions/confirm-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"paymentIntentId": "pi_test_..."}'
```

---

## 📱 Component Integration Examples

### Add to Dashboard
```javascript
// pages/StudentDashboard.jsx
import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { subscription } = useSubscription();

  return (
    <div>
      {!subscription?.isPremium ? (
        <button 
          onClick={() => navigate('/upgrade-plan')}
          className="btn btn-primary"
        >
          💳 Upgrade to Premium
        </button>
      ) : (
        <p>✓ Premium Member - {subscription?.remainingDays} days remaining</p>
      )}
    </div>
  );
}
```

### Add Premium Feature Gate
```javascript
// components/CertificateGenerator.jsx
import { PremiumFeature } from './common/PremiumFeature';
import UpgradePlanModal from './common/UpgradePlanModal';

function CertificateGenerator() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <PremiumFeature
        feature="certificateGeneration"
        restrictedMessage="Upgrade to generate certificates"
        fallback={
          <button onClick={() => setShowUpgrade(true)}>
            Unlock Certificate Generation
          </button>
        }
      >
        {/* Your certificate form */}
      </PremiumFeature>

      <UpgradePlanModal
        isOpen={showUpgrade}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}
```

---

## 🎓 Environment Setup Examples

### Development
```
# backend/.env
STRIPE_PUBLIC_KEY=pk_test_51Hg8qAEL7lBwpFVr...
STRIPE_SECRET_KEY=sk_test_4eC39HqLyjWDarhtT...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnop
```

### Production
```
# backend/.env
STRIPE_PUBLIC_KEY=pk_live_51Hg8qAEL7lBwpFVr...
STRIPE_SECRET_KEY=sk_live_4eC39HqLyjWDarhtT...
STRIPE_WEBHOOK_SECRET=whsec_prod_1234567890abcdefghijklmnop
```

---

## 🐛 Debug Checklist

- [ ] Stripe packages installed? `npm list stripe`
- [ ] API keys in .env file?
- [ ] Environment variables loaded? `console.log(process.env.STRIPE_*)`
- [ ] Backend running? `http://localhost:5000`
- [ ] Frontend running? `http://localhost:3000`
- [ ] Token stored in localStorage?
- [ ] Route `/upgrade-plan` exists?
- [ ] StripeProvider wraps component?
- [ ] CardElement inside Elements provider?
- [ ] Test card correct? `4242 4242 4242 4242`

---

## 🚀 One-Liner Testing

```bash
# Start backend with Stripe CLI logging
stripe listen --forward-to localhost:5000/api/payments/webhook & npm run dev

# Test payment in browser console
(async () => {
  const res = await fetch('/api/subscriptions/create-payment-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.token}` },
    body: JSON.stringify({planDuration: 1})
  });
  console.log(await res.json());
})();
```

---

## 📞 Support Commands

```bash
# Check Stripe CLI is installed
stripe version

# Listen to events locally
stripe listen --forward-to localhost:5000/api/payments/webhook

# View recent events
stripe logs tail

# Trigger test event
stripe trigger payment_intent.succeeded

# Get API key
stripe config
```

---

## ✅ Final Verification

```javascript
// Add this to your frontend to verify setup
async function verifyStripeSetup() {
  try {
    // 1. Check public key
    const keyRes = await fetch('/api/subscriptions/stripe-public-key');
    const keyData = await keyRes.json();
    console.log('✓ Public key available:', keyData.publicKey ? 'YES' : 'NO');

    // 2. Check backend connection
    const statusRes = await fetch('/health');
    console.log('✓ Backend online:', statusRes.ok ? 'YES' : 'NO');

    // 3. Check authentication
    const token = localStorage.getItem('token');
    console.log('✓ User authenticated:', token ? 'YES' : 'NO');

    console.log('✓ Setup verified! Ready for payments.');
  } catch (err) {
    console.error('✗ Setup check failed:', err);
  }
}

// Run in browser console
verifyStripeSetup();
```

---

## 🎉 You're All Set!

Copy-paste ready code for:
✅ Setting up Stripe
✅ Creating payments
✅ Confirming payments
✅ Handling errors
✅ Testing locally
✅ Monitoring payments
✅ Webhook handling

Start accepting payments now! 💳
