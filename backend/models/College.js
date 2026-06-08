const mongoose = require('mongoose');

const CollegeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String, // Base64 or URL
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Suspended'],
    default: 'Pending'
  },
  requestedBy: {
    name: { type: String, default: '' },
    email: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('College', CollegeSchema);
