const sequelize = require('../config/database');
const User = require('./User');
const TrackerItem = require('./TrackerItem');
const Task = require('./Task');
const MeetingNote = require('./MeetingNote');
const ContentItem = require('./ContentItem');
const Idea = require('./Idea');
const Tool = require('./Tool');
const Message = require('./Message');
const Kra = require('./Kra');

// User relationships
User.hasMany(TrackerItem, { foreignKey: 'assigneeId', as: 'assignedItems' });
TrackerItem.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

User.hasMany(TrackerItem, { foreignKey: 'userId', as: 'ownTrackerItems' });
TrackerItem.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(MeetingNote, { foreignKey: 'userId', as: 'meetingNotes' });
MeetingNote.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(ContentItem, { foreignKey: 'creatorId', as: 'createdContent' });
ContentItem.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

User.hasMany(Idea, { foreignKey: 'userId', as: 'ideas' });
Idea.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Tool, { foreignKey: 'userId', as: 'customTools' });
Tool.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Message relationships
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

User.hasMany(Message, { foreignKey: 'receiverId', as: 'receivedMessages' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Kra relationships
User.hasMany(Kra, { foreignKey: 'userId', as: 'kras' });
Kra.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  TrackerItem,
  Task,
  MeetingNote,
  ContentItem,
  Idea,
  Tool,
  Message,
  Kra
};