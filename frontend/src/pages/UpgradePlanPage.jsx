/**
 * UpgradePlanPage.jsx
 * 
 * Complete payment page for subscription upgrades with plan selection and checkout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';
import StripeProvider from '../../components/common/StripeProvider';
import PaymentForm from '../../components/common/PaymentForm';

const UpgradePlanPageContent = () => {
  const navigate = useNavigate();
  const { subscription, checkAccess } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState(2); // Default 2 months
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch('/api/subscriptions/plans');
        const data = await response.json();
        const premiumPlans = data.plans.filter((p) => p.id !== 'trial');
        setPlans(premiumPlans);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  // Get selected plan details
  const selectedPlanData = plans.find((p) => p.duration === selectedPlan);
  const amount = selectedPlanData ? selectedPlanData.price / 100 : 0;

  const handlePaymentSuccess = async (paymentData) => {
    setPaymentSuccess(true);

    // Refresh subscription status
    await checkAccess();

    // Show success message
    setTimeout(() => {
      // Redirect to dashboard
      navigate('/intern-dashboard');
    }, 2000);
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    setShowPaymentForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading payment options...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful! 🎉</h2>
          <p className="text-gray-600 mb-6">
            Your premium subscription has been activated. You now have access to all premium features!
          </p>
          <div className="animate-pulse text-sm text-gray-500">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-gray-600">
            Unlock all premium features and take your projects to the next level
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Plan Cards */}
          {plans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => {
                setSelectedPlan(plan.duration);
                setShowPaymentForm(true);
              }}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                selectedPlan === plan.duration && showPaymentForm
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {plan.recommended && (
                <div className="mb-3 inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                  RECOMMENDED
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-800 mb-2">{plan.name}</h3>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  ${(plan.price / 100).toFixed(2)}
                </div>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                {plan.savingsLabel && (
                  <p className="text-sm text-green-600 font-semibold mt-2">✨ {plan.savingsLabel}</p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-green-500 mr-2 font-bold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  selectedPlan === plan.duration && showPaymentForm
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                {selectedPlan === plan.duration && showPaymentForm ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>

        {/* Payment Form Section */}
        {showPaymentForm && selectedPlanData && (
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Complete Your Payment</h2>
              <p className="text-gray-600 mb-6">
                Selected: <strong>{selectedPlanData.name}</strong>
              </p>

              <PaymentForm
                planDuration={selectedPlan}
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />

              <button
                onClick={() => setShowPaymentForm(false)}
                className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition"
              >
                Back to Plan Selection
              </button>
            </div>
          </div>
        )}

        {/* Features Comparison (Optional) */}
        {!showPaymentForm && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8 mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">What You Get</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-800 mb-4">🎯 Premium Features</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ Unlimited projects</li>
                  <li>✓ AI project generation</li>
                  <li>✓ AI evaluation</li>
                  <li>✓ Certificate generation</li>
                  <li>✓ Bulk operations</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-4">💡 Included in Every Plan</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>✓ All free features</li>
                  <li>✓ Email support</li>
                  <li>✓ Flexible cancellation</li>
                  <li>✓ No hidden fees</li>
                  <li>✓ Secure payment</li>
                  <li>✓ Auto-renewal (optional)</li>
                  <li>✓ Data export</li>
                </ul>
              </div>
            </div>

            {/* FAQ */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-bold text-gray-800 mb-4">❓ Frequently Asked Questions</h3>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Can I cancel anytime?</h4>
                  <p className="text-gray-600 text-sm">
                    Yes! You can cancel your subscription anytime. Your access will continue until the end of your billing period.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">What payment methods do you accept?</h4>
                  <p className="text-gray-600 text-sm">
                    We accept all major credit and debit cards through Stripe. Your payment information is always encrypted and secure.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Can I upgrade or downgrade later?</h4>
                  <p className="text-gray-600 text-sm">
                    Yes! You can upgrade to a longer plan or downgrade whenever you want. Changes take effect at the next billing cycle.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">Do you offer refunds?</h4>
                  <p className="text-gray-600 text-sm">
                    We offer a 7-day money-back guarantee if you're not satisfied with your purchase. Just contact our support team.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Info */}
        <div className="text-center mt-12 text-sm text-gray-600">
          🔒 Your payment is securely processed by <strong>Stripe</strong>. We never store your card information.
        </div>
      </div>
    </div>
  );
};

// Main UpgradePlanPage with Stripe Provider
export const UpgradePlanPage = () => {
  return (
    <StripeProvider>
      <UpgradePlanPageContent />
    </StripeProvider>
  );
};

export default UpgradePlanPage;
