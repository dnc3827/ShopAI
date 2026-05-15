const { requireAuth } = require('./auth');

const requireAdmin = async (req, res, next) => {
  await requireAuth(req, res, async () => {
    if (!req.user?.is_admin) {
      res.status(403).json({ success: false, error: 'Admin access required' });
      return;
    }
    next();
  });
};

module.exports = { requireAdmin };
