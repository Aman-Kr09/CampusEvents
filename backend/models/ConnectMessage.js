const mongoose = require('mongoose');

const ConnectMessageSchema = new mongoose.Schema({
  targetType: {
    type: String,
    required: true,
    enum: ['MarketplaceItem', 'RideShare']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

ConnectMessageSchema.index({ targetType: 1, targetId: 1, createdAt: 1 });

module.exports = mongoose.model('ConnectMessage', ConnectMessageSchema);
