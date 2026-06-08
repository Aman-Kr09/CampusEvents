const express = require('express');
const router = express.Router();
const { getApprovedColleges, requestNewCollege } = require('../controllers/collegeController');

router.get('/', getApprovedColleges);
router.post('/request', requestNewCollege);

module.exports = router;
