const express = require('express');
const router = express.Router();
const {
  getOffCampusJobs,
  addOffCampusJob,
  editOffCampusJob,
  deleteOffCampusJob
} = require('../controllers/offCampusController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getOffCampusJobs);
router.post('/', authorize('Admin'), addOffCampusJob);
router.put('/:id', authorize('Admin'), editOffCampusJob);
router.delete('/:id', authorize('Admin'), deleteOffCampusJob);

module.exports = router;
