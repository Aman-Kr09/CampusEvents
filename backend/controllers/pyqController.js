const cloudinary  = require('cloudinary').v2;
const { Readable } = require('stream');
const PYQ          = require('../models/PYQ');

// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// ─── Helper: upload buffer → Cloudinary ───────────────────────────────────────
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// ─── Helper: inject a Cloudinary transformation flag into a stored URL ─────────
// Works by simple string replace — safe for filenames with spaces or special
// characters (no URL parsing that could corrupt the path).
//
// Example:
//   .../raw/upload/v123/folder/file.pdf
//   → .../raw/upload/fl_attachment/v123/folder/file.pdf
//
// For raw-type PDFs:   fl_attachment:false = serve inline (not forced download)
// For image-type files: fl_attachment      = force download
const injectFlag = (fileUrl, flag) => fileUrl.replace('/upload/', `/upload/${flag}/`);

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Upload a new PYQ (file + metadata)
// @route   POST /api/pyq
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadPYQ = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please attach a file (PDF or image).' });
    }

    const { subjectName, courseCode, semester, department, academicYear, examType } = req.body;

    if (!subjectName || !courseCode || !semester || !department || !academicYear || !examType) {
      return res.status(400).json({ success: false, message: 'All metadata fields are required.' });
    }

    const semNum = Number(semester);
    if (semNum < 1 || semNum > 7) {
      return res.status(400).json({ success: false, message: 'Semester must be between 1 and 7.' });
    }

    const mime    = req.file.mimetype;
    const isPDF   = mime === 'application/pdf';
    const isImage = mime.startsWith('image/');
    if (!isPDF && !isImage) {
      return res.status(400).json({ success: false, message: 'Only PDF and image files are allowed.' });
    }

    const fileType  = isPDF ? 'pdf' : 'image';
    const collegeId = req.user.college._id.toString();

    // PDFs → resource_type:'raw'   so the URL serves actual PDF bytes (not a thumbnail)
    // Images → resource_type:'image'
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder:        `campusevents/pyq/${collegeId}`,
      resource_type: isPDF ? 'raw' : 'image',
      public_id:     `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`
    });

    const pyq = await PYQ.create({
      college:      req.user.college._id,
      subjectName:  subjectName.trim(),
      courseCode:   courseCode.trim().toUpperCase(),
      semester:     semNum,
      department:   department.trim(),
      academicYear: academicYear.trim(),
      examType,
      fileUrl:      uploadResult.secure_url,
      publicId:     uploadResult.public_id,
      fileType,
      uploadedBy:   req.user._id
    });

    const populated = await PYQ.findById(pyq._id).populate('uploadedBy', 'name email');
    return res.status(201).json({ success: true, message: 'PYQ uploaded successfully.', pyq: populated });
  } catch (error) {
    console.error('uploadPYQ error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during upload.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all PYQs for the authenticated user's college (with filters)
// @route   GET /api/pyq
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getPYQs = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const { semester, department, search, academicYear, examType } = req.query;

    const query = { college: collegeId };
    if (semester)     query.semester     = Number(semester);
    if (department)   query.department   = department;
    if (academicYear) query.academicYear = academicYear;
    if (examType)     query.examType     = examType;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ subjectName: regex }, { courseCode: regex }];
    }

    const pyqs = await PYQ.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: pyqs.length, pyqs });
  } catch (error) {
    console.error('getPYQs error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get a single PYQ by ID
// @route   GET /api/pyq/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getPYQById = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({
      _id:     req.params.id,
      college: req.user.college._id
    }).populate('uploadedBy', 'name email');

    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });
    return res.status(200).json({ success: true, pyq });
  } catch (error) {
    console.error('getPYQById error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a PYQ (Admin or original uploader only)
// @route   DELETE /api/pyq/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.deletePYQ = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({ _id: req.params.id, college: req.user.college._id });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });

    const isAdmin    = req.user.role === 'Admin';
    const isUploader = pyq.uploadedBy.toString() === req.user._id.toString();
    if (!isAdmin && !isUploader) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this PYQ.' });
    }

    // Try both resource types — existing files may be stored under either
    try { await cloudinary.uploader.destroy(pyq.publicId, { resource_type: 'raw' }); } catch (_) {}
    try { await cloudinary.uploader.destroy(pyq.publicId, { resource_type: 'image' }); } catch (_) {}

    await pyq.deleteOne();
    return res.status(200).json({ success: true, message: 'PYQ deleted successfully.' });
  } catch (error) {
    console.error('deletePYQ error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle bookmark for a PYQ  (each user has their own separate list)
// @route   PUT /api/pyq/:id/bookmark
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleBookmark = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({ _id: req.params.id, college: req.user.college._id });
    if (!pyq) return res.status(404).json({ success: false, message: 'PYQ not found.' });

    const userId            = req.user._id.toString();
    const alreadyBookmarked = pyq.bookmarkedBy.some(id => id.toString() === userId);

    if (alreadyBookmarked) {
      pyq.bookmarkedBy = pyq.bookmarkedBy.filter(id => id.toString() !== userId);
    } else {
      pyq.bookmarkedBy.push(req.user._id);
    }

    await pyq.save();
    return res.status(200).json({
      success:    true,
      bookmarked: !alreadyBookmarked,
      message:    alreadyBookmarked ? 'Bookmark removed.' : 'PYQ bookmarked.'
    });
  } catch (error) {
    console.error('toggleBookmark error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all PYQs bookmarked by the currently logged-in user
// @route   GET /api/pyq/bookmarks
// @access  Private
// Each user's bookmarks are completely independent — scoped by req.user._id
// ─────────────────────────────────────────────────────────────────────────────
exports.getBookmarks = async (req, res) => {
  try {
    const pyqs = await PYQ.find({
      college:      req.user.college._id,
      bookmarkedBy: req.user._id          // ← only this user's bookmarks
    }).populate('uploadedBy', 'name email').sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: pyqs.length, pyqs });
  } catch (error) {
    console.error('getBookmarks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get distinct departments for this college
// @route   GET /api/pyq/departments
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const DEFAULT_DEPARTMENTS = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'AIDS', 'VLSI'];
    const fromDB = await PYQ.distinct('department', { college: req.user.college._id });
    const merged = [...new Set([...DEFAULT_DEPARTMENTS, ...fromDB])].sort();
    return res.status(200).json({ success: true, departments: merged });
  } catch (error) {
    console.error('getDepartments error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get distinct academic years for this college
// @route   GET /api/pyq/academic-years
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getAcademicYears = async (req, res) => {
  try {
    const DEFAULT_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20'];
    const fromDB = await PYQ.distinct('academicYear', { college: req.user.college._id });
    const merged = [...new Set([...DEFAULT_YEARS, ...fromDB].filter(Boolean))];
    merged.sort((a, b) => b.localeCompare(a));
    return res.status(200).json({ success: true, academicYears: merged });
  } catch (error) {
    console.error('getAcademicYears error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Serve PYQ inline for browser preview
// @route   GET /api/pyq/:id/view
// @access  Private
//
// Strategy:
//   • New PDFs (uploaded as raw type, URL contains /raw/upload/):
//       Add fl_attachment:false so Cloudinary serves the PDF inline.
//   • Old PDFs (uploaded as image type, URL contains /image/upload/):
//       Redirect directly — Cloudinary serves the first page as an image.
//   • Images: Redirect directly — Cloudinary serves images inline by default.
//
// WHY no signed URLs? — The stored URLs are already public (uploaded without
// private/authenticated mode). Signed URLs with expires_at are only for
// type:'authenticated' assets; using them on type:'upload' assets produces
// an invalid signature → HTTP 404.
// ─────────────────────────────────────────────────────────────────────────────
exports.viewPYQFile = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({ _id: req.params.id, college: req.user.college._id });
    if (!pyq) return res.status(404).send('PYQ not found.');

    let url = pyq.fileUrl;

    // For new PDF uploads (raw type): need fl_attachment:false to serve inline
    if (pyq.fileType === 'pdf' && url.includes('/raw/upload/')) {
      url = injectFlag(url, 'fl_attachment:false');
    }
    // Old image-type PDFs or regular images: redirect as-is

    return res.redirect(302, url);
  } catch (error) {
    console.error('viewPYQFile error:', error.message);
    return res.status(500).send('Error loading PYQ preview.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Download PYQ as a file attachment
// @route   GET /api/pyq/:id/download
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.downloadPYQFile = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({ _id: req.params.id, college: req.user.college._id });
    if (!pyq) return res.status(404).send('PYQ not found.');

    // fl_attachment forces Cloudinary to send Content-Disposition: attachment
    const downloadUrl = injectFlag(pyq.fileUrl, 'fl_attachment');
    return res.redirect(302, downloadUrl);
  } catch (error) {
    console.error('downloadPYQFile error:', error.message);
    return res.status(500).send('Error downloading PYQ file.');
  }
};
