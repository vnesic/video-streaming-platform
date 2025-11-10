const Mux = require('@mux/mux-node');
const { query } = require('../config/database');

const { Video } = new Mux(
  process.env.MUX_TOKEN_ID,
  process.env.MUX_TOKEN_SECRET
);

// Get all videos with pagination and filtering
const getVideos = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search } = req.query;
    const offset = (page - 1) * limit;

    let queryText = `
      SELECT v.id, v.title, v.description, v.thumbnail_url, 
             v.duration, v.category, v.required_plan, v.view_count,
             v.created_at
      FROM videos v
      WHERE v.status = 'ready'
    `;
    const queryParams = [];
    let paramIndex = 1;

    // Add category filter
    if (category) {
      queryText += ` AND v.category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Add search filter
    if (search) {
      queryText += ` AND (v.title ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering and pagination
    queryText += ` ORDER BY v.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM videos WHERE status = \'ready\'';
    const countParams = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
    }

    const countResult = await query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        videos: result.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos'
    });
  }
};

// Get single video details
const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT * FROM videos WHERE id = $1 AND status = 'ready'`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const video = result.rows[0];

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video'
    });
  }
};

// Get video playback URL (requires authentication and subscription)
const getPlaybackUrl = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get video details
    const videoResult = await query(
      `SELECT id, title, mux_playback_id, required_plan FROM videos 
       WHERE id = $1 AND status = 'ready'`,
      [id]
    );

    if (videoResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const video = videoResult.rows[0];

    // Check if user has required subscription
    if (video.required_plan) {
      const subscriptionResult = await query(
        `SELECT plan_type FROM subscriptions 
         WHERE user_id = $1 AND status = 'active' AND current_period_end > NOW()`,
        [userId]
      );

      if (subscriptionResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          code: 'NO_SUBSCRIPTION'
        });
      }

      const userPlan = subscriptionResult.rows[0].plan_type;
      const planHierarchy = { basic: 1, premium: 2 };

      if (planHierarchy[userPlan] < planHierarchy[video.required_plan]) {
        return res.status(403).json({
          success: false,
          message: `${video.required_plan} subscription required`,
          code: 'INSUFFICIENT_PLAN'
        });
      }
    }

    // Generate signed playback URL with Mux
    const playbackId = video.mux_playback_id;
    
    // For signed playback (recommended for production)
    // You would use Mux's signed URL generation here
    const playbackUrl = `https://stream.mux.com/${playbackId}.m3u8`;

    // Update view count
    await query(
      'UPDATE videos SET view_count = view_count + 1 WHERE id = $1',
      [id]
    );

    // Record watch history
    await query(
      `INSERT INTO watch_history (user_id, video_id, last_watched_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, video_id) 
       DO UPDATE SET last_watched_at = NOW()`,
      [userId, id]
    );

    res.json({
      success: true,
      data: {
        videoId: video.id,
        title: video.title,
        playbackUrl,
        playbackId
      }
    });
  } catch (error) {
    console.error('Get playback URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating playback URL'
    });
  }
};

// Upload video (admin function - would normally have admin auth)
const uploadVideo = async (req, res) => {
  try {
    const { title, description, category, requiredPlan = 'basic', videoUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title and video URL are required'
      });
    }

    // Create Mux asset from URL
    const asset = await Video.Assets.create({
      input: videoUrl,
      playback_policy: ['public'], // Use 'signed' for production
      mp4_support: 'standard',
      test: process.env.NODE_ENV !== 'production'
    });

    // Save video to database
    const result = await query(
      `INSERT INTO videos 
       (title, description, mux_asset_id, mux_playback_id, category, required_plan, status, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        title,
        description,
        asset.id,
        asset.playback_ids[0].id,
        category,
        requiredPlan,
        'processing',
        req.user.id
      ]
    );

    const video = result.rows[0];

    res.status(201).json({
      success: true,
      message: 'Video upload initiated',
      data: {
        id: video.id,
        title: video.title,
        status: video.status,
        muxAssetId: video.mux_asset_id
      }
    });
  } catch (error) {
    console.error('Upload video error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading video'
    });
  }
};

// Get user's watch history
const getWatchHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT wh.progress, wh.completed, wh.last_watched_at,
              v.id, v.title, v.description, v.thumbnail_url, v.duration
       FROM watch_history wh
       JOIN videos v ON wh.video_id = v.id
       WHERE wh.user_id = $1
       ORDER BY wh.last_watched_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get watch history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching watch history'
    });
  }
};

// Update watch progress
const updateWatchProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress, completed = false } = req.body;
    const userId = req.user.id;

    await query(
      `INSERT INTO watch_history (user_id, video_id, progress, completed, last_watched_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, video_id)
       DO UPDATE SET 
         progress = $3,
         completed = $4,
         last_watched_at = NOW()`,
      [userId, id, progress, completed]
    );

    res.json({
      success: true,
      message: 'Watch progress updated'
    });
  } catch (error) {
    console.error('Update watch progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating watch progress'
    });
  }
};

// Mux webhook handler
const handleMuxWebhook = async (req, res) => {
  try {
    const event = req.body;

    // Verify webhook signature (implement based on Mux docs)
    // const signature = req.headers['mux-signature'];

    switch (event.type) {
      case 'video.asset.ready':
        await handleAssetReady(event.data);
        break;
      
      case 'video.asset.errored':
        await handleAssetErrored(event.data);
        break;
      
      default:
        console.log(`Unhandled Mux event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Mux webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

const handleAssetReady = async (asset) => {
  // Update video status to ready
  await query(
    `UPDATE videos 
     SET status = 'ready',
         duration = $1,
         thumbnail_url = $2,
         updated_at = NOW()
     WHERE mux_asset_id = $3`,
    [
      asset.duration || 0,
      asset.playback_ids?.[0]?.id ? 
        `https://image.mux.com/${asset.playback_ids[0].id}/thumbnail.jpg` : null,
      asset.id
    ]
  );

  console.log(`Video asset ${asset.id} is ready`);
};

const handleAssetErrored = async (asset) => {
  await query(
    `UPDATE videos 
     SET status = 'error', updated_at = NOW()
     WHERE mux_asset_id = $1`,
    [asset.id]
  );

  console.log(`Video asset ${asset.id} errored`);
};

// Get video categories
const getCategories = async (req, res) => {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM videos WHERE status = \'ready\' AND category IS NOT NULL ORDER BY category'
    );

    res.json({
      success: true,
      data: result.rows.map(row => row.category)
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories'
    });
  }
};

module.exports = {
  getVideos,
  getVideoById,
  getPlaybackUrl,
  uploadVideo,
  getWatchHistory,
  updateWatchProgress,
  handleMuxWebhook,
  getCategories
};
