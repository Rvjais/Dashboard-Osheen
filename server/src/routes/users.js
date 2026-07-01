const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const { User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `avatar-${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all team members (all authenticated users can see team roster)
router.get('/team', auth, async (req, res) => {
  try {
    const users = await User.findAll({
      where: { isActive: true },
      attributes: { exclude: ['password', 'googleAccessToken'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to get team members' });
  }
});

// Get all users (admin only)
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password', 'googleAccessToken'] },
      order: [['createdAt', 'DESC']]
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get single user
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'googleAccessToken'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update current user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, mood, capacity, status, avatar } = req.body;

    await req.user.update({
      name: name !== undefined ? name : req.user.name,
      mood: mood !== undefined ? mood : req.user.mood,
      capacity: capacity !== undefined ? capacity : req.user.capacity,
      status: status !== undefined ? status : req.user.status,
      avatar: avatar !== undefined ? avatar : req.user.avatar
    });

    res.json({ message: 'Profile updated', user: req.user.toJSON() });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload avatar
router.post('/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarPath = `/uploads/${req.file.filename}`;
    await req.user.update({ avatar: avatarPath });

    res.json({ message: 'Avatar uploaded', user: req.user.toJSON(), avatar: avatarPath });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// Add new team member (admin only)
router.post('/team', auth, adminOnly, async (req, res) => {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'employee',
      avatarColor: getRandomColor()
    });

    res.status(201).json({ message: 'Team member added', user: user.toJSON() });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Update team member (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, role, capacity, status, isActive } = req.body;

    await user.update({
      name: name !== undefined ? name : user.name,
      role: role !== undefined ? role : user.role,
      capacity: capacity !== undefined ? capacity : user.capacity,
      status: status !== undefined ? status : user.status,
      isActive: isActive !== undefined ? isActive : user.isActive
    });

    res.json({ message: 'User updated', user: user.toJSON() });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete team member (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Helper function
function getRandomColor() {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
  return colors[Math.floor(Math.random() * colors.length)];
}

module.exports = router;