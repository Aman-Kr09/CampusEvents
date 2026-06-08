const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      // Password is not strictly required if logging in via Google OAuth
      return !this.googleId;
    }
  },
  googleId: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Student'],
    default: 'Student'
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: function() {
      // College is only required for Students and Admins, not SuperAdmin
      return this.role !== 'SuperAdmin';
    }
  },
  interests: {
    type: [String],
    default: []
  },
  branch: {
    type: String,
    default: ''
  },
  year: {
    type: Number,
    default: 1
  },
  eventsJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  badges: {
    type: [String],
    default: [] // e.g. ['Inquisitive', 'Event Enthusiast', 'Helper']
  },
  status: {
    type: String,
    enum: ['Active', 'Banned'],
    default: 'Active'
  }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
