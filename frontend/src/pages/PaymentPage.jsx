import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Navbar } from '../components/layout/Navbar';
import { categoryService, paymentService } from '../services';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#e2e8f0',
      fontFamily: '"Inter", sans-serif',
      '::placeholder': { color: '#64748b' },
      backgroundColor: 'transparent',
    },
    invalid: { color: '#f87171' },
  },
};

const CheckoutForm = ({ amount, categoryId, categoryName, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', cardholderName: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) { toast.error('Stripe is still loading.'); return; }
    if (!amount || amount <= 0) { toast.error('Invalid payment amount.'); return; }

    try {
      setIsLoading(true);
      const intentResponse = await paymentService.createIntent({ categoryId, amount });
      const result = await stripe.confirmCardPayment(intentResponse.data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: formData.cardholderName, email: formData.email },
        },
      });

      if (result.error) { toast.error(result.error.message || 'Payment failed'); return; }
      if (result.paymentIntent?.status === 'succeeded') {
        await paymentService.confirmPayment({ paymentIntentId: result.paymentIntent.id });
        toast.success('Payment successful!');
        onSuccess();
      } else {
        toast.error('Payment could not be completed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Cardholder Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Cardholder Name</label>
        <input
          name="cardholderName"
          placeholder="Full name on card"
          value={formData.cardholderName}
          onChange={handleChange}
          required
          className="w-full bg-gray-800/80 border border-gray-600/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
        <input
          name="email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full bg-gray-800/80 border border-gray-600/60 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
        />
      </div>

      {/* Card Details */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Card Details</label>
        <div className="bg-gray-800/80 border border-gray-600/60 rounded-xl px-4 py-4 focus-within:border-cyan-500 transition-all">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {/* Security Badge */}
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-800/40 rounded-lg px-3 py-2 border border-gray-700/40">
        <span>🔒</span>
        <span>Your payment is secured and encrypted by Stripe. We never store your card details.</span>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>💳 Pay ${amount.toFixed(2)}</>
        )}
      </button>
    </form>
  );
};

export const PaymentPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategory = async () => {
      setLoading(true);
      setError('');
      if (!categoryId) { setError('Invalid payment category.'); setLoading(false); return; }
      try {
        const response = await categoryService.getById(categoryId);
        setCategory(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load category details.');
      } finally {
        setLoading(false);
      }
    };
    loadCategory();
  }, [categoryId]);

  const amount = Number(category?.price || 0);
  const categoryName = category?.name || 'Internship Package';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-4" />
            <p className="text-gray-400">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-red-700/40 max-w-md w-full text-center"
          >
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-3">Payment Error</h2>
            <p className="text-gray-400 mb-6">{error || 'Category not found.'}</p>
            <button
              onClick={() => navigate('/categories')}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition-colors"
            >
              Back to Internships
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* Left — Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 sticky top-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
                Order Summary
              </h3>

              {/* Category */}
              <div className="flex items-start gap-3 mb-5 pb-5 border-b border-gray-700/50">
                <span className="text-3xl">{category.icon || '🎓'}</span>
                <div>
                  <h4 className="font-semibold text-white">{categoryName}</h4>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {category.duration || 8} weeks internship
                  </p>
                  <span className="inline-block mt-1 text-xs bg-cyan-900/40 text-cyan-300 border border-cyan-700/40 px-2 py-0.5 rounded-full capitalize">
                    {category.difficulty || 'intermediate'}
                  </span>
                </div>
              </div>

              {/* What's included */}
              <div className="space-y-2 mb-5">
                {[
                  '✅ AI-personalized tasks',
                  '✅ Instant AI evaluation',
                  '✅ Mentor chatbot access',
                  '✅ Completion certificate',
                ].map((item) => (
                  <div key={item} className="text-sm text-gray-300">{item}</div>
                ))}
              </div>

              {/* Total */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/40">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Total</span>
                  <span className="text-3xl font-bold text-white">
                    ${amount.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">One-time payment, no recurring charges</p>
              </div>
            </div>
          </div>

          {/* Right — Checkout Form */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <h2 className="text-2xl font-bold text-white mb-2">Complete Payment</h2>
              <p className="text-gray-400 mb-8 text-sm">
                Enroll in <strong className="text-cyan-400">{categoryName}</strong> and start your AI-powered internship.
              </p>

              <Elements stripe={stripePromise}>
                <CheckoutForm
                  amount={amount}
                  categoryId={categoryId}
                  categoryName={categoryName}
                  onSuccess={() => navigate('/payment-success')}
                />
              </Elements>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
