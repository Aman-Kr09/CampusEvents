const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/assistantController');
const { protect } = require('../middleware/auth');

// POST /api/assistant/chat  — authenticated students only
router.post('/chat', protect, chat);

module.exports = router;
