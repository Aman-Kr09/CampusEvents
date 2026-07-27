const mongoose = require('mongoose');

const PYQSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true,
    index: true
  },
  subjectName: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  academicYear: {
    type: String,   // e.g. "2023-24"
    required: true,
    trim: true
  },
  examType: {
    type: String,
    required: true,
    enum: ['Mid Semester', 'End Semester', 'Quiz', 'Assignment']
  },
  // Cloudinary storage references (no files on server)
  fileUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image'],
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Bookmarks — array of user IDs who bookmarked this PYQ
  bookmarkedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

// Composite indexes for fast filtered queries
PYQSchema.index({ college: 1, semester: 1 });
PYQSchema.index({ college: 1, department: 1 });
PYQSchema.index({ college: 1, semester: 1, department: 1 });
PYQSchema.index({ college: 1, subjectName: 'text', courseCode: 'text' });

module.exports = mongoose.model('PYQ', PYQSchema);
