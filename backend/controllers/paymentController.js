const Razorpay = require('razorpay');
const crypto = require('crypto');

// Keys must be set in environment variables (Render dashboard / .env)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error('[Payment] RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables.');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId || '',
  key_secret: razorpayKeySecret || ''
});


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

// @desc    Verify Razorpay payment signature
// @route   POST /api/payment/verify-payment
// @access  Public
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay signature parameters.' });
    }

    // Generate expected HMAC SHA256 signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      // Signature mismatch — reject payment (could be tampered data)
      res.status(400).json({
        success: false,
        message: 'Payment signature verification failed. Payment not accepted.'
      });
    }
  } catch (error) {
    console.error('[Payment] Signature verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
