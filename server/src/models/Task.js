const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('emergency', 'high', 'medium', 'low', 'creative'),
    defaultValue: 'medium'
  },
  assigneeId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  done: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'tasks',
  timestamps: true
});

module.exports = Task;