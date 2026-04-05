const router = require('express').Router();
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const { sendPasswordResetEmail } = require('../services/email');

let googleOAuthClient;
function getGoogleClient() {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) return null;
  if (!googleOAuthClient) googleOAuthClient = new OAuth2Client(id);
  return googleOAuthClient;
}

// Register
router.post('/register', async (req, res) => {
  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    profilePicture: req.body.profilePicture,
    password: CryptoJS.AES.encrypt(
      req.body.password,
      process.env.SECRET_KEY
    ).toString(),
  });

  try {
    const user = await newUser.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json(err);
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json('Wrong email or password');
    }
    if (!user.password) {
      return res.status(401).json('Use Google to sign in');
    }
    const bytes = CryptoJS.AES.decrypt(user.password, process.env.SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    if (decrypted !== req.body.password) {
      return res.status(401).json('Wrong email or password');
    }
    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: '5d' }
    );
    const { password, ...info } = user._doc;
    return res.status(200).json({ ...info, accessToken });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Google Sign-In (JWT credential từ @react-oauth/google)
router.post('/google', async (req, res) => {
  const credential = req.body.credential;
  if (!credential) {
    return res.status(400).json({ message: 'credential is required' });
  }
  const gClient = getGoogleClient();
  if (!gClient) {
    return res.status(503).json({ message: 'Google sign-in is not configured' });
  }
  try {
    const ticket = await gClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload.email) {
      return res.status(401).json({ message: 'Google account has no email' });
    }
    if (payload.email_verified === false) {
      return res.status(401).json({ message: 'Google email not verified' });
    }
    const email = String(payload.email).trim().toLowerCase();
    const sub = payload.sub;
    const picture = payload.picture;

    let user = await User.findOne({ $or: [{ googleId: sub }, { email }] });
    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        if (picture) user.profilePicture = picture;
        await user.save();
      }
    } else {
      const base =
        email.split('@')[0].replace(/[^a-z0-9._-]/gi, '') || 'user';
      let username = base;
      let n = 0;
      while (await User.exists({ username })) {
        n += 1;
        username = `${base}${n}`;
      }
      user = await new User({
        username,
        email,
        googleId: sub,
        profilePicture: picture,
      }).save();
    }

    const accessToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.SECRET_KEY,
      { expiresIn: '5d' }
    );
    const { password, resetPasswordToken, resetPasswordExpires, ...info } =
      user._doc;
    res.status(200).json({ ...info, accessToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid Google credential' });
  }
});

// Forgot password — gửi email có link reset (token 1h). Không lộ email có tồn tại hay không.
router.post('/forgot-password', async (req, res) => {
  const email = String(req.body.email || '')
    .trim()
    .toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          'Nếu email tồn tại, bạn sẽ nhận hướng dẫn đặt lại mật khẩu.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const base =
      process.env.FRONTEND_URL ||
      process.env.CLIENT_URL ||
      'http://localhost:3000';
    const resetLink = `${base.replace(/\/$/, '')}/reset-password?token=${token}`;

    await sendPasswordResetEmail({ to: user.email, resetLink });

    return res.status(200).json({
      success: true,
      message:
        'Nếu email tồn tại, bạn sẽ nhận hướng dẫn đặt lại mật khẩu.',
    });
  } catch (err) {
    console.error(err);
    const missingConfig =
      err.message && err.message.includes('SMTP not configured');
    return res.status(500).json({
      message: missingConfig
        ? 'Gửi email thất bại: thiếu SMTP_USER / SMTP_PASS trong .env (cùng thư mục với index.js). Khởi động lại server sau khi sửa .env.'
        : err.message || 'Không gửi được email đặt lại mật khẩu',
    });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res
      .status(400)
      .json({ message: 'token and newPassword are required' });
  }

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    user.password = CryptoJS.AES.encrypt(
      newPassword,
      process.env.SECRET_KEY
    ).toString();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to reset password' });
  }
});

module.exports = router;
