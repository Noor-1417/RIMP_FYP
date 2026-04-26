import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Card, Badge } from '../components/common/LayoutElements';
import { Button } from '../components/common/FormElements';
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

        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Verify payment with backend
        const response = await api.post('/categories/verify-payment', { sessionId });

        if (response.data?.success) {
          setPaymentData(response.data.data);
          toast.success('Payment confirmed! You are now enrolled.');
        } else {
          throw new Error('Payment verification failed');
        }
      } catch (err) {
        console.error('Payment verification error:', err);
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
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-gray-600 mt-4">Processing your payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light">
        <Navbar />
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card className="bg-red-50 border border-red-200">
              <div className="text-center">
                <div className="text-5xl mb-4">❌</div>
                <h1 className="text-2xl font-bold text-red-700 mb-4">Payment Failed</h1>
                <p className="text-red-600 mb-6">{error}</p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/categories')}
                >
                  Back to Categories
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light">
      <Navbar />

      <div className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto"
        >
          <Card className="bg-green-50 border border-green-200">
            <div className="text-center">
              {/* Success Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
                className="text-6xl mb-6"
              >
                ✓
              </motion.div>

              <h1 className="text-3xl font-bold text-green-700 mb-2">
                Payment Successful!
              </h1>
              <p className="text-green-600 mb-6">
                Your enrollment is confirmed and your payment has been processed securely.
              </p>

              {/* Payment Details */}
              {paymentData && (
                <div className="bg-white rounded-lg p-4 mb-6 text-left space-y-3">
                  {paymentData.categoryName && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Internship:</span>
                      <Badge variant="primary">{paymentData.categoryName}</Badge>
                    </div>
                  )}
                  {paymentData.amount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-bold text-green-700">
                        ${(paymentData.amount / 100).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {paymentData.sessionId && (
                    <div className="flex justify-between items-center border-t pt-3">
                      <span className="text-gray-600 text-sm">Transaction ID:</span>
                      <span className="text-xs text-gray-500 break-all">
                        {paymentData.sessionId.substring(0, 20)}...
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ You have been enrolled in the internship</li>
                  <li>✓ Check your email for confirmation</li>
                  <li>✓ Start your AI-powered internship journey</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => navigate('/ai-chatbot')}
                >
                  Start Internship with AI
                </Button>
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => navigate('/categories')}
                >
                  Browse More Internships
                </Button>
              </div>
            </div>
          </Card>

          {/* Security Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>🔒 Your payment is secure and encrypted by Stripe.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

