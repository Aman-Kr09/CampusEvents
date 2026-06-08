const express = require('express');
const router = express.Router();
const {
  getGlobalAnalytics,
  getColleges,
  updateCollegeStatus,
  createCollegeAdmin,
  deleteCollege
} = require('../controllers/superAdminController');
const { protect, authorize } = require('../middleware/auth');

// Apply protection & role restriction to all routes here
router.use(protect);
router.use(authorize('SuperAdmin'));

router.get('/analytics', getGlobalAnalytics);
router.get('/colleges', getColleges);
router.put('/colleges/:id/status', updateCollegeStatus);
router.post('/admins', createCollegeAdmin);
router.delete('/colleges/:id', deleteCollege);

module.exports = router;
