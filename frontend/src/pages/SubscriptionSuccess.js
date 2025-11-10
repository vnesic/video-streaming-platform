import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Refresh user data to get updated subscription
    refreshUser();
  }, [refreshUser]);

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-white"
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
        </div>

        <h1 className="text-3xl font-bold mb-4">Welcome to StreamFlix!</h1>
        <p className="text-gray-400 mb-8">
          Your subscription is now active. Start watching unlimited videos right away!
        </p>

        <div className="space-y-4">
          <Link
            to="/"
            className="block w-full py-3 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
          >
            Start Watching
          </Link>
          
          <Link
            to="/profile"
            className="block w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-md font-semibold transition-colors"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;
