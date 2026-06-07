const express = require('express');
const router = express.Router();
const { Message, User } = require('../models');
const { auth } = require('../middleware/auth');
const { Op } = require('sequelize');

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.findAll({
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
        roomId: null
      },
      order: [['createdAt', 'DESC']]
    });

    const userIds = new Set();
    const latestPerUser = new Map();

    for (const msg of messages) {
      const otherId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!userIds.has(otherId)) {
        userIds.add(otherId);
        latestPerUser.set(otherId, {
          messageId: msg.id,
          content: msg.content,
          senderId: msg.senderId,
          createdAt: msg.createdAt,
          read: msg.read || msg.senderId === userId
        });
      }
    }

    const users = await User.findAll({
      where: { id: { [Op.in]: [...userIds] } },
      attributes: ['id', 'name', 'email', 'avatarColor', 'avatar', 'role', 'status']
    });

    const conversations = users.map(u => ({
      user: u,
      lastMessage: latestPerUser.get(u.id)
    }));

    conversations.sort((a, b) => {
      const da = a.lastMessage?.createdAt || 0;
      const db = b.lastMessage?.createdAt || 0;
      return new Date(db) - new Date(da);
    });

    res.json({ conversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// Get unread count — MUST be before /:userId to avoid route shadowing
router.get('/unread/count', auth, async (req, res) => {
  try {
    const count = await Message.count({
      where: { receiverId: req.userId, read: false }
    });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get room/group messages — MUST be before /:userId to avoid route shadowing
router.get('/room/:roomId', auth, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { roomId: req.params.roomId },
      order: [['createdAt', 'ASC']],
      limit: 200
    });
    res.json({ messages });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ error: 'Failed to get room messages' });
  }
});

// Get messages with a specific user (1-on-1, exclude room messages)
router.get('/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        [Op.or]: [
          { senderId: req.userId, receiverId: req.params.userId },
          { senderId: req.params.userId, receiverId: req.userId }
        ],
        roomId: null
      },
      order: [['createdAt', 'ASC']],
      limit: 100
    });

    // Mark incoming messages as read
    await Message.update(
      { read: true },
      {
        where: {
          senderId: req.params.userId,
          receiverId: req.userId,
          read: false
        }
      }
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({ error: 'Receiver and content are required' });
    }

    const receiver = await User.findByPk(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    const message = await Message.create({
      senderId: req.userId,
      receiverId,
      content: content.trim(),
      read: false
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send a room/group message
router.post('/room', auth, async (req, res) => {
  try {
    const { roomId, content } = req.body;

    if (!roomId || !content?.trim()) {
      return res.status(400).json({ error: 'Room ID and content are required' });
    }

    const message = await Message.create({
      senderId: req.userId,
      receiverId: null,
      content: content.trim(),
      roomId,
      read: false
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send room message error:', error);
    res.status(500).json({ error: 'Failed to send room message' });
  }
});

module.exports = router;
