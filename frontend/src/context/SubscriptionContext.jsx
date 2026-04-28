/**
 * SubscriptionContext.jsx
 * 
 * Global context to manage subscription state across the application
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState({
    status: 'free',
    isPremium: false,
    isTrialActive: false,
    trialUsed: false,
    canAccessPremium: false,
    remainingDays: 0,
    features: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch subscription status on mount and when needed
  const checkAccess = async () => {
    try {
      setLoading(true);
      const response = await api.get('/subscriptions/check-access');
      setSubscription(response.data.subscription);
      setError(null);
      return response.data;
    } catch (err) {
      setError(err.message);
      console.error('Error checking subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  // Start free trial
  const startTrial = async () => {
    try {
      const response = await api.post('/subscriptions/start-trial');
      setSubscription(response.data.subscription);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Upgrade to premium plan
  const upgradePlan = async (planDuration, paymentIntentId) => {
    try {
      const response = await api.post('/subscriptions/upgrade-plan', {
        planDuration,
        paymentMethod: 'stripe',
        paymentIntentId,
      });
      setSubscription(response.data.subscription);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    try {
      const response = await api.post('/subscriptions/cancel');
      setSubscription(response.data.subscription);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Check if specific feature is available
  const isFeatureAvailable = (featureName) => {
    return subscription.features?.[featureName] || false;
  };

  useEffect(() => {
    checkAccess();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        error,
        checkAccess,
        startTrial,
        upgradePlan,
        cancelSubscription,
        isFeatureAvailable,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
