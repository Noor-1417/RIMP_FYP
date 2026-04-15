/**
 * FRONTEND_USAGE_EXAMPLES.jsx
 * 
 * Examples showing how to use subscription context and components
 * in your existing React components
 */

// ============================================
// Example 1: Using SubscriptionProvider Wrapper
// ============================================

import React from 'react';
import { SubscriptionProvider } from '../context/SubscriptionContext';
import { PremiumFeature } from '../components/common/PremiumFeature';
import { SubscriptionStatus } from '../components/common/SubscriptionStatus';
import UpgradePlanModal from '../components/common/UpgradePlanModal';

// Wrap your App or main component with SubscriptionProvider
export const App = () => {
  return (
    <SubscriptionProvider>
      <YourAppContent />
    </SubscriptionProvider>
  );
};

// ============================================
// Example 2: Display Subscription Status
// ============================================

export const Dashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Show subscription status at the top */}
      <div className="mb-8">
        <SubscriptionStatus />
      </div>

      {/* Rest of dashboard content */}
    </div>
  );
};

// ============================================
// Example 3: Protect Certificate Generation Feature
// ============================================

export const CertificateSection = () => {
  const { subscription, isFeatureAvailable } = useSubscription();

  return (
    <PremiumFeature
      feature="certificateGeneration"
      restrictedMessage="Certificate generation is only available with premium subscription"
    >
      <div className="p-6 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Generate Certificate</h3>

        {/* Certificate generation form */}
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Generate Certificate
        </button>
      </div>
    </PremiumFeature>
  );
};

// ============================================
// Example 4: Protect AI Features with Trial Awareness
// ============================================

export const AIProjectGenerator = () => {
  const { subscription, isFeatureAvailable } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  const canGenerateProjects = isFeatureAvailable('aiProjectGeneration');

  if (!canGenerateProjects) {
    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <h3 className="font-semibold text-amber-900 mb-2">AI Features Locked</h3>
        <p className="text-amber-800 mb-4">
          {subscription?.isTrialActive
            ? `You have ${subscription?.remainingDays} days of free trial. Upgrade to continue using AI features after trial ends.`
            : 'Start a free trial to access AI features.'}
        </p>
        <button
          onClick={() => setUpgradeOpen(true)}
          className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
        >
          {subscription?.trialUsed ? 'Upgrade Now' : 'Start Free Trial'}
        </button>

        <UpgradePlanModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          onUpgradeSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">AI Project Generator</h3>

      {subscription?.isTrialActive && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          ℹ️ You can create 1 project during trial. Upgrade for unlimited projects.
        </div>
      )}

      {/* AI Project form */}
      <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
        Generate Project
      </button>
    </div>
  );
};

// ============================================
// Example 5: Manual Subscription Check in Component
// ============================================

export const QuizPage = () => {
  const { subscription, isFeatureAvailable } = useSubscription();

  const handleQuizSubmit = async (quizData) => {
    // Quizzes are available for everyone
    if (!isFeatureAvailable('quizzes')) {
      throw new Error('Quiz feature not available');
    }

    // Submit quiz logic
    try {
      const response = await api.post('/api/quizzes/submit', quizData);
      return response;
    } catch (error) {
      console.error('Quiz submission failed:', error);
      throw error;
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Quiz</h2>

      {/* Quiz content - always shown since quizzes are free */}
      <div className="bg-white p-6 rounded-lg shadow">
        {/* Quiz form */}
      </div>
    </div>
  );
};

// ============================================
// Example 6: Profile Page with Subscription Info
// ============================================

export const ProfilePage = () => {
  const { subscription, loading, checkAccess, cancelSubscription } = useSubscription();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Profile & Subscription</h1>

      {/* Subscription Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Subscription Information</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Status</p>
            <p className="text-lg font-semibold capitalize">
              {subscription?.status || 'Free'}
            </p>
          </div>

          {subscription?.isTrialActive && (
            <div>
              <p className="text-gray-600 text-sm">Trial Expires</p>
              <p className="text-lg font-semibold">{subscription?.remainingDays} days</p>
            </div>
          )}

          {subscription?.isPremium && (
            <>
              <div>
                <p className="text-gray-600 text-sm">Plan Duration</p>
                <p className="text-lg font-semibold">
                  {subscription?.planDuration} month
                  {subscription?.planDuration > 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Expires</p>
                <p className="text-lg font-semibold">
                  {new Date(subscription?.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!subscription?.isPremium && (
            <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Upgrade to Premium
            </button>
          )}

          {subscription?.isPremium && (
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to cancel your subscription?')) {
                  await cancelSubscription();
                  await checkAccess();
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel Subscription
            </button>
          )}

          <button
            onClick={checkAccess}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Features Access */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Available Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(subscription?.features || {}).map(([feature, hasAccess]) => (
            <div key={feature} className="flex items-center p-3 bg-gray-50 rounded">
              <span className={`mr-3 ${hasAccess ? 'text-green-500' : 'text-gray-400'}`}>
                {hasAccess ? '✓' : '✗'}
              </span>
              <span className={hasAccess ? 'text-gray-800' : 'text-gray-500'}>
                {formatFeatureName(feature)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Example 7: Landing Page with Trial CTA
// ============================================

export const LandingPage = () => {
  const { subscription } = useSubscription();
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center mb-6">Welcome to Our Platform</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          {subscription?.isPremium
            ? 'You have full access to all premium features'
            : subscription?.isTrialActive
            ? `Enjoy your free trial! ${subscription?.remainingDays} days remaining`
            : 'Start your free 7-day trial today'}
        </p>

        {!subscription?.canAccessPremium && (
          <div className="text-center">
            <button
              onClick={() => setUpgradeOpen(true)}
              className="px-8 py-4 bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-600 transition"
            >
              {subscription?.trialUsed ? 'Upgrade Now' : 'Start Free Trial'}
            </button>
          </div>
        )}

        <UpgradePlanModal
          isOpen={upgradeOpen}
          onClose={() => setUpgradeOpen(false)}
          onUpgradeSuccess={() => window.location.reload()}
        />
      </div>
    </div>
  );
};

// ============================================
// Helper function to format feature names
// ============================================

const formatFeatureName = (featureName) => {
  return featureName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default {
  Dashboard,
  CertificateSection,
  AIProjectGenerator,
  QuizPage,
  ProfilePage,
  LandingPage,
};
