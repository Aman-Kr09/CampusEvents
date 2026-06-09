const User = require('../models/User');
const College = require('../models/College');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const sendEmail = require('../config/mailer');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretcampuseventsjwtkey2026', {
    expiresIn: '30d'
  });
};

// @desc    Register a new student/user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password, collegeId, branch, year } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    // Verify college exists and is active
    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({ success: false, message: 'Selected College not found' });
    }
    if (college.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Selected college is pending approval or suspended' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'Student',
      college: collegeId,
      branch: branch || '',
      year: year || 1,
      interests: [] // Set via onboarding
    });

    const token = generateToken(user._id);

    // Populate college for return value
    const populatedUser = await User.findById(user._id).populate('college').select('-password');

    res.status(201).json({
      success: true,
      token,
      user: populatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login student/admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find user by email (and include password field)
    const user = await User.findOne({ email }).populate('college');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'Banned') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    // Remove password from user output object
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Google OAuth Authentication
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  const { name, email, googleId, collegeId, idToken } = req.body;

  try {
    let finalEmail = email;
    let finalName = name;
    let finalGoogleId = googleId;

    if (idToken) {
      try {
        const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        if (!verifyRes.ok) {
          return res.status(400).json({ success: false, message: 'Google authentication failed or expired token' });
        }
        const ticket = await verifyRes.json();
        
        // Match client ID (aud) if configured
        const clientID = process.env.GOOGLE_CLIENT_ID;
        if (clientID && ticket.aud !== clientID) {
          return res.status(400).json({ success: false, message: 'Google client ID verification mismatch' });
        }
        
        finalEmail = ticket.email;
        finalName = ticket.name || ticket.given_name || 'Google Student';
        finalGoogleId = ticket.sub;
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Failed to verify Google ID token: ' + err.message });
      }
    }

    if (!finalEmail) {
      return res.status(400).json({ success: false, message: 'Google Authentication requires a valid email address' });
    }

    let user = await User.findOne({ email: finalEmail }).populate('college');

    if (user) {
      // If user exists, log in
      if (user.status === 'Banned') {
        return res.status(403).json({ success: false, message: 'Your account has been suspended.' });
      }

      // If user doesn't have googleId stored, update it
      if (!user.googleId) {
        user.googleId = finalGoogleId;
        await user.save();
      }

      const token = generateToken(user._id);
      const userResponse = user.toObject();
      delete userResponse.password;

      return res.status(200).json({
        success: true,
        token,
        user: userResponse
      });
    }

    // If user does not exist, they must provide a collegeId to sign up
    if (!collegeId) {
      return res.status(200).json({
        success: false,
        needsCollegeSelection: true,
        email: finalEmail,
        name: finalName,
        googleId: finalGoogleId
      });
    }

    // Verify college is active
    const college = await College.findById(collegeId);
    if (!college || college.status !== 'Approved') {
      return res.status(400).json({ success: false, message: 'Invalid or unapproved college selection' });
    }

    // Register user via google credentials
    user = await User.create({
      name: finalName,
      email: finalEmail,
      googleId: finalGoogleId,
      role: 'Student',
      college: collegeId,
      interests: []
    });

    const token = generateToken(user._id);
    const populatedUser = await User.findById(user._id).populate('college');

    res.status(201).json({
      success: true,
      token,
      user: populatedUser
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate random 6 digit code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database
    await OTP.findOneAndDelete({ email }); // Clear older OTPs
    await OTP.create({ email, otp: otpCode });

    // Send OTP
    const message = `You requested a password reset. Your OTP is: ${otpCode}. This code is valid for 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0d0e12; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #6366f1;">CampusEvents Password Reset</h2>
        <p>You requested a password reset. Please use the following One-Time Password (OTP) to reset your password:</p>
        <div style="font-size: 32px; font-weight: bold; background-color: #1e1f29; padding: 15px; text-align: center; border-radius: 6px; letter-spacing: 4px; color: #a5b4fc; border: 1px solid #4f46e5;">
          ${otpCode}
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    await sendEmail({
      email,
      subject: 'CampusEvents - Password Reset OTP',
      message,
      html
    });

    res.status(200).json({ success: true, message: 'OTP sent successfully to email' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Email could not be sent. Please try again.' });
  }
};

// @desc    Verify OTP for password reset
// @route   POST /api/auth/verifyotp
// @access  Public
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Please provide email and OTP code' });
    }

    const record = await OTP.findOne({ email });
    if (!record) {
      return res.status(400).json({ success: false, message: 'OTP expired or not requested' });
    }

    if (record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP code' });
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Reset password using verified email
// @route   POST /api/auth/resetpassword
// @access  Public
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please fill in all fields' });
    }

    const record = await OTP.findOne({ email });
    if (!record || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP authentication session' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Set new password (pre-save hook hashes this)
    user.password = newPassword;
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ _id: record._id });

    res.status(200).json({ success: true, message: 'Password has been updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Save user selected interests & branch / year details
// @route   PUT /api/auth/profile/onboarding
// @access  Private
exports.saveOnboardingInterests = async (req, res) => {
  const { interests, branch, year } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (interests && Array.isArray(interests)) {
      user.interests = interests;
    }
    if (branch) user.branch = branch;
    if (year) user.year = year;

    await user.save();

    const updatedUser = await User.findById(user._id).populate('college').select('-password');

    res.status(200).json({
      success: true,
      message: 'Onboarding completed and profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('college')
      .populate('eventsJoined')
      .select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  const { name, branch, year, interests } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (interests && Array.isArray(interests)) user.interests = interests;

    await user.save();

    const updatedUser = await User.findById(req.user._id)
      .populate('college')
      .populate('eventsJoined')
      .select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
