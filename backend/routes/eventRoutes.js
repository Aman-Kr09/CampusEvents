const express = require('express');
const router = express.Router();
const {
  getEvents,
  getRecommendedEvents,
  getTimelineEvents,
  getTrendingEvents,
  submitEvent,
  generateEventTags,
  registerForEvent,
  likeEvent,
  incrementViews,
  getPendingEvents,
  reviewEvent,
  editEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Protected student & admin general routes
router.use(protect);

router.get('/', getEvents);
router.get('/recommended', getRecommendedEvents);
router.get('/timeline', getTimelineEvents);
router.get('/trending', getTrendingEvents);
router.post('/', submitEvent);
router.post('/generate-tags', generateEventTags);
router.post('/:id/register', registerForEvent);
router.post('/:id/like', likeEvent);
router.post('/:id/view', incrementViews);

// Admin-only event routes
router.get('/admin/pending', authorize('Admin'), getPendingEvents);
router.put('/:id/review', authorize('Admin'), reviewEvent);
router.put('/:id', authorize('Admin'), editEvent);
router.delete('/:id', authorize('Admin'), deleteEvent);

module.exports = router;
