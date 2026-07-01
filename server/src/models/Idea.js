const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Idea = sequelize.define('Idea', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'ideas',
  timestamps: true
});

module.exports = Idea;