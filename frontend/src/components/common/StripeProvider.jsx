/**
 * StripeProvider.jsx
 * 
 * Wrapper component that provides Stripe Elements context to child components
 */

import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { api } from '../services/api';

let stripePromise;

export const StripeProvider = ({ children }) => {
  const [stripeReady, setStripeReady] = useState(false);

  useEffect(() => {
    const initStripe = async () => {
      try {
        // Fetch public key from backend
        const response = await api.get('/api/subscriptions/stripe-public-key');
        const { publicKey } = response.data;

        // Load Stripe
        stripePromise = loadStripe(publicKey);
        setStripeReady(true);
      } catch (error) {
        console.error('Failed to load Stripe:', error);
      }
    };

    initStripe();
  }, []);

  if (!stripeReady) {
    return <div className="p-4 text-center">Loading payment system...</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider;
