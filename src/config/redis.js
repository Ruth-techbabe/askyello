const Redis = require('ioredis');

let redisClient = null;

const connectRedis = async () => {
  //  CHECK IF REDIS IS CONFIGURED
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT;

  // Skip Redis if not configured
  if (!redisHost || redisHost === 'localhost' || redisHost === '127.0.0.1') {
    console.log('Redis not configured - skipping Redis connection');
    console.log('App will continue without caching (this is fine for now)');
    return null;
  }

  console.log(` Attempting Redis connection to ${redisHost}:${redisPort}...`);

  try {
    redisClient = new Redis({
      host: redisHost,
      port: parseInt(redisPort || '6379'),
      connectTimeout: 5000, // 5 second timeout
      retryStrategy: () => null, // Don't retry
      lazyConnect: true,
      enableOfflineQueue: false,
    });

    // Try to connect with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout after 5s')), 5000)
      ),
    ]);

    await redisClient.ping();
    console.log('Redis connected successfully');
    return redisClient;
    
  } catch (error) {
    console.warn('Redis connection failed:', error.message);
    console.warn('Continuing without Redis (app will work normally)');
    
    // Clean up failed connection
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch (e) {
        // Ignore
      }
    }
    
    redisClient = null;
    return null;
  }
};

const getRedisClient = () => {
  return redisClient;
};

module.exports = { 
  connectRedis, 
  getRedisClient 
};