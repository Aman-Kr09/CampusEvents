const mongoose = require('mongoose');

const MarketplaceItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Books',
      'Calculators',
      'Lab Coats',
      'Cycles',
      'Hostel Essentials',
      'Electronics',
      'Clothing',
      'Other'
    ],
    default: 'Other'
  },
  condition: {
    type: String,
    enum: ['Brand New', 'Like New', 'Good', 'Fair'],
    default: 'Good'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isGiveaway: {
    type: Boolean,
    default: false
  },
  pickupLocation: {
    type: String,
    required: true,
    trim: true
  },
  images: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['Available', 'Sold'],
    default: 'Available'
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

MarketplaceItemSchema.index({ college: 1, createdAt: -1 });
MarketplaceItemSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('MarketplaceItem', MarketplaceItemSchema);
