const College = require('../models/College');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all approved colleges
// @route   GET /api/colleges
// @access  Public
exports.getApprovedColleges = async (req, res) => {
  try {
    const colleges = await College.find({ status: 'Approved' }).sort({ name: 1 });
    res.status(200).json({ success: true, count: colleges.length, data: colleges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request a new college (Pending status)
// @route   POST /api/colleges/request
// @access  Public
exports.requestNewCollege = async (req, res) => {
  const { name, state, website, description, logo, requestedByName, requestedByEmail } = req.body;

  try {
    if (!name || !state) {
      return res.status(400).json({ success: false, message: 'Please provide college name and state' });
    }

    if (!requestedByName || !requestedByEmail) {
      return res.status(400).json({ success: false, message: 'Please provide your name and email so we can contact you' });
    }

    const collegeExists = await College.findOne({ name });
    if (collegeExists) {
      return res.status(400).json({ success: false, message: 'A college with this name is already registered or requested' });
    }

    const newCollege = await College.create({
      name,
      state,
      website: website || '',
      description: description || '',
      logo: logo || '',
      status: 'Pending',
      requestedBy: {
        name: requestedByName,
        email: requestedByEmail
      }
    });

    res.status(201).json({
      success: true,
      message: 'College request submitted successfully. Awaiting Super Admin approval. You will be made admin of this college once approved.',
      data: newCollege
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
