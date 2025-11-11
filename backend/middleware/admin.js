const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if user is admin in database
    const result = await query(
      'SELECT is_admin FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0 || !result.rows[0].is_admin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking admin status'
    });
  }
};

module.exports = isAdmin;