require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusevents');
    console.log('Connected to database for seeding...');

    // Clear existing data
    console.log('Clearing existing data...');
    await mongoose.connection.dropDatabase();

    console.log('Creating Super Admin...');
    await User.create({
      name: 'Super Admin User',
      email: process.env.SUPER_ADMIN_EMAIL,
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: 'SuperAdmin'
    });

    console.log('Database seeding finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
