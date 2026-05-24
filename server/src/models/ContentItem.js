const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContentItem = sequelize.define('ContentItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'post'
  },
  publishDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  stage: {
    type: DataTypes.STRING,
    defaultValue: 'draft'
  },
  creatorId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  goal: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  caption: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'content_items',
  timestamps: true
});

module.exports = ContentItem;