const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const {
  uploadPYQ,
  getPYQs,
  getPYQById,
  deletePYQ,
  toggleBookmark,
  getBookmarks,
  getDepartments
} = require('../controllers/pyqController');
const { protect } = require('../middleware/auth');

// ─── Multer — memory storage (no local disk writes) ───────────────────────────
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF (.pdf) and image files (.jpg, .jpeg, .png) are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }   // 20 MB max
});

// ─── All PYQ routes require authentication ────────────────────────────────────
router.use(protect);

// Special named routes before /:id to avoid param collision
router.get('/bookmarks',   getBookmarks);
router.get('/departments', getDepartments);

// Core CRUD
router.get('/',    getPYQs);
router.post('/',   upload.single('file'), uploadPYQ);

router.get('/:id',          getPYQById);
router.delete('/:id',       deletePYQ);
router.put('/:id/bookmark', toggleBookmark);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;
