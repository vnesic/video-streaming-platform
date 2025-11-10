const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
        ],
        stripePriceId: process.env.STRIPE_BASIC_PRICE_ID
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
        ],
        stripePriceId: process.env.STRIPE_PREMIUM_PRICE_ID
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

// Create subscription checkout session
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

    // Get user's Stripe customer ID
    const userResult = await query(
      'SELECT stripe_customer_id FROM users WHERE id = $1',
      [userId]
    );

    const stripeCustomerId = userResult.rows[0].stripe_customer_id;

    // Get the price ID based on plan
    const priceId = planId === 'basic' 
      ? process.env.STRIPE_BASIC_PRICE_ID 
      : process.env.STRIPE_PREMIUM_PRICE_ID;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: userId,
        planId: planId
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating checkout session'
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
      `SELECT stripe_subscription_id FROM subscriptions 
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

    const stripeSubscriptionId = subResult.rows[0].stripe_subscription_id;

    // Cancel subscription at period end in Stripe
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    // Update in database
    await query(
      `UPDATE subscriptions 
       SET cancel_at_period_end = true, updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [stripeSubscriptionId]
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

// Stripe webhook handler
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Helper functions for webhook events
const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata.userId;
  const planId = session.metadata.planId;
  const subscriptionId = session.subscription;

  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Create subscription in database
  await query(
    `INSERT INTO subscriptions 
     (user_id, stripe_subscription_id, plan_type, status, current_period_start, current_period_end)
     VALUES ($1, $2, $3, $4, to_timestamp($5), to_timestamp($6))`,
    [
      userId,
      subscriptionId,
      planId,
      subscription.status,
      subscription.current_period_start,
      subscription.current_period_end
    ]
  );

  console.log(`Subscription created for user ${userId}`);
};

const handleSubscriptionUpdated = async (subscription) => {
  await query(
    `UPDATE subscriptions 
     SET status = $1, 
         current_period_start = to_timestamp($2),
         current_period_end = to_timestamp($3),
         cancel_at_period_end = $4,
         updated_at = NOW()
     WHERE stripe_subscription_id = $5`,
    [
      subscription.status,
      subscription.current_period_start,
      subscription.current_period_end,
      subscription.cancel_at_period_end,
      subscription.id
    ]
  );

  console.log(`Subscription ${subscription.id} updated`);
};

const handleSubscriptionDeleted = async (subscription) => {
  await query(
    `UPDATE subscriptions 
     SET status = 'canceled', updated_at = NOW()
     WHERE stripe_subscription_id = $1`,
    [subscription.id]
  );

  console.log(`Subscription ${subscription.id} deleted`);
};

const handlePaymentSucceeded = async (invoice) => {
  const customerId = invoice.customer;
  const subscriptionId = invoice.subscription;

  // Get user ID
  const userResult = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length > 0) {
    const userId = userResult.rows[0].id;

    // Record payment
    await query(
      `INSERT INTO payment_history 
       (user_id, stripe_payment_intent_id, amount, currency, status, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        invoice.payment_intent,
        invoice.amount_paid,
        invoice.currency,
        'succeeded',
        `Subscription payment for ${invoice.lines.data[0]?.description || 'subscription'}`
      ]
    );

    console.log(`Payment recorded for user ${userId}`);
  }
};

const handlePaymentFailed = async (invoice) => {
  const customerId = invoice.customer;

  // Get user ID
  const userResult = await query(
    'SELECT id FROM users WHERE stripe_customer_id = $1',
    [customerId]
  );

  if (userResult.rows.length > 0) {
    const userId = userResult.rows[0].id;

    // Record failed payment
    await query(
      `INSERT INTO payment_history 
       (user_id, stripe_payment_intent_id, amount, currency, status, description)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        invoice.payment_intent,
        invoice.amount_due,
        invoice.currency,
        'failed',
        `Failed payment for ${invoice.lines.data[0]?.description || 'subscription'}`
      ]
    );

    console.log(`Failed payment recorded for user ${userId}`);
  }
};

module.exports = {
  getPlans,
  createCheckoutSession,
  getSubscription,
  cancelSubscription,
  handleWebhook
};
