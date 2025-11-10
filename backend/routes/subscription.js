const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/plans', subscriptionController.getPlans);

// Stripe webhook (must be before express.json() middleware)
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

// Protected routes
router.post('/checkout', authMiddleware, subscriptionController.createCheckoutSession);
router.get('/current', authMiddleware, subscriptionController.getSubscription);
router.post('/cancel', authMiddleware, subscriptionController.cancelSubscription);

module.exports = router;
