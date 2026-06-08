const mongoose = require('mongoose');

const PlacementSchema = new mongoose.Schema({
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College',
    required: true
  },
  highestPackage: {
    type: Number, // In LPA (Lakhs Per Annum)
    required: true
  },
  averagePackage: {
    type: Number, // In LPA
    required: true
  },
  placementPercentage: {
    type: Number, // e.g. 85.5
    required: true,
    min: 0,
    max: 100
  },
  companiesVisited: [
    {
      name: {
        type: String,
        required: true
      },
      cpaRequired: {
        type: Number, // Minimum CPA / CGPA cutoff
        default: null
      },
      package: {
        type: Number, // Offered package in LPA
        default: null
      },
      type: {
        type: String,
        enum: ['Blocking', 'Non-Blocking'],
        default: 'Non-Blocking'
      },
      status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Approved'
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  year: {
    type: Number,
    required: true
  }
}, { timestamps: true });

PlacementSchema.index({ college: 1, year: -1 });

module.exports = mongoose.model('Placement', PlacementSchema);
