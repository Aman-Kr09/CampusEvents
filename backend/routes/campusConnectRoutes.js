const express = require('express');
const router = express.Router();
const {
  getMarketplaceItems,
  createMarketplaceItem,
  toggleSaveItem,
  markItemAsSold,
  deleteMarketplaceItem,
  getRideShares,
  createRideShare,
  joinRideShare,
  leaveRideShare,
  deleteRideShare,
  getConnectMessages,
  sendConnectMessage
} = require('../controllers/campusConnectController');
const { protect } = require('../middleware/auth');

// All Campus Connect routes require authentication
router.use(protect);

// ─── Marketplace Routes ───────────────────────────────────────────────────────
router.get('/marketplace', getMarketplaceItems);
router.post('/marketplace', createMarketplaceItem);
router.post('/marketplace/:id/save', toggleSaveItem);
router.patch('/marketplace/:id/status', markItemAsSold);
router.delete('/marketplace/:id', deleteMarketplaceItem);

// ─── Ride Share Routes ────────────────────────────────────────────────────────
router.get('/rides', getRideShares);
router.post('/rides', createRideShare);
router.post('/rides/:id/join', joinRideShare);
router.post('/rides/:id/leave', leaveRideShare);
router.delete('/rides/:id', deleteRideShare);

// ─── Chat Message Routes ──────────────────────────────────────────────────────
router.get('/chat/:targetType/:targetId', getConnectMessages);
router.post('/chat/:targetType/:targetId', sendConnectMessage);

module.exports = router;
