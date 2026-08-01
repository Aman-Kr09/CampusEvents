const mongoose = require('mongoose');

const RideShareSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  tripType: {
    type: String,
    required: true,
    enum: [
      'Airport',
      'Railway Station',
      'Metro Station',
      'Home',
      'Internship',
      'Hackathon',
      'Other'
    ],
    default: 'Other'
  },
  departureTime: {
    type: Date,
    required: true
  },
  totalSeats: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  availableSeats: {
    type: Number,
    required: true,
    min: 0
  },
  costPerSeat: {
    type: Number,
    default: 0,
    min: 0
  },
  vehicleType: {
    type: String,
    trim: true,
    default: 'Cab / Uber'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['Open', 'Full', 'Completed', 'Cancelled'],
    default: 'Open'
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  college: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'College'
  },
  passengers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    seatsBooked: {
      type: Number,
      default: 1
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

RideShareSchema.index({ college: 1, departureTime: 1 });
RideShareSchema.index({ tripType: 1, status: 1 });

module.exports = mongoose.model('RideShare', RideShareSchema);
