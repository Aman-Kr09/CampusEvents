const cloudinary  = require('cloudinary').v2;
const streamifier = require('stream').Readable;
const https       = require('https');
const http        = require('http');
const PYQ         = require('../models/PYQ');

// ─── Configure Cloudinary ─────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Helper: upload a buffer to Cloudinary via stream
 */
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    const readable = new streamifier();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

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

    // Determine resource type & file type
    const mime = req.file.mimetype;
    const isPDF   = mime === 'application/pdf';
    const isImage = mime.startsWith('image/');
    if (!isPDF && !isImage) {
      return res.status(400).json({ success: false, message: 'Only PDF and image files are allowed.' });
    }

    const resourceType = 'auto';
    const fileType     = isPDF ? 'pdf' : 'image';
    const collegeId    = req.user.college._id.toString();

    // Upload buffer → Cloudinary (no disk storage)
    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder:        `campusevents/pyq/${collegeId}`,
      resource_type: resourceType,
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
// Query params: semester, department, search, academicYear, examType
// ─────────────────────────────────────────────────────────────────────────────
exports.getPYQs = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const { semester, department, search, academicYear, examType } = req.query;

    // Always scope to the user's college
    const query = { college: collegeId };

    if (semester)     query.semester     = Number(semester);
    if (department)   query.department   = department;
    if (academicYear) query.academicYear = academicYear;
    if (examType)     query.examType     = examType;

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { subjectName: regex },
        { courseCode:  regex }
      ];
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
      college: req.user.college._id   // enforce college isolation
    }).populate('uploadedBy', 'name email');

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found.' });
    }

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
    const pyq = await PYQ.findOne({
      _id:     req.params.id,
      college: req.user.college._id
    });

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found.' });
    }

    // Only Admin or the original uploader may delete
    const isAdmin    = req.user.role === 'Admin';
    const isUploader = pyq.uploadedBy.toString() === req.user._id.toString();
    if (!isAdmin && !isUploader) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this PYQ.' });
    }

    // Remove file from Cloudinary (try raw, image, and auto)
    try {
      await cloudinary.uploader.destroy(pyq.publicId, { resource_type: pyq.fileType === 'pdf' ? 'raw' : 'image' });
    } catch (_) {}
    try {
      await cloudinary.uploader.destroy(pyq.publicId, { resource_type: 'image' });
    } catch (_) {}
    try {
      await cloudinary.uploader.destroy(pyq.publicId, { resource_type: 'auto' });
    } catch (_) {}

    await pyq.deleteOne();

    return res.status(200).json({ success: true, message: 'PYQ deleted successfully.' });
  } catch (error) {
    console.error('deletePYQ error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle bookmark for a PYQ
// @route   PUT /api/pyq/:id/bookmark
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.toggleBookmark = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({
      _id:     req.params.id,
      college: req.user.college._id
    });

    if (!pyq) {
      return res.status(404).json({ success: false, message: 'PYQ not found.' });
    }

    const userId    = req.user._id.toString();
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
// @desc    Get all PYQs bookmarked by the authenticated user
// @route   GET /api/pyq/bookmarks
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getBookmarks = async (req, res) => {
  try {
    const pyqs = await PYQ.find({
      college:      req.user.college._id,
      bookmarkedBy: req.user._id
    }).populate('uploadedBy', 'name email').sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: pyqs.length, pyqs });
  } catch (error) {
    console.error('getBookmarks error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all distinct departments for the college (dynamic branch list)
// @route   GET /api/pyq/departments
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getDepartments = async (req, res) => {
  try {
    const DEFAULT_DEPARTMENTS = ['CSE', 'ECE', 'EE', 'ME', 'CE', 'AIDS', 'VLSI'];

    const fromDB = await PYQ.distinct('department', { college: req.user.college._id });

    // Merge defaults + any custom department added via uploads
    const merged = [...new Set([...DEFAULT_DEPARTMENTS, ...fromDB])].sort();

    return res.status(200).json({ success: true, departments: merged });
  } catch (error) {
    console.error('getDepartments error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all distinct academic years for the college (dynamic year list)
// @route   GET /api/pyq/academic-years
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.getAcademicYears = async (req, res) => {
  try {
    const DEFAULT_YEARS = ['2024-25', '2023-24', '2022-23', '2021-22', '2020-21', '2019-20'];

    const fromDB = await PYQ.distinct('academicYear', { college: req.user.college._id });

    // Merge defaults + any custom academic year added via uploads without duplicates
    const merged = [...new Set([...DEFAULT_YEARS, ...fromDB].filter(Boolean))];

    // Sort descending (most recent year first)
    merged.sort((a, b) => b.localeCompare(a));

    return res.status(200).json({ success: true, academicYears: merged });
  } catch (error) {
    console.error('getAcademicYears error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Stream Helper ─────────────────────────────────────────────────────────────
const fetchRemoteStream = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (remoteRes) => {
      if (remoteRes.statusCode >= 300 && remoteRes.statusCode < 400 && remoteRes.headers.location) {
        return fetchRemoteStream(remoteRes.headers.location).then(resolve).catch(reject);
      }
      if (remoteRes.statusCode !== 200) {
        return reject(new Error(`Failed to fetch file (Status ${remoteRes.statusCode})`));
      }
      resolve(remoteRes);
    }).on('error', reject);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Stream PYQ file inline for browser preview (PDF/Image)
// @route   GET /api/pyq/:id/view
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.viewPYQFile = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({
      _id:     req.params.id,
      college: req.user.college._id
    });

    if (!pyq) {
      return res.status(404).send('PYQ document not found.');
    }

    const remoteStream = await fetchRemoteStream(pyq.fileUrl);
    const contentType  = pyq.fileType === 'pdf' ? 'application/pdf' : (remoteStream.headers['content-type'] || 'image/jpeg');
    const safeName     = `${pyq.subjectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${pyq.courseCode}.${pyq.fileType === 'pdf' ? 'pdf' : 'jpg'}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);

    remoteStream.pipe(res);
  } catch (error) {
    console.error('viewPYQFile error:', error.message);
    return res.status(500).send('Error streaming PYQ preview.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Stream PYQ file for attachment download
// @route   GET /api/pyq/:id/download
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
exports.downloadPYQFile = async (req, res) => {
  try {
    const pyq = await PYQ.findOne({
      _id:     req.params.id,
      college: req.user.college._id
    });

    if (!pyq) {
      return res.status(404).send('PYQ document not found.');
    }

    const remoteStream = await fetchRemoteStream(pyq.fileUrl);
    const contentType  = pyq.fileType === 'pdf' ? 'application/pdf' : 'application/octet-stream';
    const safeName     = `${pyq.subjectName.replace(/[^a-zA-Z0-9_-]/g, '_')}_${pyq.courseCode}.${pyq.fileType === 'pdf' ? 'pdf' : 'jpg'}`;

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);

    remoteStream.pipe(res);
  } catch (error) {
    console.error('downloadPYQFile error:', error.message);
    return res.status(500).send('Error downloading PYQ file.');
  }
};
