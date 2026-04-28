import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';

export const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950">
      <Navbar />

      <div className="flex items-center justify-center min-h-[85vh] px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          {/* Cancel Card */}
          <div className="bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-yellow-700/30 overflow-hidden shadow-2xl shadow-yellow-900/10">
            {/* Top Amber Strip */}
            <div className="h-2 bg-gradient-to-r from-yellow-500 to-orange-500" />

            <div className="p-8 text-center">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 120 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-900/30 border-2 border-yellow-600/50 mb-6"
              >
                <span className="text-4xl">⚠️</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-2"
              >
                Payment Cancelled
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gray-400 mb-6"
              >
                Your payment was not processed. No charges were made to your account.
              </motion.p>

              {/* Info Box */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gray-900/50 rounded-xl p-4 mb-6 text-left border border-gray-700/40"
              >
                <h3 className="font-semibold text-gray-300 mb-3 text-sm">What happened?</h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    No payment was processed or charged
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    No enrollment was created
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5">•</span>
                    You can try enrolling again anytime
                  </li>
                </ul>
              </motion.div>

              {/* Retry Tip */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
                className="bg-blue-900/20 rounded-xl p-3 mb-6 border border-blue-700/30"
              >
                <p className="text-blue-300 text-sm">
                  💡 <strong>Tip:</strong> If you had a card issue, double-check your card details and try again.
                </p>
              </motion.div>

              {/* Action Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-3"
              >
                <button
                  onClick={() => navigate('/categories')}
                  className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20"
                >
                  🔄 Try Again
                </button>
                <button
                  onClick={() => navigate('/student-progress')}
                  className="w-full py-3 bg-gray-700/60 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors border border-gray-600/40"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            </div>
          </div>

          {/* Security Note */}
          <p className="text-center text-xs text-gray-600 mt-4">
            🔒 All payment data is handled securely by Stripe
          </p>
        </motion.div>
      </div>
    </div>
  );
};
