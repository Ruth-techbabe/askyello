const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = require('../config/database');
const User = require('../models/User.model');
const Provider = require('../models/Provider.model');
const Review = require('../models/Review.model');
const { v4: uuidv4 } = require('uuid');

const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database synced');

    const users = await User.bulkCreate([
      {
        googleId: 'test-google-id-1',
        email: 'ozdmichelle90@gmail.com',
        name: 'Okoye Michelle',
        picture: 'https://drive.google.com/file/d/1x-5kKRm0lEy0_CHx9tHpy_NNx6cC1lIL',
        role: 'provider',
      },
      {
        googleId: 'test-google-id-2',
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        picture: 'https://via.placeholder.com/150',
        role: 'provider',
      },
      {
        googleId: 'test-google-id-3',
        email: 'mike.wilson@example.com',
        name: 'Mike Wilson',
        picture: 'https://via.placeholder.com/150',
        role: 'user',
      },
    ]);

    console.log('Created test users');

    const providers = await Provider.bulkCreate([
      {
        userId: users[0].id,
        businessName: 'QuickFix Plumbing',
        description: 'Professional plumbing services',
        category: 'plumbing',
        subCategories: ['pipe repair', 'installation'],
        phoneNumber: '+234-800-PLUMBER',
        whatsappNumber: '+234-800-PLUMBER',
        address: '123 Main Street, Lagos, Nigeria',
        latitude: 6.5244,
        longitude: 3.3792,
        placeId: 'test-place-id-1',
        services: ['Emergency repairs', 'Pipe installation'],
        averageRating: 4.5,
        totalReviews: 12,
        verificationStatus: 'verified',
        workingHours: {
          monday: '8:00 AM - 6:00 PM',
          tuesday: '8:00 AM - 6:00 PM',
          wednesday: '8:00 AM - 6:00 PM',
          thursday: '8:00 AM - 6:00 PM',
          friday: '8:00 AM - 6:00 PM',
          saturday: '9:00 AM - 2:00 PM',
          sunday: 'Closed',
        },
      },
      {
        userId: users[1].id,
        businessName: 'Sparkle Cleaning Services',
        description: 'Top-rated cleaning services',
        category: 'cleaning',
        subCategories: ['home cleaning', 'office cleaning'],
        phoneNumber: '+234-800-CLEAN',
        whatsappNumber: '+234-800-CLEAN',
        address: '456 Victoria Island, Lagos, Nigeria',
        latitude: 6.4281,
        longitude: 3.4219,
        placeId: 'test-place-id-2',
        services: ['Regular cleaning', 'Deep cleaning'],
        averageRating: 4.8,
        totalReviews: 28,
        verificationStatus: 'verified',
        workingHours: {
          monday: '7:00 AM - 7:00 PM',
          sunday: '9:00 AM - 3:00 PM',
        },
      },
    ]);

    console.log('Created test providers');

    await Review.bulkCreate([
      {
        providerId: providers[0].id,
        userId: users[2].id,
        rating: 5,
        comment: 'Excellent service! Fixed my leak quickly.',
        status: 'approved',
        weight: 1.2,
        sentimentScore: 0.9,
        fingerprintId: uuidv4(),
        approvedAt: new Date(),
      },
      {
        providerId: providers[1].id,
        userId: users[2].id,
        rating: 5,
        comment: 'Amazing cleaning service!',
        status: 'approved',
        weight: 1.5,
        sentimentScore: 0.95,
        fingerprintId: uuidv4(),
        approvedAt: new Date(),
      },
    ]);

    console.log('Created test reviews');
    console.log('\nDatabase seeded successfully!\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
