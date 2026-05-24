const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { TrackerItem, User } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const { Op } = require('sequelize');

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Get active (non-archived) tracker items
router.get('/', auth, async (req, res) => {
  try {
    const where = { archived: false };
    // Users see their own items; admins see all
    if (req.user.role !== 'admin') {
      where.userId = req.userId;
    }
    const items = await TrackerItem.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json({ items });
  } catch (error) {
    console.error('Get tracker items error:', error);
    res.status(500).json({ error: 'Failed to get tracker items' });
  }
});

// Get archived history
router.get('/history', auth, async (req, res) => {
  try {
    const where = { archived: true };
    if (req.user.role !== 'admin') {
      where.userId = req.userId;
    }
    const { startDate, endDate } = req.query;
    if (startDate) where.date = { ...where.date, [Op.gte]: startDate };
    if (endDate) where.date = { ...where.date, [Op.lte]: endDate };

    const items = await TrackerItem.findAll({
      where,
      order: [['completedAt', 'DESC']]
    });
    res.json({ items });
  } catch (error) {
    console.error('Get tracker history error:', error);
    res.status(500).json({ error: 'Failed to get tracker history' });
  }
});

// Create tracker item
router.post('/', auth, async (req, res) => {
  try {
    const { name, date, type, priority, status, deliverable, assigneeId, link, attachment, notes, timeSlot } = req.body;

    if (!name || !date) {
      return res.status(400).json({ error: 'Name and date are required' });
    }

    const item = await TrackerItem.create({
      name,
      date,
      type: type || 'Task',
      priority: priority || 'medium',
      status: status || 'todo',
      deliverable: deliverable || '-',
      assigneeId: assigneeId || null,
      link: link || '',
      attachment: attachment || null,
      notes: notes || '',
      timeSlot: timeSlot != null ? timeSlot : null,
      userId: req.userId
    });

    res.status(201).json({ message: 'Tracker item created', item });
  } catch (error) {
    console.error('Create tracker item error:', error);
    res.status(500).json({ error: 'Failed to create tracker item' });
  }
});

// Upload attachment
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    res.json({
      message: 'File uploaded',
      attachment: {
        name: req.file.originalname,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Update tracker item
router.put('/:id', auth, async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'admin') where.userId = req.userId;

    const item = await TrackerItem.findOne({ where });

    if (!item) {
      return res.status(404).json({ error: 'Tracker item not found' });
    }

    const { name, date, type, priority, status, deliverable, assigneeId, link, attachment, notes, timeSlot } = req.body;

    const updateData = {
      name: name !== undefined ? name : item.name,
      date: date !== undefined ? date : item.date,
      type: type !== undefined ? type : item.type,
      priority: priority !== undefined ? priority : item.priority,
      status: status !== undefined ? status : item.status,
      deliverable: deliverable !== undefined ? deliverable : item.deliverable,
      assigneeId: assigneeId !== undefined ? (assigneeId === '' ? null : assigneeId) : item.assigneeId,
      link: link !== undefined ? link : item.link,
      attachment: attachment !== undefined ? attachment : item.attachment,
      notes: notes !== undefined ? notes : item.notes,
      timeSlot: timeSlot !== undefined ? timeSlot : item.timeSlot
    };

    // Auto-set completedAt when status changes to done
    if (status === 'done' && item.status !== 'done') {
      updateData.completedAt = new Date();
    }

    await item.update(updateData);

    res.json({ message: 'Tracker item updated', item });
  } catch (error) {
    console.error('Update tracker item error:', error);
    res.status(500).json({ error: 'Failed to update tracker item' });
  }
});

// Delete tracker item
router.delete('/:id', auth, async (req, res) => {
  try {
    const where = { id: req.params.id };
    if (req.user.role !== 'admin') where.userId = req.userId;

    const item = await TrackerItem.findOne({ where });

    if (!item) {
      return res.status(404).json({ error: 'Tracker item not found' });
    }

    await item.destroy();

    res.json({ message: 'Tracker item deleted' });
  } catch (error) {
    console.error('Delete tracker item error:', error);
    res.status(500).json({ error: 'Failed to delete tracker item' });
  }
});

// Archive completed items (called by cron or manually)
router.post('/archive', auth, adminOnly, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [updated] = await TrackerItem.update(
      { archived: true },
      {
        where: {
          status: 'done',
          date: { [Op.lt]: today },
          archived: false
        }
      }
    );
    res.json({ message: `Archived ${updated} completed items` });
  } catch (error) {
    console.error('Archive tracker items error:', error);
    res.status(500).json({ error: 'Failed to archive tracker items' });
  }
});

module.exports = router;
