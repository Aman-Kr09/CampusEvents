const Razorpay = require('razorpay');
const crypto = require('crypto');
const Donor = require('../models/Donor');
const { enqueueEmail } = require('../queues/emailQueue');

// Keys must be set in environment variables (Render dashboard / .env)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpay = null;
if (razorpayKeyId && razorpayKeySecret) {
  razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret
  });
} else {
  console.warn('[Payment] RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set. Operating in simulation / test mode.');
}

// Helper to send thank-you email to donor
const sendDonorThankYouEmail = async (donorName, donorEmail, amount, message) => {
  if (!donorEmail) return;
  try {
    const subject = 'Thank You for Supporting CampusEvents! 💜';
    const text = `Hi ${donorName},\n\nThank you so much for your contribution of ₹${amount} to CampusEvents! Your generosity helps us maintain servers, scale student developer tools, and expand college portals.\n\nYour message: "${message || 'Thank you for your support!'}"\n\nBest regards,\nCampusEvents Team`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #0d0e12; color: #ffffff; border-radius: 8px;">
        <h2 style="color: #ec4899;">💖 Thank You for Your Support!</h2>
        <p>Hi <strong>${donorName}</strong>,</p>
        <p>We are deeply grateful for your contribution of <strong style="color: #34d399;">₹${amount}</strong> to CampusEvents.</p>
        <p>Your support directly enables us to host server infrastructure, improve AI study assistance, and empower engineering students across India.</p>
        ${message ? `<div style="background-color: #1a1c24; padding: 12px; border-radius: 6px; margin: 15px 0; border-left: 3px solid #818cf8;"><p style="font-size: 13px; color: #cbd5e1; italic; margin: 0;">"${message}"</p></div>` : ''}
        <p style="font-size: 12px; color: #94a3b8; margin-top: 20px;">You are featured on our Donor Shoutout Wall. Thank you for making a difference!</p>
      </div>
    `;
    await enqueueEmail({ email: donorEmail, subject, message: text, html });
  } catch (err) {
    console.warn('[Payment] Could not send donor thank you email:', err.message);
  }
};

// @desc    Create a new Razorpay order
// @route   POST /api/payment/create-order
// @access  Public
exports.createOrder = async (req, res) => {
  try {
    const { amount, donorName, donorEmail } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum donation amount is ₹10.' });
    }

    const amountInPaise = Math.round(parseFloat(amount) * 100);

    if (!razorpay) {
      // Fallback simulation order if Razorpay credentials are not yet configured in env
      const simOrderId = `order_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return res.status(200).json({
        success: true,
        order_id: simOrderId,
        amount: amountInPaise,
        currency: 'INR',
        key_id: 'rzp_test_simulation'
      });
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      notes: {
        donorName: donorName || 'Supporter',
        donorEmail: donorEmail || '',
        platform: 'CampusEvents'
      }
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayKeyId
    });
  } catch (error) {
    console.error('[Payment] Razorpay create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order with Razorpay.'
    });
  }
};

// @desc    Verify Razorpay payment signature + save donor record
// @route   POST /api/payment/verify-payment
// @access  Public
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      donorName,
      donorEmail,
      donorCollege,
      donorMessage,
      amount
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay order or payment parameters.' });
    }

    // Verify signature if razorpaySecret is configured
    if (razorpayKeySecret && razorpay_signature) {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Payment signature verification failed. Payment not accepted.'
        });
      }
    }

    // Save donor record to DB
    try {
      await Donor.create({
        name: donorName || 'Anonymous',
        email: donorEmail || '',
        college: donorCollege || '',
        message: donorMessage || '',
        amount: parseFloat(amount) || 0,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });

      sendDonorThankYouEmail(donorName || 'Supporter', donorEmail, amount, donorMessage);
    } catch (dbErr) {
      console.warn('[Payment] Could not save donor record:', dbErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id
    });
  } catch (error) {
    console.error('[Payment] Signature verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent donors (public shoutout wall)
// @route   GET /api/payment/donors
// @access  Public
exports.getDonors = async (req, res) => {
  try {
    const donors = await Donor.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('name college message amount createdAt');

    res.status(200).json({ success: true, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
