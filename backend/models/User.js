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
    lowercase: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} is not a valid email address!`
    }
  },
  password: {
    type: String,
    required: function() {
      // Password is not strictly required if logging in via Google OAuth
      return !this.googleId;
    },
    validate: {
      validator: function(v) {
        // Skip validation if the password is empty (e.g. Google OAuth login)
        if (!v) return true;
        // Skip validation if the password is already a bcrypt hash (60 characters, starts with $2)
        if (v.startsWith('$2') && v.length === 60) {
          return true;
        }
        return v.length >= 6;
      },
      message: 'Password must be at least 6 characters long.'
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
  appliedJobs: [{
    jobId: { type: String, required: true },
    title: { type: String, required: true },
    company: { type: String, required: true },
    type: { type: String, default: 'Off-Campus' }, // 'On-Campus' | 'Off-Campus'
    applyUrl: { type: String, default: '#' },
    location: { type: String, default: '' },
    salary: { type: String, default: '' },
    appliedAt: { type: Date, default: Date.now }
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
