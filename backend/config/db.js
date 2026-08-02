const mongoose = require('mongoose');
const User = require('../models/User');

const bcrypt = require('bcryptjs');

const seedDefaultSuperAdmin = async () => {
  try {
    const targetEmail = process.env.SUPER_ADMIN_EMAIL;
    const targetPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!targetEmail || !targetPassword) {
      console.log('[DB] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not configured in environment. Skipping auto-seeding.');
      return;
    }

    // Remove any outdated default SuperAdmin with old email if present
    await User.deleteMany({ role: 'SuperAdmin', email: { $ne: targetEmail } });

    let superAdmin = await User.findOne({ email: targetEmail });
    if (!superAdmin) {
      superAdmin = await User.findOne({ role: 'SuperAdmin' });
    }

    if (superAdmin) {
      superAdmin.email = targetEmail;
      superAdmin.password = targetPassword; // pre('save') hook will hash it ONCE
      superAdmin.role = 'SuperAdmin';
      superAdmin.name = 'Super Admin';
      await superAdmin.save();
      console.log(`[DB] SuperAdmin credentials updated for ${targetEmail}`);
    } else {
      await User.create({
        name: 'Super Admin',
        email: targetEmail,
        password: targetPassword, // pre('save') hook will hash it ONCE
        role: 'SuperAdmin'
      });
      console.log(`[DB] SuperAdmin created for ${targetEmail}`);
    }
  } catch (error) {
    console.error('Error seeding/updating SuperAdmin:', error.message);
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
