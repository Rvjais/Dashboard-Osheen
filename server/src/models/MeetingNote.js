const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MeetingNote = sequelize.define('MeetingNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'meeting'
  },
  attendees: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  actionItems: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  link: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'meeting_notes',
  timestamps: true
});

module.exports = MeetingNote;