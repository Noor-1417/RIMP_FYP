/**
 * PaymentForm.jsx
 * 
 * Stripe payment form component with card element
 */

import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { api } from '../../services/api';

export const PaymentForm = ({
  planDuration,
  amount,
  onSuccess,
  onError,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Card element styling
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    setError(event.error ? event.error.message : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded');
      return;
    }

    if (!cardComplete) {
      setError('Please enter complete card information');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent on backend
      const intentResponse = await api.post('/api/subscriptions/create-payment-intent', {
        planDuration,
      });

      if (!intentResponse.success) {
        throw new Error(intentResponse.message || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId, amount: amountReturned } = intentResponse.data;

      console.log('✓ Payment intent created:', paymentIntentId);

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      
      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'Card Holder',
          },
        },
      });

      if (confirmResult.error) {
        throw new Error(confirmResult.error.message);
      }

      if (confirmResult.paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${confirmResult.paymentIntent.status}`);
      }

      console.log('✓ Payment succeeded with Stripe');

      // Step 3: Confirm payment on our backend
      const confirmResponse = await api.post('/api/subscriptions/confirm-payment', {
        paymentIntentId,
      });

      if (!confirmResponse.success) {
        throw new Error(confirmResponse.message || 'Failed to confirm payment');
      }

      console.log('✓ Payment confirmed on backend');

      // Success!
      if (onSuccess) {
        onSuccess({
          paymentIntentId,
          amount: amountReturned,
          planDuration,
          subscription: confirmResponse.data.subscription,
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      const errorMessage = err.message || 'Payment failed. Please try again.';
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Element */}
      <div className="p-3 border border-gray-300 rounded-lg bg-white">
        <CardElement
          options={cardElementOptions}
          onChange={handleCardChange}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Order Summary */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="text-gray-600">Plan Duration:</span>
          <span className="font-semibold">{planDuration} month{planDuration > 1 ? 's' : ''}</span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-semibold">Total Amount:</span>
          <span className="text-lg font-bold text-green-600">${amount.toFixed(2)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !cardComplete || !stripe}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
          loading || !cardComplete || !stripe
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            Processing Payment...
          </div>
        ) : (
          `Pay $${amount.toFixed(2)} to Upgrade`
        )}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and processed by Stripe. 🔒
      </p>
    </form>
  );
};

export default PaymentForm;
