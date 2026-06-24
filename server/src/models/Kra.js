const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kra = sequelize.define('Kra', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  weightage: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  target: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  timeframe: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Pending', 'In Progress', 'Completed', 'Exceeded', 'Not Met'),
    defaultValue: 'In Progress'
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  }
}, {
  tableName: 'kras',
  timestamps: true
});

module.exports = Kra;
