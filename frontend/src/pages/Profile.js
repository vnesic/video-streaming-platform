import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="bg-gray-800 rounded-lg p-8 mb-6">
        <div className="flex items-center mb-6">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user?.fullName?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-6">
            <h2 className="text-2xl font-semibold">{user?.fullName}</h2>
            <p className="text-gray-400">{user?.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Member Since:</span>
              <span>{formatDate(user?.createdAt)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Account Status:</span>
              <span className="text-green-500">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-gray-800 rounded-lg p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Subscription</h3>
          <Link
            to="/subscription"
            className="text-red-600 hover:text-red-500 text-sm"
          >
            Manage Plan
          </Link>
        </div>

        {user?.subscription ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Current Plan:</span>
              <span className="capitalize font-semibold">
                {user.subscription.planType}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="capitalize text-green-500">
                {user.subscription.status}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Renews On:</span>
              <span>{formatDate(user.subscription.currentPeriodEnd)}</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">No active subscription</p>
            <Link
              to="/subscription"
              className="inline-block px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"
            >
              Subscribe Now
            </Link>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-gray-800 rounded-lg p-8">
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="space-y-3">
          <Link
            to="/history"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Watch History
          </Link>
          <Link
            to="/"
            className="block p-3 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Browse Videos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
