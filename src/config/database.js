const { Sequelize } = require('sequelize');
const path = require('path');


// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User.model');
const Provider = require('../models/Provider.model');
const Review = require('../models/Review.model');
const ReviewFingerprint = require('../models/ReviewFingerprint.model');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    
    //  Production settings
    logging: process.env.NODE_ENV === 'production' ? false : console.log,
    
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    
    // for Railway MySQL
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' 
        ? {
            require: true,
            rejectUnauthorized: false, // Railway MySQL uses SSL
          }
        : false,
    },
  }
);
// Initialize models
User.init(sequelize);
Provider.init(sequelize);
Review.init(sequelize);
ReviewFingerprint.init(sequelize);

// Define associations
User.hasOne(Provider, { foreignKey: 'userId', as: 'providerProfile' });
Provider.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

Provider.hasMany(Review, { foreignKey: 'providerId', as: 'reviews' });
Review.belongsTo(Provider, { foreignKey: 'providerId', as: 'provider' });

User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

Provider.hasMany(ReviewFingerprint, { foreignKey: 'providerId' });
ReviewFingerprint.belongsTo(Provider, { foreignKey: 'providerId' });

module.exports = sequelize;

