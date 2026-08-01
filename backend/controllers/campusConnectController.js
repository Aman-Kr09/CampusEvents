const MarketplaceItem = require('../models/MarketplaceItem');
const RideShare = require('../models/RideShare');
const ConnectMessage = require('../models/ConnectMessage');

// ─── MARKETPLACE CONTROLLERS ──────────────────────────────────────────────────

// GET /api/campus-connect/marketplace
exports.getMarketplaceItems = async (req, res) => {
  try {
    const { search, category, condition, isGiveaway, status, savedOnly } = req.query;
    const filter = {};

    // Filter by user college if applicable (SuperAdmin can see all)
    if (req.user.role !== 'SuperAdmin' && req.user.college) {
      const collegeId = req.user.college._id || req.user.college;
      filter.college = collegeId;
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (condition && condition !== 'All') {
      filter.condition = condition;
    }

    if (isGiveaway === 'true') {
      filter.isGiveaway = true;
    } else if (isGiveaway === 'false') {
      filter.isGiveaway = false;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (savedOnly === 'true') {
      filter.savedBy = req.user._id;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { pickupLocation: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await MarketplaceItem.find(filter)
      .populate('seller', 'name email branch year role')
      .populate('college', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching marketplace items:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching marketplace items' });
  }
};

// POST /api/campus-connect/marketplace
exports.createMarketplaceItem = async (req, res) => {
  try {
    const { title, description, category, condition, price, pickupLocation, images } = req.body;

    if (!title || !description || !pickupLocation || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, price, and pickup location'
      });
    }

    const numPrice = Number(price);
    const isGiveaway = numPrice === 0;

    const item = await MarketplaceItem.create({
      title,
      description,
      category: category || 'Other',
      condition: condition || 'Good',
      price: numPrice,
      isGiveaway,
      pickupLocation,
      images: Array.isArray(images) ? images : (images ? [images] : []),
      seller: req.user._id,
      college: req.user.college?._id || req.user.college || null
    });

    const populatedItem = await MarketplaceItem.findById(item._id)
      .populate('seller', 'name email branch year role')
      .populate('college', 'name code');

    res.status(201).json({
      success: true,
      message: 'Item listed successfully!',
      data: populatedItem
    });
  } catch (error) {
    console.error('Error creating marketplace item:', error);
    res.status(500).json({ success: false, message: 'Failed to create marketplace listing' });
  }
};

// POST /api/campus-connect/marketplace/:id/save
exports.toggleSaveItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const userIdStr = req.user._id.toString();
    const index = item.savedBy.findIndex(id => id.toString() === userIdStr);

    if (index > -1) {
      item.savedBy.splice(index, 1);
    } else {
      item.savedBy.push(req.user._id);
    }

    await item.save();

    res.status(200).json({
      success: true,
      saved: index === -1,
      savedBy: item.savedBy
    });
  } catch (error) {
    console.error('Error toggling save on marketplace item:', error);
    res.status(500).json({ success: false, message: 'Server error toggling saved state' });
  }
};

// PATCH /api/campus-connect/marketplace/:id/status
exports.markItemAsSold = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Only seller can mark as sold
    if (item.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the seller can update item status' });
    }

    const newStatus = req.body.status || (item.status === 'Available' ? 'Sold' : 'Available');
    item.status = newStatus;
    await item.save();

    const populatedItem = await MarketplaceItem.findById(item._id)
      .populate('seller', 'name email branch year role')
      .populate('college', 'name code');

    res.status(200).json({
      success: true,
      message: `Item marked as ${item.status}`,
      data: populatedItem
    });
  } catch (error) {
    console.error('Error updating item status:', error);
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// DELETE /api/campus-connect/marketplace/:id
exports.deleteMarketplaceItem = async (req, res) => {
  try {
    const item = await MarketplaceItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const isSeller = item.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

    if (!isSeller && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admins or the seller can delete listings.' });
    }

    await MarketplaceItem.findByIdAndDelete(req.params.id);
    // Also delete associated messages
    await ConnectMessage.deleteMany({ targetType: 'MarketplaceItem', targetId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Marketplace listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting marketplace item:', error);
    res.status(500).json({ success: false, message: 'Server error deleting listing' });
  }
};

// ─── RIDE SHARING CONTROLLERS ──────────────────────────────────────────────────

// GET /api/campus-connect/rides
exports.getRideShares = async (req, res) => {
  try {
    const { search, tripType, status } = req.query;
    const filter = {};

    if (req.user.role !== 'SuperAdmin' && req.user.college) {
      const collegeId = req.user.college._id || req.user.college;
      filter.college = collegeId;
    }

    if (tripType && tripType !== 'All') {
      filter.tripType = tripType;
    }

    if (status && status !== 'All') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { origin: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { vehicleType: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const rides = await RideShare.find(filter)
      .populate('creator', 'name email branch year role')
      .populate('passengers.user', 'name email branch year role')
      .populate('college', 'name code')
      .sort({ departureTime: 1 });

    res.status(200).json({
      success: true,
      count: rides.length,
      data: rides
    });
  } catch (error) {
    console.error('Error fetching ride shares:', error);
    res.status(500).json({ success: false, message: 'Server error fetching rides' });
  }
};

// POST /api/campus-connect/rides
exports.createRideShare = async (req, res) => {
  try {
    const { origin, destination, tripType, departureTime, totalSeats, costPerSeat, vehicleType, notes } = req.body;

    if (!origin || !destination || !departureTime || !totalSeats) {
      return res.status(400).json({
        success: false,
        message: 'Please provide origin, destination, departure time, and total seats'
      });
    }

    const seats = parseInt(totalSeats, 10);
    if (isNaN(seats) || seats < 1) {
      return res.status(400).json({ success: false, message: 'Total seats must be at least 1' });
    }

    const ride = await RideShare.create({
      origin,
      destination,
      tripType: tripType || 'Other',
      departureTime: new Date(departureTime),
      totalSeats: seats,
      availableSeats: seats,
      costPerSeat: Number(costPerSeat) || 0,
      vehicleType: vehicleType || 'Cab / Uber',
      notes: notes || '',
      creator: req.user._id,
      college: req.user.college?._id || req.user.college || null,
      passengers: []
    });

    const populatedRide = await RideShare.findById(ride._id)
      .populate('creator', 'name email branch year role')
      .populate('passengers.user', 'name email branch year role')
      .populate('college', 'name code');

    res.status(201).json({
      success: true,
      message: 'Ride post created successfully!',
      data: populatedRide
    });
  } catch (error) {
    console.error('Error creating ride share:', error);
    res.status(500).json({ success: false, message: 'Failed to create ride post' });
  }
};

// POST /api/campus-connect/rides/:id/join
exports.joinRideShare = async (req, res) => {
  try {
    const ride = await RideShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.creator.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You are the creator of this ride' });
    }

    const alreadyJoined = ride.passengers.some(
      p => p.user.toString() === req.user._id.toString()
    );

    if (alreadyJoined) {
      return res.status(400).json({ success: false, message: 'You have already joined this ride' });
    }

    if (ride.availableSeats <= 0) {
      return res.status(400).json({ success: false, message: 'This ride is fully booked' });
    }

    ride.passengers.push({ user: req.user._id, seatsBooked: 1 });
    ride.availableSeats = Math.max(0, ride.availableSeats - 1);
    if (ride.availableSeats === 0) {
      ride.status = 'Full';
    }

    await ride.save();

    const populatedRide = await RideShare.findById(ride._id)
      .populate('creator', 'name email branch year role')
      .populate('passengers.user', 'name email branch year role')
      .populate('college', 'name code');

    res.status(200).json({
      success: true,
      message: 'Joined ride successfully!',
      data: populatedRide
    });
  } catch (error) {
    console.error('Error joining ride share:', error);
    res.status(500).json({ success: false, message: 'Server error joining ride' });
  }
};

// POST /api/campus-connect/rides/:id/leave
exports.leaveRideShare = async (req, res) => {
  try {
    const ride = await RideShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const passengerIndex = ride.passengers.findIndex(
      p => p.user.toString() === req.user._id.toString()
    );

    if (passengerIndex === -1) {
      return res.status(400).json({ success: false, message: 'You are not in this ride' });
    }

    ride.passengers.splice(passengerIndex, 1);
    ride.availableSeats = Math.min(ride.totalSeats, ride.availableSeats + 1);
    if (ride.availableSeats > 0 && ride.status === 'Full') {
      ride.status = 'Open';
    }

    await ride.save();

    const populatedRide = await RideShare.findById(ride._id)
      .populate('creator', 'name email branch year role')
      .populate('passengers.user', 'name email branch year role')
      .populate('college', 'name code');

    res.status(200).json({
      success: true,
      message: 'Left ride successfully',
      data: populatedRide
    });
  } catch (error) {
    console.error('Error leaving ride share:', error);
    res.status(500).json({ success: false, message: 'Server error leaving ride' });
  }
};

// DELETE /api/campus-connect/rides/:id
exports.deleteRideShare = async (req, res) => {
  try {
    const ride = await RideShare.findById(req.params.id);
    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const isCreator = ride.creator.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admins or the creator can delete rides.' });
    }

    await RideShare.findByIdAndDelete(req.params.id);
    await ConnectMessage.deleteMany({ targetType: 'RideShare', targetId: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Ride post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting ride share:', error);
    res.status(500).json({ success: false, message: 'Server error deleting ride' });
  }
};

// ─── CHAT CONTROLLERS ─────────────────────────────────────────────────────────

// GET /api/campus-connect/chat/:targetType/:targetId
exports.getConnectMessages = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    if (!['MarketplaceItem', 'RideShare'].includes(targetType)) {
      return res.status(400).json({ success: false, message: 'Invalid chat target type' });
    }

    const messages = await ConnectMessage.find({ targetType, targetId })
      .populate('sender', 'name email branch year role')
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ success: false, message: 'Server error fetching chat messages' });
  }
};

// POST /api/campus-connect/chat/:targetType/:targetId
exports.sendConnectMessage = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    if (!['MarketplaceItem', 'RideShare'].includes(targetType)) {
      return res.status(400).json({ success: false, message: 'Invalid target type' });
    }

    const message = await ConnectMessage.create({
      targetType,
      targetId,
      sender: req.user._id,
      text: text.trim()
    });

    const populatedMsg = await ConnectMessage.findById(message._id)
      .populate('sender', 'name email branch year role');

    // Emit socket event if io exists
    const io = req.app.get('io');
    if (io) {
      const room = `connect:${targetType.toLowerCase()}:${targetId}`;
      io.to(room).emit('new_connect_message', populatedMsg);
    }

    res.status(201).json({
      success: true,
      data: populatedMsg
    });
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ success: false, message: 'Failed to send chat message' });
  }
};
