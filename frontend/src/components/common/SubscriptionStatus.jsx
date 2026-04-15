/**
 * SubscriptionStatus.jsx
 * 
 * Component to display current subscription status and user plan details
 */

import React, { useEffect, useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';

export const SubscriptionStatus = () => {
  const { subscription, loading } = useSubscription();
  const [displayInfo, setDisplayInfo] = useState({});

  useEffect(() => {
    if (!subscription) return;

    // Format the display information
    const info = {
      status: subscription.status,
      isPremium: subscription.isPremium,
      isTrialActive: subscription.isTrialActive,
      remainingDays: subscription.remainingDays,
      subscriptionType: subscription.isTrialActive
        ? `Free Trial (${subscription.remainingDays} days remaining)`
        : subscription.isPremium
        ? `Premium (${subscription.planDuration} month${subscription.planDuration > 1 ? 's' : ''})`
        : 'Free Plan',
    };
    setDisplayInfo(info);
  }, [subscription]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Loading subscription info...</p>
      </div>
    );
  }

  const getStatusColor = () => {
    if (subscription?.isTrialActive) return 'bg-blue-50 border-blue-200';
    if (subscription?.isPremium) return 'bg-green-50 border-green-200';
    return 'bg-gray-50 border-gray-200';
  };

  const getStatusBadgeColor = () => {
    if (subscription?.isTrialActive) return 'bg-blue-100 text-blue-800';
    if (subscription?.isPremium) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800 mb-1">Subscription Status</h3>
          <p className="text-sm text-gray-600">{displayInfo.subscriptionType}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor()}`}>
          {subscription?.status?.toUpperCase()}
        </span>
      </div>

      {subscription?.remainingDays > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-sm text-gray-600">
            {subscription?.remainingDays} day{subscription?.remainingDays !== 1 ? 's' : ''} remaining
          </p>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;
