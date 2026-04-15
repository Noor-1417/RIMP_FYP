/**
 * PremiumFeature.jsx
 * 
 * Wrapper component to protect premium features and show upgrade prompts
 */

import React, { useState } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import UpgradePlanModal from './UpgradePlanModal';

export const PremiumFeature = ({
  feature, // Feature name to check
  children,
  fallback, // Component to show if feature not available
  showUpgradeModal = true,
  restrictedMessage = 'This feature requires a premium subscription',
}) => {
  const { subscription, isFeatureAvailable } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const hasAccess = isFeatureAvailable(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return fallback;
  }

  return (
    <>
      <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-dashed border-blue-200">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">{restrictedMessage}</p>

          {subscription?.isTrialActive ? (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Upgrade to premium to unlock this feature. Your trial ends in{' '}
                <strong>{subscription?.remainingDays} days</strong>.
              </p>
            </div>
          ) : null}

          {showUpgradeModal && (
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 transition"
            >
              {subscription?.isTrialActive ? 'Upgrade Now' : 'Start Free Trial'}
            </button>
          )}
        </div>
      </div>

      <UpgradePlanModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        onUpgradeSuccess={() => {
          setUpgradeOpen(false);
          window.location.reload(); // Reload to refresh subscription status
        }}
      />
    </>
  );
};

export default PremiumFeature;
