require('dotenv').config();
const { createClient } = require('redis');

async function testRedis() {
  const client = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    },
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
  });

  client.on('connect', () => {
    console.log('🔄 Connecting to Redis...');
  });

  client.on('ready', () => {
    console.log('✅ Redis is ready!');
  });

  try {
    // Connect
    await client.connect();
    console.log('✅ Successfully connected to Redis!');

    // Test SET
    await client.set('test_key', 'Hello from Node.js!');
    console.log('✅ SET operation successful');

    // Test GET
    const value = await client.get('test_key');
    console.log('✅ GET operation successful');
    console.log('📦 Retrieved value:', value);

    // Test expiry
    await client.setEx('temp_key', 10, 'Expires in 10 seconds');
    console.log('✅ SET with expiry successful');

    // Disconnect
    await client.disconnect();
    console.log('✅ Disconnected from Redis');

    console.log('\n🎉 All Redis tests passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    console.error('\n💡 Make sure Redis server is running:');
    console.error('   Windows: redis-server');
    process.exit(1);
  }
}

testRedis();