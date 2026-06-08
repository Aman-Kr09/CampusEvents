const Event = require('../models/Event');
const Question = require('../models/Question');
const Announcement = require('../models/Announcement');

// @desc    Smart Search Events, Questions, and Announcements (restricted to user's college)
// @route   GET /api/search
// @access  Private
exports.smartSearch = async (req, res) => {
  const { q } = req.query;
  const collegeId = req.user.college._id;

  try {
    if (!q || q.trim() === '') {
      return res.status(200).json({
        success: true,
        data: {
          events: [],
          questions: [],
          announcements: []
        }
      });
    }

    const regex = new RegExp(q, 'i');

    // 1. Search Events (Approved only, current college)
    const events = await Event.find({
      college: collegeId,
      status: 'Approved',
      $or: [
        { name: regex },
        { description: regex },
        { category: regex },
        { tags: { $in: [regex] } }
      ]
    }).limit(10);

    // 2. Search Questions (current college)
    const questions = await Question.find({
      college: collegeId,
      $or: [
        { title: regex },
        { content: regex }
      ]
    })
    .populate('user', 'name branch year')
    .limit(10);

    // 3. Search Announcements (current college)
    const announcements = await Announcement.find({
      college: collegeId,
      $or: [
        { title: regex },
        { content: regex }
      ]
    })
    .populate('createdBy', 'name')
    .limit(10);

    res.status(200).json({
      success: true,
      data: {
        events,
        questions,
        announcements
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
