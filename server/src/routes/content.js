const express = require('express');
const router = express.Router();
const { ContentItem, Tool, Idea } = require('../models');
const { auth } = require('../middleware/auth');

// ==================== CONTENT ITEMS ====================

// Get all content items
router.get('/content', auth, async (req, res) => {
  try {
    const items = await ContentItem.findAll({
      where: { userId: req.userId },
      order: [['publishDate', 'ASC']]
    });

    res.json({ items });
  } catch (error) {
    console.error('Get content items error:', error);
    res.status(500).json({ error: 'Failed to get content items' });
  }
});

// Create content item
router.post('/content', auth, async (req, res) => {
  try {
    const { title, platform, type, publishDate, stage, link, goal, caption, notes } = req.body;

    if (!title || !platform || !publishDate) {
      return res.status(400).json({ error: 'Title, platform, and publish date are required' });
    }

    const item = await ContentItem.create({
      title,
      platform,
      type: type || 'post',
      publishDate,
      stage: stage || 'draft',
      creatorId: req.userId,
      link: link || '',
      goal: goal || '',
      caption: caption || '',
      notes: notes || '',
      userId: req.userId
    });

    res.status(201).json({ message: 'Content item created', item });
  } catch (error) {
    console.error('Create content item error:', error);
    res.status(500).json({ error: 'Failed to create content item' });
  }
});

// Update content item
router.put('/content/:id', auth, async (req, res) => {
  try {
    const item = await ContentItem.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    const { title, platform, type, publishDate, stage, link, goal, caption, notes } = req.body;

    await item.update({
      title: title !== undefined ? title : item.title,
      platform: platform !== undefined ? platform : item.platform,
      type: type !== undefined ? type : item.type,
      publishDate: publishDate !== undefined ? publishDate : item.publishDate,
      stage: stage !== undefined ? stage : item.stage,
      link: link !== undefined ? link : item.link,
      goal: goal !== undefined ? goal : item.goal,
      caption: caption !== undefined ? caption : item.caption,
      notes: notes !== undefined ? notes : item.notes
    });

    res.json({ message: 'Content item updated', item });
  } catch (error) {
    console.error('Update content item error:', error);
    res.status(500).json({ error: 'Failed to update content item' });
  }
});

// Delete content item
router.delete('/content/:id', auth, async (req, res) => {
  try {
    const item = await ContentItem.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Content item not found' });
    }

    await item.destroy();

    res.json({ message: 'Content item deleted' });
  } catch (error) {
    console.error('Delete content item error:', error);
    res.status(500).json({ error: 'Failed to delete content item' });
  }
});

// ==================== TOOLS ====================

// Get all tools (system + custom)
router.get('/tools', auth, async (req, res) => {
  try {
    // Get system tools (userId = null) and user's custom tools
    const tools = await Tool.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { userId: null },
          { userId: req.userId }
        ]
      },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    res.json({ tools });
  } catch (error) {
    console.error('Get tools error:', error);
    res.status(500).json({ error: 'Failed to get tools' });
  }
});

// Create custom tool
router.post('/tools', auth, async (req, res) => {
  try {
    const { name, url, icon, category } = req.body;

    if (!name || !url || !category) {
      return res.status(400).json({ error: 'Name, URL, and category are required' });
    }

    const tool = await Tool.create({
      name,
      url,
      icon: icon || '🔗',
      category,
      userId: req.userId // Custom tool - belongs to this user
    });

    res.status(201).json({ message: 'Tool created', tool });
  } catch (error) {
    console.error('Create tool error:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

// Delete custom tool (only user's own tools)
router.delete('/tools/:id', auth, async (req, res) => {
  try {
    const tool = await Tool.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found or cannot be deleted' });
    }

    await tool.destroy();

    res.json({ message: 'Tool deleted' });
  } catch (error) {
    console.error('Delete tool error:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

// ==================== IDEAS ====================

// Get all ideas
router.get('/ideas', auth, async (req, res) => {
  try {
    const ideas = await Idea.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ ideas });
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: 'Failed to get ideas' });
  }
});

// Create idea
router.post('/ideas', auth, async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Idea text is required' });
    }

    const idea = await Idea.create({
      text,
      category: category || 'general',
      date: new Date().toISOString().split('T')[0],
      userId: req.userId
    });

    res.status(201).json({ message: 'Idea created', idea });
  } catch (error) {
    console.error('Create idea error:', error);
    res.status(500).json({ error: 'Failed to create idea' });
  }
});

// Delete idea
router.delete('/ideas/:id', auth, async (req, res) => {
  try {
    const idea = await Idea.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    await idea.destroy();

    res.json({ message: 'Idea deleted' });
  } catch (error) {
    console.error('Delete idea error:', error);
    res.status(500).json({ error: 'Failed to delete idea' });
  }
});

module.exports = router;