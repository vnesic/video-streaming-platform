const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const authMiddleware = require('../middleware/auth');
const requireSubscription = require('../middleware/subscription');
const isAdmin = require('../middleware/admin');

// Public routes
router.get('/categories', videoController.getCategories);

// Mux webhook
router.post('/webhook/mux', express.raw({ type: 'application/json' }), videoController.handleMuxWebhook);

// Protected routes (require authentication)
router.get('/', authMiddleware, videoController.getVideos);
router.get('/history', authMiddleware, videoController.getWatchHistory);
router.get('/:id', authMiddleware, videoController.getVideoById);

// Protected routes (require active subscription)
router.get('/:id/play', authMiddleware, requireSubscription(), videoController.getPlaybackUrl);
router.put('/:id/progress', authMiddleware, requireSubscription(), videoController.updateWatchProgress);

// Admin routes (require authentication - add admin check in production)
router.post('/upload', authMiddleware, isAdmin, videoController.uploadVideo);

module.exports = router;
