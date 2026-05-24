const { sequelize } = require('../models');

const syncDatabase = async () => {
  try {
    const shouldForce = process.argv.includes('--force');
    if (shouldForce) {
      console.warn('WARNING: Running with --force will DROP all existing data!');
    }
    await sequelize.sync({ force: shouldForce });
    console.log('Database synced successfully');

    // Seed system tools
    const { Tool } = require('../models');
    const systemTools = [
      { name: 'Google Docs', url: 'https://docs.google.com', icon: '📝', category: 'Google Workspace', userId: null },
      { name: 'Google Sheets', url: 'https://sheets.google.com', icon: '📊', category: 'Google Workspace', userId: null },
      { name: 'Google Slides', url: 'https://slides.google.com', icon: '🎨', category: 'Google Workspace', userId: null },
      { name: 'Google Drive', url: 'https://drive.google.com', icon: '📁', category: 'Google Workspace', userId: null },
      { name: 'Google Meet', url: 'https://meet.google.com', icon: '📹', category: 'Communication', userId: null },
      { name: 'Gmail', url: 'https://mail.google.com', icon: '📧', category: 'Communication', userId: null },
      { name: 'Slack', url: 'https://slack.com', icon: '💬', category: 'Communication', userId: null },
      { name: 'Figma', url: 'https://figma.com', icon: '🎨', category: 'Design', userId: null },
      { name: 'GitHub', url: 'https://github.com', icon: '🐙', category: 'Dev', userId: null },
      { name: 'Notion', url: 'https://notion.so', icon: '📓', category: 'My Links', userId: null },
      { name: 'Loom', url: 'https://loom.com', icon: '🎥', category: 'Communication', userId: null },
      { name: 'Linear', url: 'https://linear.app', icon: '📉', category: 'Dev', userId: null },
      { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖', category: 'AI Platforms', userId: null },
      { name: 'Claude', url: 'https://claude.ai', icon: '🧠', category: 'AI Platforms', userId: null },
      { name: 'Gemini', url: 'https://gemini.google.com', icon: '✨', category: 'AI Platforms', userId: null },
    ];

    await Tool.bulkCreate(systemTools);
    console.log('System tools seeded');

    process.exit(0);
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
};

syncDatabase();