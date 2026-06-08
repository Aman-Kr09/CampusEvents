const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  banner: {
    type: String, // Base64 or Image URL
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, // e.g. "14:00"
    required: true
  },
  venue: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Coding', 'AI/ML', 'Data Science', 'Robotics', 'Sports', 'Design',
      'Startups', 'Research', 'Placements', 'Hackathons', 'Music',
      'Photography', 'Cultural Events', 'Entrepreneurship'
    ]
  },
  tags: {
    type: [String],
    default: []
  },
  registrationLink: {
    type: String,
    trim: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  registrations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Pre-create indexes for search queries within a college
EventSchema.index({ college: 1, status: 1 });
EventSchema.index({ name: 'text', description: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('Event', EventSchema);
