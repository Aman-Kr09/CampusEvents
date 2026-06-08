const mongoose = require('mongoose');
const User = require('../models/User');

const seedDefaultSuperAdmin = async () => {
  try {
    const superAdminExists = await User.findOne({ role: 'SuperAdmin' });
    if (!superAdminExists) {
      console.log('No SuperAdmin found in database. Seeding default SuperAdmin...');
      await User.create({
        name: 'Super Admin User',
        email: 'superadmin@campusevents.com',
        password: 'SuperAdminSecure123!',
        role: 'SuperAdmin'
      });
      console.log('Default SuperAdmin seeded: superadmin@campusevents.com / SuperAdminSecure123!');
    } else {
      console.log('SuperAdmin already exists in database.');
    }
  } catch (error) {
    console.error('Error seeding default SuperAdmin:', error.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/campusevents');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Run seeding
    await seedDefaultSuperAdmin();
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
