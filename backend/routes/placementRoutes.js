const express = require('express');
const router = express.Router();
const {
  getPlacementStats,
  addPlacementRecord,
  editPlacementRecord,
  deletePlacementRecord,
  addCompany,
  reviewCompany
} = require('../controllers/placementController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', getPlacementStats);
router.post('/', authorize('Admin'), addPlacementRecord);
router.put('/:id', authorize('Admin'), editPlacementRecord);
router.delete('/:id', authorize('Admin'), deletePlacementRecord);

// Recruiter Suggestions & Verification Queue
router.post('/:id/companies', addCompany);
router.put('/:id/companies/:companyId/review', authorize('Admin'), reviewCompany);

module.exports = router;
