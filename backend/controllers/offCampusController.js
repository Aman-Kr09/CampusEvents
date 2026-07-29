const OffCampusJob = require('../models/OffCampusJob');
const { cacheGet, cacheSet, cacheDel } = require('../config/redisClient');
const { getExternalJobs } = require('../services/jobFeedService');

const CACHE_TTL = 15 * 60; // 15 minutes

// @desc    Get all off-campus job listings (DB admin posts + live external feed)
// @route   GET /api/off-campus
// @access  Private
exports.getOffCampusJobs = async (req, res) => {
  try {
    const collegeId = req.user.college._id.toString();
    const cacheKey = `off_campus_jobs:${collegeId}`;

    // ── 1. DB jobs (admin-posted, college-scoped) ────────────────────────────
    const cached = await cacheGet(cacheKey);
    const dbJobs = cached ?? await (async () => {
      const jobs = await OffCampusJob.find({ college: collegeId }).sort({ postedAt: -1 });
      await cacheSet(cacheKey, jobs, CACHE_TTL);
      return jobs;
    })();

    // ── 2. External live feed (Remotive + Himalayas, shared Redis cache) ─────
    let externalJobs = [];
    try {
      externalJobs = await getExternalJobs();
    } catch (extErr) {
      // Never let external feed failure break the response
      console.warn('[off-campus] External job feed unavailable:', extErr.message);
    }

    // ── 3. Merge: admin jobs first, then live feed ───────────────────────────
    const all = [...dbJobs, ...externalJobs];

    return res.status(200).json({
      success: true,
      count: all.length,
      dbCount: dbJobs.length,
      externalCount: externalJobs.length,
      data: all
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Add a new off-campus job listing (Admin only)
// @route   POST /api/off-campus
// @access  Private (Admin)
exports.addOffCampusJob = async (req, res) => {
  try {
    const collegeId = req.user.college._id.toString();

    const {
      title, company, location, employmentType, experience,
      salary, source, sourceLogo, applyUrl, postedAt,
      deadline, skills, logo, description
    } = req.body;

    if (!title || !company || !applyUrl) {
      return res.status(400).json({ success: false, message: 'title, company, and applyUrl are required' });
    }

    const job = await OffCampusJob.create({
      college: collegeId,
      title: title.trim(),
      company: company.trim(),
      location: location ? location.trim() : null,
      employmentType: employmentType || 'Full-Time',
      experience: experience ? experience.trim() : null,
      salary: salary ? salary.trim() : null,
      source: source ? source.trim() : null,
      sourceLogo: sourceLogo || null,
      applyUrl: applyUrl.trim(),
      postedAt: postedAt ? new Date(postedAt) : new Date(),
      deadline: deadline ? new Date(deadline) : null,
      skills: Array.isArray(skills) ? skills.map(s => s.trim()).filter(Boolean) : [],
      logo: logo || null,
      description: description ? description.trim() : null,
      postedBy: req.user._id
    });

    // Invalidate cache for this college
    await cacheDel(`off_campus_jobs:${collegeId}`);

    res.status(201).json({ success: true, message: 'Off-campus job added successfully', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit an off-campus job listing (Admin only)
// @route   PUT /api/off-campus/:id
// @access  Private (Admin)
exports.editOffCampusJob = async (req, res) => {
  try {
    let job = await OffCampusJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    if (job.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Sanitize skills array if provided
    const updateData = { ...req.body };
    if (updateData.skills && Array.isArray(updateData.skills)) {
      updateData.skills = updateData.skills.map(s => s.trim()).filter(Boolean);
    }
    if (updateData.deadline) {
      updateData.deadline = new Date(updateData.deadline);
    }
    if (updateData.postedAt) {
      updateData.postedAt = new Date(updateData.postedAt);
    }

    job = await OffCampusJob.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    // Invalidate cache
    const collegeId = req.user.college._id.toString();
    await cacheDel(`off_campus_jobs:${collegeId}`);

    res.status(200).json({ success: true, message: 'Off-campus job updated successfully', data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an off-campus job listing (Admin only)
// @route   DELETE /api/off-campus/:id
// @access  Private (Admin)
exports.deleteOffCampusJob = async (req, res) => {
  try {
    const job = await OffCampusJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job listing not found' });
    }

    if (job.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await OffCampusJob.findByIdAndDelete(req.params.id);

    // Invalidate cache
    const collegeId = req.user.college._id.toString();
    await cacheDel(`off_campus_jobs:${collegeId}`);

    res.status(200).json({ success: true, message: 'Off-campus job deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
