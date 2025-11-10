const { query } = require('../config/database');

const requireSubscription = (requiredPlan = null) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Check if user has an active subscription
      const result = await query(
        `SELECT * FROM subscriptions 
         WHERE user_id = $1 
         AND status = 'active' 
         AND current_period_end > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Active subscription required',
          code: 'NO_SUBSCRIPTION'
        });
      }

      const subscription = result.rows[0];

      // If a specific plan is required, check if user has that plan
      if (requiredPlan) {
        const planHierarchy = { basic: 1, premium: 2 };
        const userPlanLevel = planHierarchy[subscription.plan_type] || 0;
        const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

        if (userPlanLevel < requiredPlanLevel) {
          return res.status(403).json({
            success: false,
            message: `${requiredPlan} subscription required`,
            code: 'INSUFFICIENT_PLAN',
            currentPlan: subscription.plan_type,
            requiredPlan: requiredPlan
          });
        }
      }

      // Attach subscription to request
      req.subscription = {
        id: subscription.id,
        planType: subscription.plan_type,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      };

      next();
    } catch (error) {
      console.error('Subscription middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verifying subscription'
      });
    }
  };
};

module.exports = requireSubscription;
