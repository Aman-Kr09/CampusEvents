const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

AnnouncementSchema.index({ college: 1, createdAt: -1 });
AnnouncementSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
