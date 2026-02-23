require('dotenv').config();

console.log('Testing environment variables...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : '❌ NOT SET');

const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('\n✅ MySQL connection successful!');
    
    const [rows] = await connection.execute('SELECT DATABASE() as db, USER() as user');
    console.log('✅ Connected to database:', rows[0].db);
    console.log('✅ Connected as user:', rows[0].user);
    
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error('\nCheck your .env file:');
    console.error('- DB_USER should be: root (or your MySQL username)');
    console.error('- DB_PASSWORD should be: your actual MySQL password');
    console.error('- DB_NAME should be: sme_marketplace');
    process.exit(1);
  }
}

testConnection();