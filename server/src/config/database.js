const { Sequelize } = require('sequelize');
require('dotenv').config();

// For local testing: uses SQLite (no setup needed)
// For VPS: set DATABASE_URL to your PostgreSQL connection string
const isProduction = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sqlite');

let sequelize;
if (isProduction) {
  // PostgreSQL for VPS
  // Automatically enable SSL only for external connections (like Render's external URL)
  const isExternal = process.env.DATABASE_URL.includes('.render.com') || process.env.DATABASE_URL.includes('ssl=true');
  
  const options = {
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialect: 'postgres',
    pool: { max: 5, min: 0, acquire: 30000, idle: 10000 }
  };

  if (isExternal) {
    options.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    };
  }

  sequelize = new Sequelize(process.env.DATABASE_URL, options);
} else {
  // SQLite for local testing
  const path = require('path');
  const fs = require('fs');
  const dbDir = path.join(__dirname, '../../../DB');
  const dbPath = path.join(dbDir, 'taskstudio.db');

  // Create DB folder if doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
  });
  console.log('📁 Using SQLite database at:', dbPath);
}

module.exports = sequelize;