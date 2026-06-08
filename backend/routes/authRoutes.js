const express = require('express');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  forgotPassword,
  verifyOTP,
  resetPassword,
  saveOnboardingInterests,
  getMe,
  updateProfile
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/forgotpassword', forgotPassword);
router.post('/verifyotp', verifyOTP);
router.post('/resetpassword', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/profile/onboarding', protect, saveOnboardingInterests);

module.exports = router;
