const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { generateToken, verifyGoogleToken, client } = require('../middleware/google');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Register with email/password
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'employee'
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Registration successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login with email/password
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Google OAuth - Send auth URL
router.get('/google', (req, res) => {
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['email', 'profile', 'openid'],
    prompt: 'consent'
  });

  res.json({ authUrl });
});

// Google OAuth - Callback
router.post('/google/callback', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token required' });
    }

    // Verify Google token
    const payload = await verifyGoogleToken(idToken);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    // Check if user exists with this Google ID
    let user = await User.findOne({ where: { googleId: payload.sub } });

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ where: { email: payload.email } });

      if (user) {
        // Link Google account to existing user
        await user.update({
          googleId: payload.sub,
          avatarColor: getRandomColor()
        });
      } else {
        // Create new user
        user = await User.create({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          googleId: payload.sub,
          role: 'employee',
          avatarColor: getRandomColor()
        });
      }
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Google login successful',
      user: user.toJSON(),
      token
    });
  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    res.json({ user: req.user.toJSON() });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Refresh token
router.post('/refresh', auth, async (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Forgot password - generate reset token
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await user.update({ resetToken, resetTokenExpiry });

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@taskstudio.com',
        to: email,
        subject: 'Task Studio - Password Reset Request',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your Task Studio account.</p>
            <p>
              <a href="${resetUrl}" 
                 style="display: inline-block; padding: 12px 24px; background: #EF4444; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Reset Password
              </a>
            </p>
            <p>Or copy this link into your browser:</p>
            <p style="color: #666; font-size: 13px;">${resetUrl}</p>
            <p style="color: #999; font-size: 12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } else {
      console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    }

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpiry: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    await user.update({
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const isValid = await req.user.comparePassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    await req.user.update({ password: newPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Logout (just for client-side token removal, server doesn't track tokens)
router.post('/logout', auth, (req, res) => {
  res.json({ message: 'Logout successful' });
});

// Helper function
function getRandomColor() {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = router;