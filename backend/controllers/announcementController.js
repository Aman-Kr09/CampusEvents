const Announcement = require('../models/Announcement');

// @desc    Get all announcements for a college
// @route   GET /api/announcements
// @access  Private
exports.getAnnouncements = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const announcements = await Announcement.find({ college: collegeId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: announcements.length, data: announcements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create announcement (Admin only)
// @route   POST /api/announcements
// @access  Private (Admin)
exports.createAnnouncement = async (req, res) => {
  const { title, content } = req.body;

  try {
    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide TITLE and CONTENT' });
    }

    const collegeId = req.user.college._id;

    const announcement = await Announcement.create({
      college: collegeId,
      title,
      content,
      createdBy: req.user._id
    });

    const populated = await Announcement.findById(announcement._id).populate('createdBy', 'name email');

    res.status(201).json({ success: true, message: 'Announcement published successfully', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit announcement (Admin only)
// @route   PUT /api/announcements/:id
// @access  Private (Admin)
exports.editAnnouncement = async (req, res) => {
  try {
    let announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (announcement.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('createdBy', 'name email');

    res.status(200).json({ success: true, message: 'Announcement updated successfully', data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete announcement (Admin only)
// @route   DELETE /api/announcements/:id
// @access  Private (Admin)
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    if (announcement.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Announcement.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
