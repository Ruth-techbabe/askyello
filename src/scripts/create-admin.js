const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const User = require('../models/User.model');

const createAdmin = async () => {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connected...\n');

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: process.env.ADMIN_EMAIL || 'oziomachukwumichelle31@gmail.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      process.exit(0);
    }

    // Hash password
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'ASKYELLO@2026';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await User.create({
      email: process.env.ADMIN_EMAIL || 'oziomachukwumichelle31@gmail.com',
      password: hashedPassword,
      name: 'System Administrator',
      role: 'admin',
      emailVerified: true,
      isActive: true,
    });

    console.log(' Admin account created successfully!');
    console.log('=========================================');
    console.log('Email:    ', admin.email);
    console.log('Password: ', adminPassword);
    console.log('Role:     ', admin.role);
    console.log('ID:       ', admin.id);
    console.log('=========================================');
    console.log('IMPORTANT: Save these credentials safely!');
    console.log('Change password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error.message);
    process.exit(1);
  }
};

createAdmin();