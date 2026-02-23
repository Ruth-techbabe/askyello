require('dotenv').config();

//  LOG ENVIRONMENT VARIABLES AT STARTUP (VERY FIRST)
console.log('=== ENVIRONMENT CHECK ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET exists:', !!process.env.JWT_REFRESH_SECRET);
console.log('ADMIN_SECRET_KEY exists:', !!process.env.ADMIN_SECRET_KEY);
console.log('========================');

const app = require('./app');
const sequelize = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./utils/logger');
const cron = require('node-cron');
const reviewProcessingJob = require('./jobs/reviewProcessing.job');

const PORT = process.env.PORT || 5000;

//  HANDLE UNCAUGHT ERRORS
process.on('uncaughtException', (error) => {
  console.error(' UNCAUGHT EXCEPTION:', error);
  logger.error('UNCAUGHT EXCEPTION:', error);
  process.exit(1);
});

// HANDLE UNHANDLED PROMISE REJECTIONS
process.on('unhandledRejection', (reason, promise) => {
  console.error(' UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  logger.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

//  START SERVER WITH ENHANCED ERROR LOGGING
const startServer = async () => {
  try {
    // Database connection
    console.log('Connecting to database...');
    logger.info('Attempting database connection...');
    
    await sequelize.authenticate();
    
    console.log('Database connected successfully');
    logger.info('Database connection established');

    // Database sync in development
    if (process.env.NODE_ENV === 'development') {
      console.log(' Syncing database schema...');
      await sequelize.sync({ alter: true });
      console.log('Database synced');
      logger.info('Database synced');
    }

    // Redis connection
    console.log(' Connecting to Redis...');
    try {
      await connectRedis();
      console.log(' Redis connected');
      logger.info('Redis connection established');
    } catch (redisError) {
      console.warn(' Redis connection failed (non-fatal):', redisError.message);
      logger.warn('Redis connection failed (continuing without Redis):', redisError);
    }

    // Cron job for review processing
    console.log(' Setting up cron jobs...');
    cron.schedule('0 * * * *', () => {
      logger.info('Running scheduled review processing job');
      reviewProcessingJob.processPendingReviews();
    });
    console.log('Cron jobs scheduled');
    logger.info('Cron jobs initialized');

    // Start Express server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(' ================================');
      console.log(` Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(` API: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
      console.log(' ================================');
      
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });
  } catch (error) {
    console.error(' ================================');
    console.error(' SERVER STARTUP FAILED');
    console.error(' ================================');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error(' ================================');
    
    logger.error('Failed to start server:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    
    process.exit(1);
  }
};

// GRACEFUL SHUTDOWN HANDLERS
process.on('SIGTERM', async () => {
  console.log(' SIGTERM received, shutting down gracefully');
  logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await sequelize.close();
    console.log('Database connection closed');
    logger.info('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
    logger.error('Error closing database:', error);
  }
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log(' SIGINT received, shutting down gracefully');
  logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await sequelize.close();
    console.log('Database connection closed');
    logger.info('Database connection closed');
  } catch (error) {
    console.error('Error closing database:', error);
    logger.error('Error closing database:', error);
  }
  
  process.exit(0);
});


startServer();