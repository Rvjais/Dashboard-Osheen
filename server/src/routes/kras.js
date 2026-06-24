const express = require('express');
const router = express.Router();
const { Kra, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

// Get KRAs (all users can view)
router.get('/', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId } : {};

    const kras = await Kra.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarColor', 'avatar', 'role', 'status']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ kras });
  } catch (error) {
    console.error('Get KRAs error:', error);
    res.status(500).json({ error: 'Failed to get KRAs' });
  }
});

// Create KRA (admin only)
router.post('/', auth, adminOnly, async (req, res) => {
  try {
    const { userId, title, description, weightage, target, timeframe, status } = req.body;

    if (!userId || !title) {
      return res.status(400).json({ error: 'User ID and Title are required' });
    }

    // Check if user exists
    const userExists = await User.findByPk(userId);
    if (!userExists) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const kra = await Kra.create({
      userId,
      title,
      description: description || null,
      weightage: weightage !== undefined ? weightage : 0,
      target: target || null,
      timeframe: timeframe || null,
      status: status || 'In Progress'
    });

    // Reload to include user relation
    const fullKra = await Kra.findByPk(kra.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarColor', 'avatar', 'role', 'status']
        }
      ]
    });

    res.status(201).json({ message: 'KRA created successfully', kra: fullKra });
  } catch (error) {
    console.error('Create KRA error:', error);
    res.status(500).json({ error: 'Failed to create KRA' });
  }
});

// Update KRA (admin only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const kra = await Kra.findByPk(req.params.id);

    if (!kra) {
      return res.status(404).json({ error: 'KRA not found' });
    }

    const { title, description, weightage, target, timeframe, status } = req.body;

    await kra.update({
      title: title !== undefined ? title : kra.title,
      description: description !== undefined ? description : kra.description,
      weightage: weightage !== undefined ? weightage : kra.weightage,
      target: target !== undefined ? target : kra.target,
      timeframe: timeframe !== undefined ? timeframe : kra.timeframe,
      status: status !== undefined ? status : kra.status
    });

    // Reload to include user relation
    const fullKra = await Kra.findByPk(kra.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'avatarColor', 'avatar', 'role', 'status']
        }
      ]
    });

    res.json({ message: 'KRA updated successfully', kra: fullKra });
  } catch (error) {
    console.error('Update KRA error:', error);
    res.status(500).json({ error: 'Failed to update KRA' });
  }
});

// Delete KRA (admin only)
router.delete('/:id', auth, adminOnly, async (req, res) => {
  try {
    const kra = await Kra.findByPk(req.params.id);

    if (!kra) {
      return res.status(404).json({ error: 'KRA not found' });
    }

    await kra.destroy();

    res.json({ message: 'KRA deleted successfully' });
  } catch (error) {
    console.error('Delete KRA error:', error);
    res.status(500).json({ error: 'Failed to delete KRA' });
  }
});

module.exports = router;
