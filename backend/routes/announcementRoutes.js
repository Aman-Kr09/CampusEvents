const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  editAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('Admin'), createAnnouncement);
router.put('/:id', authorize('Admin'), editAnnouncement);
router.delete('/:id', authorize('Admin'), deleteAnnouncement);

module.exports = router;
