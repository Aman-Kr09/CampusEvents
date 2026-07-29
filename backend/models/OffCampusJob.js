const mongoose = require('mongoose');

const OffCampusJobSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    default: null,
    trim: true
  },
  employmentType: {
    type: String,
    enum: ['Full-Time', 'Internship', 'Contract', 'Part-Time', 'FTE+PPO'],
    default: 'Full-Time'
  },
  experience: {
    type: String, // e.g. "0–2 years", "Fresher"
    default: null,
    trim: true
  },
  salary: {
    type: String, // e.g. "12–18 LPA", "Not Disclosed"
    default: null,
    trim: true
  },
  source: {
    type: String, // e.g. "LinkedIn", "Naukri", "Internshala"
    default: null,
    trim: true
  },
  sourceLogo: {
    type: String, // URL to portal logo/favicon
    default: null
  },
  applyUrl: {
    type: String,
    required: true,
    trim: true
  },
  postedAt: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    default: null
  },
  skills: {
    type: [String],
    default: []
  },
  logo: {
    type: String, // Company logo URL
    default: null
  },
  description: {
    type: String,
    default: null,
    trim: true
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

OffCampusJobSchema.index({ college: 1, postedAt: -1 });

module.exports = mongoose.model('OffCampusJob', OffCampusJobSchema);
