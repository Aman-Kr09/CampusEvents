const express = require('express');
const router = express.Router();
const { smartSearch } = require('../controllers/searchController');
const { protect } = require('../middleware/auth');

router.get('/', protect, smartSearch);

module.exports = router;
