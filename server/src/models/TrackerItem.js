const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrackerItem = sequelize.define('TrackerItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('Task', 'Deliverable', 'Meeting', 'Creative', 'Note', 'Journal', 'Content'),
    defaultValue: 'Task'
  },
  priority: {
    type: DataTypes.ENUM('emergency', 'high', 'medium', 'low', 'creative', 'daily', 'weekly', 'monthly'),
    defaultValue: 'medium'
  },
  status: {
    type: DataTypes.ENUM('todo', 'in_progress', 'in_review', 'done', 'blocked'),
    defaultValue: 'todo'
  },
  timeSlot: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  deliverable: {
    type: DataTypes.STRING,
    defaultValue: '-'
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  attachment: {
    type: DataTypes.JSON,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'tracker_items',
  timestamps: true
});

module.exports = TrackerItem;