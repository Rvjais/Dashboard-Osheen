const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tool = sequelize.define('Tool', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '🔗'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true // null for system tools, user ID for custom tools
  }
}, {
  tableName: 'tools',
  timestamps: true
});

module.exports = Tool;