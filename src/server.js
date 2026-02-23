require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/database');
const { connectRedis } = require('./config/redis');
const { logger } = require('./utils/logger');
const cron = require('node-cron');
const reviewProcessingJob = require('./jobs/reviewProcessing.job');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced');
    }

    await connectRedis();

    cron.schedule('0 * * * *', () => {
      logger.info('Running scheduled review processing job');
      reviewProcessingJob.processPendingReviews();
    });

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

startServer();
