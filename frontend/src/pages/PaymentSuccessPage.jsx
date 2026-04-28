import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const completePayment = async () => {
      try {
        const sessionId = searchParams.get('session_id');
        if (!sessionId) throw new Error('No session ID found');

        const response = await api.post('/categories/verify-payment', { sessionId });
        if (response.data?.success) {
          setPaymentData(response.data.data);
          toast.success('Payment confirmed! You are now enrolled.');
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Payment verification failed');
        toast.error('Failed to complete payment verification');
      } finally {
        setLoading(false);
      }
    };
    completePayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="inline-block h-14 w-14 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mb-5" />
            <p className="text-gray-300 text-lg font-medium">Processing your payment…</p>
            <p className="text-gray-500 text-sm mt-1">Please don't close this tab</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-red-700/40 max-w-md w-full text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
              className="text-6xl mb-5"
            >
              ❌
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-3">Payment Failed</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/categories')}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all"
              >
                Browse Internships
              </button>
              <button
                onClick={() => navigate('/student-progress')}
                className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      <Navbar />

      <div className="flex items-center justify-center min-h-[85vh] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          {/* Success Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-emerald-700/30 overflow-hidden shadow-2xl shadow-emerald-900/20">
            {/* Top Green Strip */}
            <div className="h-2 bg-gradient-to-r from-emerald-500 to-cyan-500" />

            <div className="p-8 text-center">
              {/* Animated Checkmark */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-900/40 border-2 border-emerald-500/60 mb-6"
              >
                <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Payment Successful!
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 mb-6"
              >
                Your enrollment is confirmed and secured.
              </motion.p>

              {/* Payment Details */}
              {paymentData && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left border border-gray-700/40 space-y-3"
                >
                  {paymentData.categoryName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Internship</span>
                      <span className="text-white font-semibold text-sm">{paymentData.categoryName}</span>
                    </div>
                  )}
                  {paymentData.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Amount Paid</span>
                      <span className="text-emerald-400 font-bold">${paymentData.amount.toFixed(2)}</span>
                    </div>
                  )}
                  {paymentData.sessionId && (
                    <div className="flex justify-between items-center border-t border-gray-700/40 pt-3">
                      <span className="text-gray-500 text-xs">Transaction</span>
                      <span className="text-gray-500 text-xs">
                        {paymentData.sessionId.substring(0, 24)}…
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Next Steps */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-cyan-900/20 rounded-xl p-4 mb-6 text-left border border-cyan-700/30"
              >
                <h3 className="font-semibold text-cyan-300 mb-2 text-sm">🚀 Next Steps</h3>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> Enrolled successfully
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">✓</span> Check your email for confirmation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400 text-xs">→</span> Generate your AI tasks to start
                  </li>
                </ul>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-3"
              >
                <button
                  onClick={() => navigate('/student-progress')}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  🎯 Go to My Dashboard
                </button>
                <button
                  onClick={() => navigate('/categories')}
                  className="w-full py-3 bg-gray-700/60 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors border border-gray-600/40"
                >
                  Browse More Internships
                </button>
              </motion.div>
            </div>
          </div>

          {/* Security note */}
          <p className="text-center text-xs text-gray-600 mt-4">
            🔒 Secured & encrypted by Stripe
          </p>
        </motion.div>
      </div>
    </div>
  );
};
