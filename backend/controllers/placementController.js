const Placement = require('../models/Placement');

// @desc    Get placement statistics for a college
// @route   GET /api/placements
// @access  Private
exports.getPlacementStats = async (req, res) => {
  try {
    const collegeId = req.user.college._id;
    const records = await Placement.find({ college: collegeId }).sort({ year: -1 });

    // If student, filter out pending/rejected companies
    if (req.user.role === 'Student') {
      const filteredRecords = records.map(record => {
        const doc = record.toObject();
        doc.companiesVisited = doc.companiesVisited.filter(c => c.status === 'Approved');
        return doc;
      });
      return res.status(200).json({ success: true, count: filteredRecords.length, data: filteredRecords });
    }

    res.status(200).json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add placement record (Admin only)
// @route   POST /api/placements
// @access  Private (Admin)
exports.addPlacementRecord = async (req, res) => {
  const { highestPackage, averagePackage, placementPercentage, companiesVisited, year } = req.body;

  try {
    const collegeId = req.user.college._id;

    // Check if record already exists for the year
    const existing = await Placement.findOne({ college: collegeId, year });
    if (existing) {
      return res.status(400).json({ success: false, message: `Placement data for year ${year} already exists. Please edit that record instead.` });
    }

    // Normalize companies visited input list to objects
    const normalizedCompanies = (companiesVisited || []).map(c => {
      if (typeof c === 'string') {
        return { name: c, status: 'Approved', addedBy: req.user._id };
      }
      return {
        name: c.name || c,
        cpaRequired: c.cpaRequired !== undefined ? c.cpaRequired : null,
        package: c.package !== undefined ? c.package : null,
        type: c.type || 'Non-Blocking',
        status: c.status || 'Approved',
        addedBy: c.addedBy || req.user._id
      };
    });

    const record = await Placement.create({
      college: collegeId,
      highestPackage,
      averagePackage,
      placementPercentage,
      companiesVisited: normalizedCompanies,
      year
    });

    res.status(201).json({ success: true, message: 'Placement statistics recorded successfully', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Edit placement record (Admin only)
// @route   PUT /api/placements/:id
// @access  Private (Admin)
exports.editPlacementRecord = async (req, res) => {
  try {
    let record = await Placement.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (record.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    let updateData = { ...req.body };
    if (updateData.companiesVisited) {
      updateData.companiesVisited = updateData.companiesVisited.map(c => {
        if (typeof c === 'string') {
          return { name: c, status: 'Approved', addedBy: req.user._id };
        }
        return c;
      });
    }

    record = await Placement.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.status(200).json({ success: true, message: 'Placement data updated', data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete placement record (Admin only)
// @route   DELETE /api/placements/:id
// @access  Private (Admin)
exports.deletePlacementRecord = async (req, res) => {
  try {
    const record = await Placement.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    if (record.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Placement.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Placement record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a company suggestion to a placement record
// @route   POST /api/placements/:id/companies
// @access  Private
exports.addCompany = async (req, res) => {
  const { companyName } = req.body;

  try {
    if (!companyName || !companyName.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a company name' });
    }

    const record = await Placement.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Placement record not found' });
    }

    // Suggested recruiters are approved by default so they are visible immediately until modified/deleted by Admin
    const status = 'Approved';

    // Prevent duplicate suggestions (pending/approved) under the same placement year record
    const exists = record.companiesVisited.some(
      c => c.name.toLowerCase() === companyName.trim().toLowerCase() && c.status !== 'Rejected'
    );
    if (exists) {
      return res.status(400).json({ success: false, message: 'This company suggestion already exists' });
    }

    record.companiesVisited.push({
      name: companyName.trim(),
      status,
      addedBy: req.user._id
    });

    await record.save();

    res.status(200).json({
      success: true,
      message: status === 'Approved' ? 'Company added successfully' : 'Recruiter suggestion submitted and is pending admin approval',
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Review a suggested company (Approve / Reject)
// @route   PUT /api/placements/:id/companies/:companyId/review
// @access  Private (Admin)
exports.reviewCompany = async (req, res) => {
  const { status } = req.body; // Approved or Rejected

  try {
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status' });
    }

    const record = await Placement.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Placement record not found' });
    }

    // Verify admin college matching
    if (record.college.toString() !== req.user.college._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const company = record.companiesVisited.id(req.params.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Suggested company not found' });
    }

    company.status = status;
    await record.save();

    res.status(200).json({
      success: true,
      message: `Recruiter suggestion has been ${status.toLowerCase()}`,
      data: record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
