import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscriptionAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [stripeConfigured, setStripeConfigured] = useState(true);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getSubscription()
      ]);

      setPlans(plansResponse.data.data);
      setCurrentSubscription(subscriptionResponse.data.data);
      
      if (plansResponse.data.data[0]?.demo) {
        setStripeConfigured(false);
      }
      
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load subscription data');
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setProcessingPlan(planId);
      
      const response = await subscriptionAPI.createCheckout(planId);
      
      window.location.href = response.data.data.url;
    } catch (error) {
      if (error.response?.data?.code === 'STRIPE_NOT_CONFIGURED') {
        toast.success('You can already watch all videos without a subscription during testing!', {
          duration: 5000,
          icon: '🎬'
        });
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error('Failed to start checkout process');
      }
      setProcessingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    try {
      await subscriptionAPI.cancelSubscription();
      toast.success('Subscription canceled. You will retain access until the end of your billing period.');
      await fetchData();
      await refreshUser();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-400">
          Stream unlimited videos with any plan. Cancel anytime.
        </p>
        
        {!stripeConfigured && (
          <div className="mt-4 bg-blue-900/30 border border-blue-500 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-blue-300 text-sm">
              <strong>🧪 Testing Mode:</strong> Stripe is not configured. All videos are accessible without subscription!
            </p>
          </div>
        )}
      </div>

      {currentSubscription && (
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Current Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg">
                <span className="font-semibold capitalize">{currentSubscription.planType}</span> Plan
              </p>
              <p className="text-sm text-gray-400">
                Status: <span className="capitalize">{currentSubscription.status}</span>
              </p>
              <p className="text-sm text-gray-400">
                {currentSubscription.cancelAtPeriodEnd 
                  ? `Access until: ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                  : `Renews on: ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`
                }
              </p>
            </div>
            
            {!currentSubscription.cancelAtPeriodEnd && (
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-gray-800 rounded-lg p-8 border-2 ${
              plan.id === 'premium' ? 'border-yellow-500' : 'border-gray-700'
            }`}
          >
            {plan.id === 'premium' && (
              <div className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full inline-block mb-4">
                RECOMMENDED
              </div>
            )}
            
            <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
            
            <div className="mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className="text-gray-400">/{plan.interval}</span>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={
                processingPlan === plan.id ||
                (currentSubscription?.planType === plan.id && !currentSubscription?.cancelAtPeriodEnd)
              }
              className={`w-full py-3 rounded-md font-semibold transition-colors ${
                currentSubscription?.planType === plan.id && !currentSubscription?.cancelAtPeriodEnd
                  ? 'bg-gray-600 cursor-not-allowed'
                  : plan.id === 'premium'
                  ? 'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {processingPlan === plan.id
                ? 'Processing...'
                : currentSubscription?.planType === plan.id && !currentSubscription?.cancelAtPeriodEnd
                ? 'Current Plan'
                : stripeConfigured 
                ? 'Subscribe Now' 
                : 'View Demo (Stripe Not Configured)'}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 text-sm text-gray-400">
        {stripeConfigured ? (
          <>
            <p>All plans include a 30-day money-back guarantee</p>
            <p className="mt-2">Secure payment processing by Stripe</p>
          </>
        ) : (
          <>
            <p>🧪 Testing Mode: Configure Stripe in backend/.env to enable real payments</p>
            <p className="mt-2">Set STRIPE_ENABLED=true and add your Stripe API keys</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Subscription;