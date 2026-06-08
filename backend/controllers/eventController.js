const Event = require('../models/Event');
const User = require('../models/User');
const { getRecommendations, generateTags } = require('../recommendation/recommendService');

// @desc    Get all approved events (For current college, optionally sorted by recommendations)
// @route   GET /api/events
// @access  Private
exports.getEvents = async (req, res) => {
  try {
    const collegeId = req.user.college._id;

    // Fetch approved events for the user's college
    const events = await Event.find({ college: collegeId, status: 'Approved' })
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get AI Recommended events
// @route   GET /api/events/recommended
// @access  Private
exports.getRecommendedEvents = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const interests = req.user.interests || [];

    // Fetch approved events for this college
    const events = await Event.find({ college: collegeId, status: 'Approved' });

    if (events.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Call python recommendation service
    const recommendedIds = await getRecommendations(interests, events);

    // Map events by ID for fast lookup
    const eventMap = {};
    events.forEach(e => {
      eventMap[e._id.toString()] = e;
    });

    // Reorder events based on recommended order
    const orderedEvents = [];
    recommendedIds.forEach(id => {
      if (eventMap[id]) {
        orderedEvents.push(eventMap[id]);
      }
    });

    // Append any events that might have been left out
    events.forEach(e => {
      if (!recommendedIds.includes(e._id.toString())) {
        orderedEvents.push(e);
      }
    });

    res.status(200).json({
      success: true,
      data: orderedEvents
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get upcoming timeline events (Sorted by date)
// @route   GET /api/events/timeline
// @access  Private
exports.getTimelineEvents = async (req, res) => {
  try {
    const collegeId = req.user.college._id;

    // Fetch future approved events
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await Event.find({
      college: collegeId,
      status: 'Approved',
      date: { $gte: today }
    })
      .sort({ date: 1 })
      .populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Trending Events
// @route   GET /api/events/trending
// @access  Private
exports.getTrendingEvents = async (req, res) => {
  try {
    const collegeId = req.user.college._id;

    // Fetch all approved events for college
    const events = await Event.find({ college: collegeId, status: 'Approved' });

    // Calculate ranking score: views + (likes * 5) + (registrations * 10)
    const scoredEvents = events.map(event => {
      const score = event.views +
        (event.likes ? event.likes.length * 5 : 0) +
        (event.registrations ? event.registrations.length * 10 : 0);
      return { event, score };
    });

    // Sort by score descending and take top 5
    scoredEvents.sort((a, b) => b.score - a.score);
    const trending = scoredEvents.slice(0, 5).map(item => item.event);

    res.status(200).json({
      success: true,
      data: trending
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit new event request (Student action)
// @route   POST /api/events
// @access  Private
exports.submitEvent = async (req, res) => {
  const { name, description, banner, date, time, venue, category, tags, registrationLink } = req.body;

  try {
    const collegeId = req.user.college._id;

    // Default to 'Approved' so events are visible immediately until moderated/deleted by Admin
    const status = 'Approved';

    const event = await Event.create({
      name,
      description,
      banner: banner || '',
      date,
      time,
      venue,
      category,
      tags: tags || [],
      registrationLink: registrationLink || '',
      college: collegeId,
      createdBy: req.user._id,
      status
    });

    res.status(201).json({
      success: true,
      message: status === 'Approved' ? 'Event created successfully' : 'Event submitted successfully. Awaiting Admin approval.',
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate AI Event Tags from description
// @route   POST /api/events/generate-tags
// @access  Private
exports.generateEventTags = async (req, res) => {
  const { description } = req.body;

  try {
    if (!description || description.trim().length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a descriptive text' });
    }

    const tags = await generateTags(description);
    res.status(200).json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register for Event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Toggle registration
    const isRegistered = event.registrations.includes(req.user._id);

    if (isRegistered) {
      // Unregister
      event.registrations = event.registrations.filter(id => id.toString() !== req.user._id.toString());
      await User.findByIdAndUpdate(req.user._id, { $pull: { eventsJoined: event._id } });
    } else {
      // Register
      event.registrations.push(req.user._id);
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { eventsJoined: event._id } });
    }

    await event.save();

    res.status(200).json({
      success: true,
      registered: !isRegistered,
      registrationsCount: event.registrations.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Like / Unlike Event
// @route   POST /api/events/:id/like
// @access  Private
exports.likeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const isLiked = event.likes.includes(req.user._id);

    if (isLiked) {
      event.likes = event.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      event.likes.push(req.user._id);
    }

    await event.save();

    res.status(200).json({
      success: true,
      liked: !isLiked,
      likesCount: event.likes.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Increment Event Views
// @route   POST /api/events/:id/view
// @access  Private
exports.incrementViews = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, views: event.views });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// COLLEGE ADMIN WORKFLOWS
// ==========================================

// @desc    Get all events pending review (Admin only)
// @route   GET /api/events/admin/pending
// @access  Private (Admin)
exports.getPendingEvents = async (req, res) => {
  try {
    const collegeId = req.user.college._id;

    const events = await Event.find({ college: collegeId, status: 'Pending' })
      .populate('createdBy', 'name email branch year')
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject event request (Admin only)
// @route   PUT /api/events/:id/review
// @access  Private (Admin)
exports.reviewEvent = async (req, res) => {
  const { status } = req.body; // Approved or Rejected

  try {
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status for review' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Verify admin belongs to same college
    if (event.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'You are not authorized to moderate this event' });
    }

    event.status = status;
    await event.save();

    // Give badge to user if they submit an event that gets approved!
    if (status === 'Approved') {
      const creator = await User.findById(event.createdBy);
      if (creator && !creator.badges.includes('Event Enthusiast')) {
        creator.badges.push('Event Enthusiast');
        await creator.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Event has been ${status.toLowerCase()}`,
      data: event
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit event details (Admin only)
// @route   PUT /api/events/:id
// @access  Private (Admin)
exports.editEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Event details updated successfully', data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete event (Admin only)
// @route   DELETE /api/events/:id
// @access  Private (Admin)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Clean reference in user registries
    await User.updateMany(
      { eventsJoined: event._id },
      { $pull: { eventsJoined: event._id } }
    );

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
