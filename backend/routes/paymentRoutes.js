const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getDonors } = require('../controllers/paymentController');

// Public donation endpoints
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);
router.get('/donors', getDonors);

module.exports = router;
