const College = require('../models/College');
const User = require('../models/User');
const Event = require('../models/Event');
const Question = require('../models/Question');

// @desc    Get Global Platform Analytics
// @route   GET /api/superadmin/analytics
// @access  Private (SuperAdmin)
exports.getGlobalAnalytics = async (req, res) => {
  try {
    const totalColleges = await College.countDocuments();
    const approvedColleges = await College.countDocuments({ status: 'Approved' });
    const pendingColleges = await College.countDocuments({ status: 'Pending' });
    const suspendedColleges = await College.countDocuments({ status: 'Suspended' });

    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'Student' });
    const totalAdmins = await User.countDocuments({ role: 'Admin' });

    const totalEvents = await Event.countDocuments();
    const approvedEvents = await Event.countDocuments({ status: 'Approved' });
    const pendingEvents = await Event.countDocuments({ status: 'Pending' });

    const totalQuestions = await Question.countDocuments();

    res.status(200).json({
      success: true,
      analytics: {
        colleges: { total: totalColleges, approved: approvedColleges, pending: pendingColleges, suspended: suspendedColleges },
        users: { total: totalUsers, students: totalStudents, admins: totalAdmins },
        events: { total: totalEvents, approved: approvedEvents, pending: pendingEvents },
        questions: { total: totalQuestions }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List all colleges (with filters)
// @route   GET /api/superadmin/colleges
// @access  Private (SuperAdmin)
exports.getColleges = async (req, res) => {
  try {
    const colleges = await College.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: colleges.length, data: colleges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Reject/Suspend a college
// @route   PUT /api/superadmin/colleges/:id/status
// @access  Private (SuperAdmin)
exports.updateCollegeStatus = async (req, res) => {
  const { status } = req.body; // Approved, Suspended, etc.

  try {
    if (!['Approved', 'Suspended', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const previousStatus = college.status;
    college.status = status;
    await college.save();

    let adminCreated = null;

    // Auto-create admin account when approving a college for the first time
    if (status === 'Approved' && previousStatus === 'Pending' &&
        college.requestedBy && college.requestedBy.email) {

      const existingUser = await User.findOne({ email: college.requestedBy.email });
      if (!existingUser) {
        // Generate a default password
        const defaultPassword = `Campus@${college.name.replace(/\s+/g, '').substring(0, 6)}123`;

        const newAdmin = await User.create({
          name: college.requestedBy.name || 'College Admin',
          email: college.requestedBy.email,
          password: defaultPassword,
          role: 'Admin',
          college: college._id
        });

        adminCreated = {
          name: newAdmin.name,
          email: newAdmin.email,
          tempPassword: defaultPassword
        };
      }
    }

    res.status(200).json({
      success: true,
      message: `College status successfully updated to ${status}`,
      data: college,
      adminCreated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Create a College Admin Account
// @route   POST /api/superadmin/admins
// @access  Private (SuperAdmin)
exports.createCollegeAdmin = async (req, res) => {
  const { name, email, password, collegeId } = req.body;

  try {
    if (!name || !email || !password || !collegeId) {
      return res.status(400).json({ success: false, message: 'Please provide all details' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Verify college exists
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    const adminUser = await User.create({
      name,
      email,
      password,
      role: 'Admin',
      college: collegeId
    });

    res.status(201).json({
      success: true,
      message: `College Admin account created successfully for ${college.name}`,
      data: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        college: college.name
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a College
// @route   DELETE /api/superadmin/colleges/:id
// @access  Private (SuperAdmin)
exports.deleteCollege = async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: 'College not found' });
    }

    // Perform cascade delete or keep clean: let's delete the college object
    await College.findByIdAndDelete(req.params.id);

    // Clean up users registered to this college (optionally suspend/ban/delete)
    await User.deleteMany({ college: req.params.id });
    await Event.deleteMany({ college: req.params.id });
    await Question.deleteMany({ college: req.params.id });

    res.status(200).json({
      success: true,
      message: 'College and all associated accounts/events/discussions deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
