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

// Diagnostics endpoints
router.get('/test-smtp', async (req, res) => {
  const nodemailer = require('nodemailer');
  const results = {};
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return res.json({ success: false, error: 'No SMTP credentials in env' });
  }

  // 1. Test port 587 secure: false
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });
    await transporter.verify();
    results.port587 = 'Success';
  } catch (err) {
    results.port587 = `Failed: ${err.message}`;
  }

  // 2. Test port 465 secure: true
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });
    await transporter.verify();
    results.port465 = 'Success';
  } catch (err) {
    results.port465 = `Failed: ${err.message}`;
  }

  // 3. Test service: 'gmail'
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });
    await transporter.verify();
    results.serviceGmail = 'Success';
  } catch (err) {
    results.serviceGmail = `Failed: ${err.message}`;
  }

  res.json({ success: true, results });
});

router.get('/test-relay', async (req, res) => {
  const results = {};
  const relayUrl = process.env.GMAIL_RELAY_URL;
  
  if (!relayUrl) {
    return res.json({ success: false, error: 'GMAIL_RELAY_URL is not set in env variables' });
  }
  
  results.relayUrlMasked = relayUrl.substring(0, 35) + '... (len: ' + relayUrl.length + ')';
  
  try {
    const fetchRes = await fetch(relayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: process.env.SMTP_USER || 'test@example.com',
        subject: 'CampusEvents Relay Diagnostic Test',
        body: 'Relay Diagnostic Test message',
        html: '<p>Relay Diagnostic Test message</p>'
      })
    });
    
    results.status = fetchRes.status;
    results.statusText = fetchRes.statusText;
    
    const text = await fetchRes.text();
    results.body = text;
    
    try {
      results.json = JSON.parse(text);
    } catch (e) {
      results.json = 'Not JSON';
    }
  } catch (err) {
    results.error = err.message;
    results.stack = err.stack;
  }
  
  res.json({ success: true, results });
});

module.exports = router;
