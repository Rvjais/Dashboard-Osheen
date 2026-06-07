require('dotenv').config();
const rateLimit = require('express-rate-limit');

const express = require('express');
const path = require('path');
const cors = require('cors');
const { sequelize, TrackerItem } = require('./models');
const { Op } = require('sequelize');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const trackerRoutes = require('./routes/tracker');
const taskRoutes = require('./routes/tasks');
const meetingRoutes = require('./routes/meetings');
const contentRoutes = require('./routes/content');
const geminiRoutes = require('./routes/gemini');
const calendarRoutes = require('./routes/calendar');
const messageRoutes = require('./routes/messages');

const app = express();

// Middleware
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // stricter limit for auth endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware (must be before 404 handler and have 4 params)
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Daily archive job: runs at midnight to archive completed tracker items
const scheduleDailyArchive = () => {
  const now = new Date();
  const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).getTime() - now.getTime();

  setTimeout(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [updated] = await TrackerItem.update(
        { archived: true },
        {
          where: {
            status: 'done',
            date: { [Op.lt]: today },
            archived: false
          }
        }
      );
      if (updated > 0) {
        console.log(`[Archive] Archived ${updated} completed tracker items`);
      }
    } catch (error) {
      console.error('[Archive] Failed to archive items:', error.message);
    }

    // Schedule next run
    scheduleDailyArchive();
  }, msUntilMidnight);
};

// Database sync and server start
const startServer = async () => {
  try {
    // Guard against insecure JWT secret in production
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'default-secret') {
      console.warn('\n⚠️  WARNING: JWT_SECRET is not set or is using the default. Set a strong secret in .env for production!\n');
    }

    // Sync database (creates tables if they don't exist)
    await sequelize.sync({ alter: false });

    // Add timeSlot column if it doesn't exist (migration for new field)
    try {
      await sequelize.query('ALTER TABLE tracker_items ADD COLUMN timeSlot INTEGER;');
    } catch (e) {
      // Column already exists — ignore
    }

    // Add avatar column to users if it doesn't exist
    try {
      await sequelize.query('ALTER TABLE users ADD COLUMN avatar VARCHAR(255);');
    } catch (e) {
      // Column already exists — ignore
    }

    // Add roomId column to messages if it doesn't exist
    try {
      await sequelize.query('ALTER TABLE messages ADD COLUMN roomId VARCHAR(255);');
    } catch (e) {
      // Column already exists — ignore
    }

    console.log('Database synchronized');

    // Seed default admin user if no users exist
    try {
      const userCount = await require('./models').User.count();
      if (userCount === 0) {
        const seedPassword = process.env.ADMIN_SEED_PASSWORD || ('seed_' + require('crypto').randomBytes(8).toString('hex'));
        await require('./models').User.bulkCreate([
          { name: 'Admin', email: process.env.ADMIN_SEED_EMAIL || 'admin@taskstudio.com', password: seedPassword, role: 'admin' },
        ], { individualHooks: true });
        console.log(`Default admin seeded (email: ${process.env.ADMIN_SEED_EMAIL || 'admin@taskstudio.com'}, password: ${seedPassword})`);
        console.log('⚠️  Change this password immediately after first login!');
      }
    } catch (e) {
      // Table might not have all columns yet
      console.log('Note: Could not seed users. Delete DB and restart if needed.');
    }

    // Archive any completed items from previous days on startup
    try {
      const today = new Date().toISOString().split('T')[0];
      const [archived] = await TrackerItem.update(
        { archived: true },
        {
          where: {
            status: 'done',
            date: { [Op.lt]: today },
            archived: false
          }
        }
      );
      if (archived > 0) {
        console.log(`[Startup] Archived ${archived} completed items from previous days`);
      }
    } catch (e) {
      // Table might not exist yet on first run
    }

    // Schedule daily archive at midnight
    scheduleDailyArchive();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
