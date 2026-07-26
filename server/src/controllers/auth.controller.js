const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret } = require('../config/env');
const crypto = require('crypto');
const { sendResetCode } = require('../services/email.service');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, jwtSecret, { expiresIn: '30d' });
}

exports.signup = async (req, res) => {
  try {
    const { email, password, name, birthday } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name, birthday });

    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond the same way, whether or not the user exists,
    // so nobody can probe which emails are registered.
    if (user) {
      let code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
      let hash = crypto.createHash('sha256').update(code).digest('hex');
      user.resetCodeHash = hash;
      user.resetCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      await user.save();
      try {
        await sendResetCode(user.email, code);
      } catch (err) {
        console.error('Failed to send reset email:', err.message);
      }
    }

    res.json({ message: 'If that email is registered, a code is on its way.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    let { email, code, password } = req.body;
    if (!email || !code || !password) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });
    let hash = crypto.createHash('sha256').update(String(code)).digest('hex');

    if (
      !user ||
      !user.resetCodeHash ||
      user.resetCodeHash !== hash ||
      !user.resetCodeExpires ||
      user.resetCodeExpires < new Date()
    ) {
      return res.status(400).json({ error: 'That code is invalid or expired' });
    }

    
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetCodeHash = undefined;
    user.resetCodeExpires = undefined;
    await user.save();

    res.json({ message: 'Password updated. You can sign in now.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};