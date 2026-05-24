const express = require('express');
const router = express.Router();
const { MeetingNote } = require('../models');
const { auth } = require('../middleware/auth');

// Get all meeting notes
router.get('/', auth, async (req, res) => {
  try {
    const notes = await MeetingNote.findAll({
      where: { userId: req.userId },
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({ notes });
  } catch (error) {
    console.error('Get meeting notes error:', error);
    res.status(500).json({ error: 'Failed to get meeting notes' });
  }
});

// Create meeting note
router.post('/', auth, async (req, res) => {
  try {
    const { title, date, type, attendees, notes, actionItems, link } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const note = await MeetingNote.create({
      title,
      date,
      type: type || 'meeting',
      attendees: attendees || [],
      notes: notes || '',
      actionItems: actionItems || '',
      link: link || '',
      userId: req.userId
    });

    res.status(201).json({ message: 'Meeting note created', note });
  } catch (error) {
    console.error('Create meeting note error:', error);
    res.status(500).json({ error: 'Failed to create meeting note' });
  }
});

// Get single meeting note
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await MeetingNote.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!note) {
      return res.status(404).json({ error: 'Meeting note not found' });
    }

    res.json({ note });
  } catch (error) {
    console.error('Get meeting note error:', error);
    res.status(500).json({ error: 'Failed to get meeting note' });
  }
});

// Update meeting note
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await MeetingNote.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!note) {
      return res.status(404).json({ error: 'Meeting note not found' });
    }

    const { title, date, type, attendees, notes, actionItems, link } = req.body;

    await note.update({
      title: title !== undefined ? title : note.title,
      date: date !== undefined ? date : note.date,
      type: type !== undefined ? type : note.type,
      attendees: attendees !== undefined ? attendees : note.attendees,
      notes: notes !== undefined ? notes : note.notes,
      actionItems: actionItems !== undefined ? actionItems : note.actionItems,
      link: link !== undefined ? link : note.link
    });

    res.json({ message: 'Meeting note updated', note });
  } catch (error) {
    console.error('Update meeting note error:', error);
    res.status(500).json({ error: 'Failed to update meeting note' });
  }
});

// Delete meeting note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await MeetingNote.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!note) {
      return res.status(404).json({ error: 'Meeting note not found' });
    }

    await note.destroy();

    res.json({ message: 'Meeting note deleted' });
  } catch (error) {
    console.error('Delete meeting note error:', error);
    res.status(500).json({ error: 'Failed to delete meeting note' });
  }
});

module.exports = router;