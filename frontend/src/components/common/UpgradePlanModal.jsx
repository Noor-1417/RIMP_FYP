/**
 * UpgradePlanModal.jsx
 * 
 * Modal component for displaying subscription plans and upgrade options
 */

import React, { useState, useEffect } from 'react';
import { useSubscription } from '../context/SubscriptionContext';
import api from '../../services/api';

export const UpgradePlanModal = ({ isOpen, onClose, onUpgradeSuccess }) => {
  const { subscription } = useSubscription();
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(2); // Default to 2 months
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get('/subscriptions/plans');
        setPlans(response.data.plans.filter((p) => p.id !== 'trial'));
      } catch (err) {
        setError(err.message);
      }
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real application, you would:
      // 1. Create a Stripe payment intent
      // 2. Initialize Stripe payment
      // 3. After successful payment, call upgrade-plan endpoint

      // This is a placeholder showing the API call structure
      const planDuration = selectedPlan;

      // Note: You need to handle Stripe payment first
      // This is simplified - implement full Stripe flow in production
      const response = await api.post('/subscriptions/upgrade-plan', {
        planDuration,
        paymentMethod: 'stripe',
        paymentIntentId: 'pi_test_intent_id', // Replace with actual payment intent
      });

      if (response.success) {
        onUpgradeSuccess(response);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Upgrade Your Plan</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Plans Grid */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.duration)}
                className={`p-6 rounded-lg border-2 cursor-pointer transition ${
                  selectedPlan === plan.duration
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.recommended && (
                  <div className="mb-2 inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                    RECOMMENDED
                  </div>
                )}

                <h3 className="text-lg font-semibold text-gray-800 mb-2">{plan.name}</h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-800">${plan.price / 100}</span>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  {plan.savingsLabel && (
                    <p className="text-sm text-green-600 font-semibold mt-2">{plan.savingsLabel}</p>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setSelectedPlan(plan.duration)}
                  className={`w-full py-2 rounded font-semibold transition ${
                    selectedPlan === plan.duration
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {selectedPlan === plan.duration ? 'Selected' : 'Select'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-semibold hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePlanModal;
