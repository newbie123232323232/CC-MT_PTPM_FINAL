const router = require('express').Router();
const User = require('../models/User');
const CryptoJS = require('crypto-js');
const verify = require('../verifyToken');

function sendError(res, status, code, message, details) {
  return res.status(status).json({ code, message, details });
}

// Update
router.put('/:id', verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    if (req.body.password) {
      req.body.password = CryptoJS.AES.encrypt(
        req.body.password,
        process.env.SECRET_KEY
      ).toString();
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      sendError(res, 500, 'USER_UPDATE_FAILED', 'Failed to update user', err);
    }
  } else {
    sendError(res, 403, 'FORBIDDEN', 'Not authorized to update account');
  }
});

// Delete
router.delete('/:id', verify, async (req, res) => {
  if (req.user.id === req.params.id || req.user.isAdmin) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json('User deleted successfully');
    } catch (err) {
      sendError(res, 500, 'USER_DELETE_FAILED', 'Failed to delete user', err);
    }
  } else {
    sendError(res, 403, 'FORBIDDEN', 'Not authorized to delete account');
  }
});

// Get
router.get('/find/:id', verify, async (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return sendError(res, 403, 'FORBIDDEN', 'Not authorized to view this user');
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }
    const { password, ...info } = user._doc;
    res.status(200).json(info);
  } catch (err) {
    sendError(res, 500, 'USER_FETCH_FAILED', 'Failed to fetch user', err);
  }
});

// Get all
router.get('/', verify, async (req, res) => {
  const query = req.query.new;

  if (req.user.isAdmin) {
    try {
      const users = query
        ? await User.find().sort({ _id: -1 }).limit(5)
        : await User.find();
      res.status(200).json(users.reverse());
    } catch (err) {
      sendError(res, 500, 'USER_LIST_FAILED', 'Failed to fetch users', err);
    }
  } else {
    sendError(res, 403, 'FORBIDDEN', 'Not authorized to see all users');
  }
});

// Get user stats
router.get('/stats', verify, async (req, res) => {
  if (!req.user.isAdmin) {
    return sendError(res, 403, 'FORBIDDEN', 'Not authorized to view user stats');
  }

  try {
    const data = await User.aggregate([
      {
        $project: {
          month: { $month: '$createdAt' },
        },
      },
      {
        $group: {
          _id: '$month',
          total: { $sum: 1 },
        },
      },
    ]);
    res.status(200).json(data);
  } catch (err) {
    sendError(res, 500, 'USER_STATS_FAILED', 'Failed to fetch user stats', err);
  }
});

module.exports = router;
