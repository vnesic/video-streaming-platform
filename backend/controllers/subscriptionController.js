const { query, transaction } = require('../config/database');

// Get available subscription plans
const getPlans = async (req, res) => {
  try {
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 9.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Access to basic content library',
          'HD streaming quality',
          'Watch on 1 device',
          'Cancel anytime'
        ]
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 19.99,
        currency: 'usd',
        interval: 'month',
        features: [
          'Access to full content library',
          '4K Ultra HD streaming',
          'Watch on 4 devices simultaneously',
          'Download for offline viewing',
          'Priority support',
          'Cancel anytime'
        ]
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching plans'
    });
  }
};

// Create subscription (without Stripe - direct activation)
const createCheckoutSession = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;

    if (!planId || !['basic', 'premium'].includes(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID'
      });
    }

    // Check if user already has an active subscription
    const existingSubResult = await query(
      'SELECT id FROM subscriptions WHERE user_id = $1 AND status = $2',
      [userId, 'active']
    );

    if (existingSubResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Create subscription directly (without payment processing)
    const currentDate = new Date();
    const periodEnd = new Date(currentDate);
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

    await query(
      `INSERT INTO subscriptions 
       (user_id, stripe_subscription_id, plan_type, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'no-stripe-' + Date.now(), // Dummy subscription ID
        planId,
        'active',
        currentDate,
        periodEnd
      ]
    );

    // Create a payment history record with dummy data
    await query(
      `INSERT INTO payment_history 
       (user_id, stripe_payment_intent_id, amount, currency, status, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        'no-stripe-payment-' + Date.now(),
        planId === 'basic' ? 999 : 1999, // Amount in cents
        'usd',
        'succeeded',
        `${planId.charAt(0).toUpperCase() + planId.slice(1)} plan subscription (no payment processing)`
      ]
    );

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: {
        subscriptionActivated: true
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription'
    });
  }
};

// Get current subscription
const getSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        data: null
      });
    }

    const subscription = result.rows[0];

    res.json({
      success: true,
      data: {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription'
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's active subscription
    const subResult = await query(
      `SELECT id FROM subscriptions 
       WHERE user_id = $1 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    if (subResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const subscriptionId = subResult.rows[0].id;

    // Mark subscription for cancellation at period end
    await query(
      `UPDATE subscriptions 
       SET cancel_at_period_end = true, updated_at = NOW()
       WHERE id = $1`,
      [subscriptionId]
    );

    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period'
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Error canceling subscription'
    });
  }
};

// Dummy webhook handler (no longer needed but kept for API compatibility)
const handleWebhook = async (req, res) => {
  res.json({ 
    received: true,
    message: 'Stripe webhooks are disabled'
  });
};

module.exports = {
  getPlans,
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  handleWebhook
};