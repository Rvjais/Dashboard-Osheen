const express = require('express');
const router = express.Router();
const { Task } = require('../models');
const { auth } = require('../middleware/auth');

// Get all tasks for current user (created by or assigned to)
router.get('/', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Get tasks assigned to current user
router.get('/assigned', auth, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { assigneeId: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.json({ tasks });
  } catch (error) {
    console.error('Get assigned tasks error:', error);
    res.status(500).json({ error: 'Failed to get assigned tasks' });
  }
});

// Create task
router.post('/', auth, async (req, res) => {
  try {
    const { title, priority, dueDate, assigneeId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await Task.create({
      title,
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
      createdById: req.userId,
      userId: req.userId
    });

    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const { title, priority, done, dueDate, assigneeId } = req.body;

    await task.update({
      title: title !== undefined ? title : task.title,
      priority: priority !== undefined ? priority : task.priority,
      done: done !== undefined ? done : task.done,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId
    });

    res.json({ message: 'Task updated', task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Toggle task done status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.update({ done: !task.done });

    res.json({ message: 'Task toggled', task });
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.id, userId: req.userId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.destroy();

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Bulk delete tasks
router.post('/bulk-delete', auth, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Task IDs required' });
    }

    await Task.destroy({
      where: { id: ids, userId: req.userId }
    });

    res.json({ message: 'Tasks deleted' });
  } catch (error) {
    console.error('Bulk delete tasks error:', error);
    res.status(500).json({ error: 'Failed to delete tasks' });
  }
});

module.exports = router;
